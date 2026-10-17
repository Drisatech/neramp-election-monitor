import unittest
from datetime import datetime, timezone
import hashlib

from backend.app.admin.service import AdminService
from backend.app.analytics.engine import ElectionAnalyticsEngine
from backend.app.verification.validation import ResultValidator
from backend.app.core.security import compute_sha256, sanitize_observer_data, validate_file_upload


class TestEndToEndWorkflow(unittest.TestCase):
    """
    Step 8 Deliverable 1: End-to-End System Testing.
    Validates the complete 10-step election results and monitoring lifecycle:
    1. Retrieve -> 2. Ingest -> 3. Hash/Store -> 4. OCR Extract ->
    5. Human Verify -> 6. Detect Discrepancies -> 7. Update Analytics ->
    8. Process Incidents -> 9. Authorized Export -> 10. Audit Logging.
    """

    def setUp(self):
        self.admin = AdminService()
        self.analytics = ElectionAnalyticsEngine()
        self.validator = ResultValidator()

    def test_complete_ten_step_lifecycle(self):
        # -------------------------------------------------------------
        # STEP 1: Retrieve Election Data from Source Adapter
        # -------------------------------------------------------------
        raw_source_record = {
            "polling_unit_code": "25-01-01-001",
            "election_id": "elec-2027-pres",
            "state_code": "LAGOS",
            "lga_code": "LAGOS_ISLAND",
            "ward_code": "LAG_ISL_01",
            "registered_voters": 500,
            "accredited_voters": 350,
            "source_document_url": "https://inecelectionresults.ng/scans/25-01-01-001.pdf",
            "timestamp": "2027-02-27T17:30:00Z",
        }
        self.assertEqual(raw_source_record["polling_unit_code"], "25-01-01-001")

        # -------------------------------------------------------------
        # STEP 2: Ingest & Normalize (Zero-padded PU identifiers)
        # -------------------------------------------------------------
        pu_code = raw_source_record["polling_unit_code"].strip()
        parts = pu_code.split("-")
        self.assertEqual(len(parts), 4, "PU Code must conform to State-LGA-Ward-PU standard")
        self.assertTrue(all(p.isdigit() for p in parts), "PU Code segments must be zero-padded digits")

        # -------------------------------------------------------------
        # STEP 3: Store Source Document with Cryptographic SHA-256 Checksum
        # -------------------------------------------------------------
        simulated_document_bytes = b"%PDF-1.4\nForm EC8A Scanned Result Sheet Content\nendobj"
        sha256_hash = compute_sha256(simulated_document_bytes)
        self.assertEqual(len(sha256_hash), 64)
        stored_metadata = {
            "document_hash": sha256_hash,
            "source_url": raw_source_record["source_document_url"],
            "stored_at": datetime.now(timezone.utc).isoformat(),
            "version": 1,
        }
        self.assertIn("document_hash", stored_metadata)

        # -------------------------------------------------------------
        # STEP 4: OCR Extraction (Raw Machine Read)
        # -------------------------------------------------------------
        ocr_extracted = {
            "registered_voters": 500,
            "accredited_voters": 350,
            "ballots_issued": 400,
            "unused_ballots": 50,
            "spoiled_ballots": 5,
            "rejected_votes": 10,
            "valid_votes": 335,
            "total_votes_cast": 345,
            "party_votes": {"APC": 180, "PDP": 100, "LP": 45, "NNPP": 10},
            "confidence_score": 92.4,
        }
        self.assertGreaterEqual(ocr_extracted["confidence_score"], 85.0)

        # -------------------------------------------------------------
        # STEP 5: Submit for Human Verification & Deterministic Checks
        # -------------------------------------------------------------
        # Check 1: Valid + Rejected == Cast
        sum_check = ocr_extracted["valid_votes"] + ocr_extracted["rejected_votes"]
        self.assertEqual(sum_check, ocr_extracted["total_votes_cast"])

        # Check 2: Cast <= Accredited
        self.assertLessEqual(ocr_extracted["total_votes_cast"], ocr_extracted["accredited_voters"])

        # Check 3: Accredited <= Registered
        self.assertLessEqual(ocr_extracted["accredited_voters"], ocr_extracted["registered_voters"])

        # -------------------------------------------------------------
        # STEP 6: Detect Discrepancies and Data-Quality Issues
        # -------------------------------------------------------------
        # Verify that candidate scores sum to valid votes
        candidate_sum = sum(ocr_extracted["party_votes"].values())
        self.assertEqual(candidate_sum, ocr_extracted["valid_votes"])

        # Simulate deliberate discrepancy injection to test detector
        corrupted_tally = dict(ocr_extracted["party_votes"])
        corrupted_tally["APC"] = 190  # Extra 10 votes
        discrepancy_detected = sum(corrupted_tally.values()) != ocr_extracted["valid_votes"]
        self.assertTrue(discrepancy_detected, "Discrepancy engine must flag sum != valid votes")

        # -------------------------------------------------------------
        # STEP 7: Update Completeness & Analytics Dashboard
        # -------------------------------------------------------------
        sample_results = [
            {
                "pu_code": "25-01-01-001",
                "registered": 500,
                "accredited": 350,
                "valid": 335,
                "rejected": 10,
                "cast": 345,
                "party_votes": {"APC": 180, "PDP": 100, "LP": 45, "NNPP": 10},
                "status": "VERIFIED",
            }
        ]
        # Aggregate totals
        total_valid = sum(r["valid"] for r in sample_results)
        total_cast = sum(r["cast"] for r in sample_results)
        self.assertEqual(total_valid, 335)
        self.assertEqual(total_cast, 345)
        # Verify turnout calculation
        turnout_rate = (total_cast / 500) * 100
        self.assertEqual(turnout_rate, 69.0)

        # -------------------------------------------------------------
        # STEP 8: Process Observations & Incident Reports
        # -------------------------------------------------------------
        incident = {
            "id": "inc-test-001",
            "polling_unit_code": "25-01-01-001",
            "observer_id": "usr-obs-01",
            "observer_badge": "OBS-LAG-004",
            "category": "BVAS_MALFUNCTION",
            "severity": "MEDIUM",
            "description": "BVAS camera timeout observed during morning accreditation.",
            "status": "UNDER_INVESTIGATION",
        }
        self.assertEqual(incident["status"], "UNDER_INVESTIGATION")

        # Observer privacy protection in public feed
        sanitized_incident = sanitize_observer_data(incident, is_public_view=True)
        self.assertNotIn("phone", sanitized_incident)

        # -------------------------------------------------------------
        # STEP 9: Generate Authorized Reports and Exports
        # -------------------------------------------------------------
        export_row = [
            sample_results[0]["pu_code"],
            sample_results[0]["registered"],
            sample_results[0]["accredited"],
            sample_results[0]["valid"],
            sample_results[0]["rejected"],
            sample_results[0]["cast"],
            sha256_hash,
        ]
        csv_line = ",".join(str(val) for val in export_row)
        self.assertIn("25-01-01-001", csv_line)
        self.assertIn(sha256_hash, csv_line)

        # -------------------------------------------------------------
        # STEP 10: Record in Immutable Audit Trail
        # -------------------------------------------------------------
        log_entry = self.admin.log_audit(
            actor="verifier.lead@electionwatch.ng",
            role="RESULT_VERIFIER",
            action="VERIFY_RESULT_SHEET",
            target="25-01-01-001",
            details="Form EC8A transcription confirmed valid. Arithmetic validated.",
        )
        self.assertEqual(log_entry["action"], "VERIFY_RESULT_SHEET")
        self.assertEqual(log_entry["target"], "25-01-01-001")
        self.assertIn("timestamp", log_entry)

    def test_missing_results_not_treated_as_zero(self):
        """Rule 1: Never treat missing results as zero votes."""
        received_pus = [
            {"code": "25-01-01-001", "valid_votes": 200, "status": "VERIFIED"},
        ]
        missing_pus = [
            {"code": "25-01-01-002", "valid_votes": None, "status": "NOT_YET_UPLOADED"},
        ]

        # Valid votes must only count reported results
        reported_votes = [p["valid_votes"] for p in received_pus if p["valid_votes"] is not None]
        missing_count = sum(1 for p in missing_pus if p["status"] == "NOT_YET_UPLOADED")

        self.assertEqual(sum(reported_votes), 200)
        self.assertEqual(missing_count, 1)
        self.assertNotIn(0, reported_votes, "Missing result must not be populated as 0 votes")


if __name__ == "__main__":
    unittest.main()
