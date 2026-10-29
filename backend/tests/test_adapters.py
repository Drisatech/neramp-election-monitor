import unittest
from backend.app.integrations.adapters import (
    DevelopmentFixtureAdapter,
    InecApprovedSourceAdapter,
)


class TestAdapters(unittest.IsolatedAsyncioTestCase):
    async def test_development_fixture_adapter(self):
        adapter = DevelopmentFixtureAdapter()
        self.assertFalse(adapter.is_live_official_source())
        self.assertIn("DevelopmentFixtureAdapter", adapter.get_adapter_name())

        conn = await adapter.test_connection()
        self.assertEqual(conn["status"], "connected")
        self.assertEqual(conn["mode"], "DEVELOPMENT_FIXTURE")

        records = await adapter.fetch_polling_unit_records("elec-2027-pres", limit=2)
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].form_type, "EC8A")
        self.assertTrue(records[0].is_demonstration)
        self.assertEqual(len(records[0].file_hash), 64)

    async def test_inec_approved_adapter_requires_credentials(self):
        # Without API credentials, must be marked inactive and pending configuration
        adapter = InecApprovedSourceAdapter(api_key=None)
        self.assertFalse(adapter.is_live_official_source())

        conn = await adapter.test_connection()
        self.assertIn(conn["status"], {"PORTAL_REACHABLE", "PORTAL_UNREACHABLE", "CLIENT_UNAVAILABLE"})
        self.assertFalse(conn["is_active"])

        with self.assertRaises(RuntimeError):
            await adapter.fetch_polling_unit_records("elec-2027-pres")


    async def test_inec_approved_adapter_synthetic_responses(self):
        adapter = InecApprovedSourceAdapter(api_key=None, synthetic_mode=True)
        self.assertFalse(adapter.is_live_official_source())

        conn = await adapter.test_connection()
        self.assertEqual(conn["status"], "SIMULATED")
        self.assertFalse(conn["is_active"])
        self.assertIn("Governorship election - 2026-08-15 - OSUN", conn["target_election"])

        # Fetch synthetic canonical records
        records = await adapter.fetch_polling_unit_records("elec-2026-gov-osun", limit=3, offset=0)
        self.assertEqual(len(records), 3)

        rec = records[0]
        # Preserve zero-padded PU code
        self.assertEqual(rec.polling_unit_code, "29-24-01-001")
        self.assertEqual(rec.form_type, "EC8A")
        self.assertEqual(rec.election_id, "elec-2026-gov-osun")
        self.assertTrue(rec.is_demonstration)
        self.assertEqual(rec.source_status, "DEMONSTRATION")
        self.assertEqual(rec.version, 1)
        self.assertEqual(len(rec.file_hash), 64)
        self.assertIn("digitaloceanspaces.com", rec.source_url)
        self.assertGreater(rec.registered_voters, 0)
        self.assertGreater(rec.accredited_voters, 0)

    async def test_inec_approved_adapter_pagination(self):
        adapter = InecApprovedSourceAdapter(api_key=None, synthetic_mode=True)
        page1 = await adapter.fetch_polling_unit_records("elec-2026-gov-osun", limit=2, offset=0)
        page2 = await adapter.fetch_polling_unit_records("elec-2026-gov-osun", limit=2, offset=2)
        self.assertEqual(len(page1), 2)
        self.assertEqual(len(page2), 2)
        self.assertNotEqual(page1[0].polling_unit_code, page2[0].polling_unit_code)

    async def test_ingestion_pipeline_idempotency_and_versioning(self):
        from backend.app.ingestion.scheduler import IngestionPipelineService
        from backend.app.integrations.adapters import SourceRecord
        import hashlib
        from datetime import datetime, timezone

        adapter = InecApprovedSourceAdapter(api_key=None, synthetic_mode=True)
        service = IngestionPipelineService(adapter=adapter)

        # Run 1: initial ingestion
        job1 = await service.execute_ingestion(limit=5, actor="admin:test")
        self.assertEqual(job1["status"], "COMPLETED")
        self.assertEqual(job1["records_retrieved"], 5)
        self.assertEqual(job1["records_processed"], 5)
        self.assertEqual(job1["records_skipped_duplicate"], 0)

        # Run 2: idempotent repeat ingestion (identical checksums)
        job2 = await service.execute_ingestion(limit=5, actor="admin:test")
        self.assertEqual(job2["status"], "COMPLETED")
        self.assertEqual(job2["records_retrieved"], 5)
        self.assertEqual(job2["records_processed"], 0)
        self.assertEqual(job2["records_skipped_duplicate"], 5)

        # Simulate a revised Form EC8A sheet with modified SHA-256 hash
        pu_code = "29-24-01-001"
        revised_hash = hashlib.sha256(b"revised_osun_ec8a_corrected_arithmetic").hexdigest()
        revised_record = SourceRecord(
            polling_unit_code=pu_code,
            election_id="elec-2026-gov-osun",
            form_type="EC8A",
            source_url="https://irev-results.lon1.digitaloceanspaces.com/revised_29-24-01-001.jpg",
            file_hash=revised_hash,
            source_timestamp=datetime.now(timezone.utc),
            registered_voters=680,
            accredited_voters=412,
            is_demonstration=True,
            source_status="DEMONSTRATION",
        )

        class CustomRevisedAdapter(InecApprovedSourceAdapter):
            async def fetch_polling_unit_records(self, election_id, state_code=None, limit=100, offset=0):
                return [revised_record]

        service.adapter = CustomRevisedAdapter(synthetic_mode=True)
        job3 = await service.execute_ingestion(limit=1, actor="admin:revision_test")
        self.assertEqual(job3["records_processed"], 1)
        self.assertEqual(job3["records_revised"], 1)

        # Check preserved version history
        cached = service.ingested_records_cache[pu_code]
        self.assertEqual(cached["version"], 2)
        self.assertEqual(cached["source_status"], "REVISED_VERSION")
        self.assertEqual(cached["file_hash"], revised_hash)


if __name__ == "__main__":
    unittest.main()

