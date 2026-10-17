import asyncio
import unittest
import time

from backend.app.core.reliability import (
    CircuitBreaker,
    CircuitBreakerOpenException,
    retry_with_backoff,
    CacheManager,
    JobMutex,
)


class TestReliabilityAndResilience(unittest.TestCase):
    def test_circuit_breaker_transitions(self):
        cb = CircuitBreaker("test_breaker", failure_threshold=2, recovery_timeout_seconds=0.1)
        self.assertEqual(cb.state, "CLOSED")

        # 1st failure
        cb.record_failure()
        self.assertEqual(cb.state, "CLOSED")
        self.assertTrue(cb.can_execute())

        # 2nd failure reaches threshold -> OPEN
        cb.record_failure()
        self.assertEqual(cb.state, "OPEN")
        self.assertFalse(cb.can_execute())

        # Wait for recovery timeout
        time.sleep(0.15)
        self.assertTrue(cb.can_execute())
        self.assertEqual(cb.state, "HALF_OPEN")

        # Success in HALF_OPEN resets to CLOSED
        cb.record_success()
        self.assertEqual(cb.state, "CLOSED")

    def test_cache_manager_operations_and_tag_invalidation(self):
        cm = CacheManager()
        cm.set("summary_national", {"totalVotes": 1000}, ttl_seconds=60, tags=["national", "election"])
        cm.set("summary_lagos", {"totalVotes": 400}, ttl_seconds=60, tags=["state", "election"])

        # Fetching
        self.assertIsNotNone(cm.get("summary_national"))
        self.assertEqual(cm.get("summary_national")["totalVotes"], 1000)

        # Invalidate by tag "national"
        cm.invalidate_by_tag("national")
        self.assertIsNone(cm.get("summary_national"))
        self.assertIsNotNone(cm.get("summary_lagos"))

        # Invalidate all with "election"
        cm.invalidate_by_tag("election")
        self.assertIsNone(cm.get("summary_lagos"))

    def test_job_mutex_locking(self):
        mutex = JobMutex()
        lock_name = "inec_ingestion_lock"

        # Initially unlocked
        self.assertFalse(mutex.is_locked(lock_name))

        # First acquisition succeeds
        acquired = mutex.acquire(lock_name, lock_timeout_seconds=60.0)
        self.assertTrue(acquired)
        self.assertTrue(mutex.is_locked(lock_name))

        # Concurrent acquisition fails
        second_attempt = mutex.acquire(lock_name, lock_timeout_seconds=60.0)
        self.assertFalse(second_attempt)

        # Release lock
        mutex.release(lock_name)
        self.assertFalse(mutex.is_locked(lock_name))

        # Can now acquire again
        reacquired = mutex.acquire(lock_name)
        self.assertTrue(reacquired)

    def test_retry_with_backoff_success(self):
        attempts = 0

        async def flaky_service():
            nonlocal attempts
            attempts += 1
            if attempts < 2:
                raise ConnectionError("Temporary glitch")
            return "SUCCESS_DATA"

        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                retry_with_backoff(flaky_service, max_retries=3, base_delay=0.01, jitter=False)
            )
            self.assertEqual(result, "SUCCESS_DATA")
            self.assertEqual(attempts, 2)
        finally:
            loop.close()


if __name__ == "__main__":
    unittest.main()
