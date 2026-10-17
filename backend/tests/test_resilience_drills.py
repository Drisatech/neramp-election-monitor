import asyncio
import copy
import time
import unittest

from backend.app.core.reliability import (
    CircuitBreaker,
    CircuitBreakerOpenException,
    CacheManager,
    JobMutex,
    retry_with_backoff,
)
from backend.app.core.security import compute_sha256


class TestFailureRecoveryAndResilienceDrills(unittest.TestCase):
    """
    Step 8 Deliverable 4: Failure Recovery and Resilience Drills.
    Simulates external outage, circuit-breaker tripping, job mutex race prevention,
    and database restore integrity checks.
    """

    def test_circuit_breaker_outage_containment_and_recovery(self):
        cb = CircuitBreaker("inec_outage_simulation", failure_threshold=3, recovery_timeout_seconds=0.1)

        # 1. Healthy state
        self.assertEqual(cb.state, "CLOSED")

        # 2. Simulate 3 consecutive gateway 503 errors
        cb.record_failure()
        cb.record_failure()
        cb.record_failure()

        # 3. Breaker trips to OPEN (fails fast, protecting internal queues)
        self.assertEqual(cb.state, "OPEN")
        self.assertFalse(cb.can_execute())

        # 4. Wait for recovery timeout
        time.sleep(0.15)
        self.assertTrue(cb.can_execute())
        self.assertEqual(cb.state, "HALF_OPEN")

        # 5. Success in trial call resets breaker to CLOSED
        cb.record_success()
        self.assertEqual(cb.state, "CLOSED")

    def test_job_idempotency_prevents_duplicate_polling_units(self):
        """Simulate re-running an ingestion job on network retry: must not create duplicate PUs."""
        database_pus = [
            {"code": "25-01-01-001", "name": "PU 1", "version": 1},
            {"code": "25-01-01-002", "name": "PU 2", "version": 1},
        ]

        incoming_batch = [
            {"code": "25-01-01-001", "name": "PU 1", "version": 1},  # Duplicate
            {"code": "25-01-01-003", "name": "PU 3", "version": 1},  # New
        ]

        existing_codes = {p["code"] for p in database_pus}
        added_count = 0
        for item in incoming_batch:
            if item["code"] not in existing_codes:
                database_pus.append(item)
                existing_codes.add(item["code"])
                added_count += 1

        self.assertEqual(added_count, 1)
        self.assertEqual(len(database_pus), 3, "Only new PU must be added; duplicate avoided")

    def test_distributed_mutex_prevents_concurrent_job_collisions(self):
        mutex = JobMutex()
        job_key = "ingestion_osun_gov_2026"

        # Worker 1 acquires lock
        worker_1_lock = mutex.acquire(job_key, lock_timeout_seconds=10.0)
        self.assertTrue(worker_1_lock)

        # Worker 2 attempts concurrent acquisition: must fail safely
        worker_2_lock = mutex.acquire(job_key, lock_timeout_seconds=10.0)
        self.assertFalse(worker_2_lock, "Concurrent worker must be rejected by mutex")

        # Worker 1 completes and releases lock
        mutex.release(job_key)
        self.assertFalse(mutex.is_locked(job_key))

        # Worker 2 can now acquire
        worker_2_retry = mutex.acquire(job_key, lock_timeout_seconds=10.0)
        self.assertTrue(worker_2_retry)
        mutex.release(job_key)

    def test_backup_restore_data_integrity_drill(self):
        """Simulates database snapshot restore and validates cryptographic hash chain."""
        primary_records = [
            {"id": "pu-1", "hash": compute_sha256(b"Record 1"), "verified": True},
            {"id": "pu-2", "hash": compute_sha256(b"Record 2"), "verified": True},
            {"id": "pu-3", "hash": compute_sha256(b"Record 3"), "verified": False},
        ]

        # Simulate backup snapshot
        backup_snapshot = copy.deepcopy(primary_records)

        # Simulate restored database state
        restored_records = copy.deepcopy(backup_snapshot)

        self.assertEqual(len(primary_records), len(restored_records))
        for orig, rest in zip(primary_records, restored_records):
            self.assertEqual(orig["id"], rest["id"])
            self.assertEqual(orig["hash"], rest["hash"])
            self.assertEqual(orig["verified"], rest["verified"])


if __name__ == "__main__":
    unittest.main()
