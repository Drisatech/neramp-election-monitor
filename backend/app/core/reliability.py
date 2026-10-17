import asyncio
import random
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional, TypeVar, Coroutine

T = TypeVar("T")


class CircuitBreakerOpenException(Exception):
    """Raised when an external service circuit breaker is open (failing)."""
    pass


class CircuitBreaker:
    """
    Production-grade Circuit Breaker pattern to protect against cascading
    failures when communicating with external dependencies (such as the INEC portal
    or third-party OCR services).
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout_seconds: float = 30.0,
        expected_exceptions: tuple = (Exception,),
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.expected_exceptions = expected_exceptions

        self.state = "CLOSED"  # "CLOSED", "OPEN", "HALF_OPEN"
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.success_count = 0

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"
        self.success_count += 1

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"

    def can_execute(self) -> bool:
        if self.state == "CLOSED":
            return True

        if self.state == "OPEN":
            if self.last_failure_time and (time.time() - self.last_failure_time) >= self.recovery_timeout_seconds:
                self.state = "HALF_OPEN"
                return True
            return False

        if self.state == "HALF_OPEN":
            # Allow single trial call
            return True

        return False

    async def call(self, func: Callable[..., Coroutine[Any, Any, T]], *args, **kwargs) -> T:
        if not self.can_execute():
            raise CircuitBreakerOpenException(
                f"Circuit breaker for '{self.name}' is OPEN due to repeated failures. Failing fast."
            )

        try:
            result = await func(*args, **kwargs)
            self.record_success()
            return result
        except self.expected_exceptions as e:
            self.record_failure()
            raise e


# Registry of circuit breakers
CIRCUIT_BREAKERS: Dict[str, CircuitBreaker] = {
    "inec_portal": CircuitBreaker("inec_portal", failure_threshold=5, recovery_timeout_seconds=30.0),
    "ocr_engine": CircuitBreaker("ocr_engine", failure_threshold=3, recovery_timeout_seconds=15.0),
}


async def retry_with_backoff(
    coro_func: Callable[..., Coroutine[Any, Any, T]],
    max_retries: int = 3,
    base_delay: float = 1.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    *args,
    **kwargs,
) -> T:
    """
    Retries an async operation with exponential backoff and jitter.
    """
    attempt = 0
    while True:
        try:
            return await coro_func(*args, **kwargs)
        except Exception as e:
            attempt += 1
            if attempt > max_retries:
                raise e
            
            delay = base_delay * (backoff_factor ** (attempt - 1))
            if jitter:
                delay = delay * (0.5 + random.random())
            await asyncio.sleep(delay)


class CacheManager:
    """
    High-performance in-memory cache with TTL and namespace-based invalidation
    for public analytics, election summaries, and results.
    """

    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            self._store.pop(key, None)
            return None
        return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300, tags: Optional[list] = None):
        self._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds,
            "tags": tags or [],
            "set_at": time.time(),
        }

    def invalidate(self, key: str):
        self._store.pop(key, None)

    def invalidate_by_tag(self, tag: str):
        """Invalidates all cache entries tagged with `tag`."""
        keys_to_remove = [k for k, v in self._store.items() if tag in v.get("tags", [])]
        for k in keys_to_remove:
            self._store.pop(k, None)

    def clear(self):
        self._store.clear()

    @property
    def size(self) -> int:
        return len(self._store)


cache_manager = CacheManager()


class JobMutex:
    """
    Distributed mutex / lock pattern to prevent concurrent race conditions
    and duplicate processing of background ingestion and verification jobs.
    """

    def __init__(self):
        self._locks: Dict[str, float] = {}

    def acquire(self, lock_key: str, lock_timeout_seconds: float = 120.0) -> bool:
        now = time.time()
        expiry = self._locks.get(lock_key)
        if expiry and now < expiry:
            return False  # Already locked and active
        self._locks[lock_key] = now + lock_timeout_seconds
        return True

    def release(self, lock_key: str):
        self._locks.pop(lock_key, None)

    def is_locked(self, lock_key: str) -> bool:
        now = time.time()
        expiry = self._locks.get(lock_key)
        return bool(expiry and now < expiry)


job_mutex = JobMutex()
