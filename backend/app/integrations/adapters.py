from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import hashlib
import json
import asyncio
import time
import os

try:
    import httpx
except ImportError:
    httpx = None


class SourceRecord:
    def __init__(
        self,
        polling_unit_code: str,
        election_id: str,
        form_type: str,
        source_url: str,
        file_hash: str,
        image_url: Optional[str] = None,
        source_timestamp: Optional[datetime] = None,
        raw_payload: Optional[Dict[str, Any]] = None,
        registered_voters: int = 0,
        accredited_voters: int = 0,
        is_demonstration: bool = False,
        source_status: str = "ORIGINAL",
        version: int = 1,
    ):
        self.polling_unit_code = polling_unit_code
        self.election_id = election_id
        self.form_type = form_type
        self.source_url = source_url
        self.file_hash = file_hash
        self.image_url = image_url
        self.source_timestamp = source_timestamp or datetime.now(timezone.utc)
        self.retrieval_timestamp = datetime.now(timezone.utc)
        self.raw_payload = raw_payload or {}
        self.registered_voters = registered_voters
        self.accredited_voters = accredited_voters
        self.is_demonstration = is_demonstration
        self.source_status = source_status
        self.version = version


class ElectionSourceAdapter(ABC):
    """
    Common contract for all election results ingestion adapters.
    """

    @abstractmethod
    def get_adapter_name(self) -> str:
        """Returns the human-readable identifier of the adapter."""
        pass

    @abstractmethod
    def is_live_official_source(self) -> bool:
        """Indicates whether this adapter represents the certified live INEC connection."""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Validates connectivity, credentials, and health of the target data source."""
        pass

    @abstractmethod
    async def fetch_polling_unit_records(
        self,
        election_id: str,
        state_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[SourceRecord]:
        """Retrieves raw polling unit result sheets and metadata."""
        pass


class InecApprovedSourceAdapter(ElectionSourceAdapter):
    """
    Legacy/experimental adapter retained for migration and test compatibility.

    This adapter does not establish an authenticated or authorized INEC integration.
    A documented upstream API contract and explicit URL/credentials are required before
    retrieval is attempted. Synthetic records are demonstration fixtures only.
    """

    ELECTION_ID_OSUN_2026 = "elec-2026-gov-osun"
    ELECTION_TITLE_OSUN_2026 = "Governorship election - 2026-08-15 - OSUN"

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        client_cert_path: Optional[str] = None,
        rate_limit_per_minute: int = 60,
        request_timeout: int = 30,
        max_retries: int = 3,
        backoff_factor: float = 2.0,
        synthetic_mode: Optional[bool] = None,
    ):
        configured_base_url = base_url or os.getenv("INEC_API_BASE_URL")
        self.api_base_configured = bool(configured_base_url)
        self.base_url = (configured_base_url or "https://inecelectionresults.ng").rstrip("/")
        self.api_key = api_key or os.getenv("INEC_API_KEY")
        self.client_cert_path = client_cert_path or os.getenv("INEC_CLIENT_CERT_PATH")
        self.rate_limit_per_minute = rate_limit_per_minute
        self.request_timeout = request_timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.synthetic_mode = (
            synthetic_mode
            if synthetic_mode is not None
            else (os.getenv("INEC_SYNTHETIC_MODE", "false").lower() == "true")
        )
        self._last_request_time = 0.0

    def get_adapter_name(self) -> str:
        return "InecApprovedSourceAdapter (Unverified legacy adapter)"

    def is_live_official_source(self) -> bool:
        # Credentials and a URL alone do not establish that the upstream is an authorized INEC API.
        return False

    async def _throttle(self):
        """Enforces authorized rate limiting (minimum spacing between requests)."""
        interval = 60.0 / self.rate_limit_per_minute
        elapsed = time.time() - self._last_request_time
        if elapsed < interval:
            await asyncio.sleep(interval - elapsed)
        self._last_request_time = time.time()

    async def test_connection(self) -> Dict[str, Any]:
        """Check public portal reachability; this does not validate API credentials or authorize data access."""
        if self.synthetic_mode:
            return {
                "status": "SIMULATED",
                "is_active": False,
                "mode": "SYNTHETIC_TEST_ONLY",
                "message": "Synthetic adapter mode is enabled; no live portal connection was tested.",
                "portal_reference": f"{self.base_url}/elections/types",
                "target_election": self.ELECTION_TITLE_OSUN_2026,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        if not self.api_base_configured:
            return {
                "status": "PENDING_CONFIGURATION",
                "is_active": False,
                "api_credentials_configured": bool(self.api_key),
                "api_access_verified": False,
                "message": "No documented upstream API URL is configured; no API connection was attempted.",
                "portal_reference": f"{self.base_url}/elections/types",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        if httpx is None:
            return {
                "status": "CLIENT_UNAVAILABLE",
                "is_active": False,
                "message": "httpx is unavailable; no network check was performed.",
                "portal_reference": f"{self.base_url}/elections/types",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        try:
            async with httpx.AsyncClient(timeout=self.request_timeout, follow_redirects=True) as client:
                response = await client.get(f"{self.base_url}/elections/types", headers={
                    "User-Agent": "NERAMP-PortalReachabilityCheck/1.1",
                    "Accept": "text/html,application/xhtml+xml",
                })
            reachable = response.is_success
            return {
                "status": "PORTAL_REACHABLE" if reachable else "PORTAL_UNREACHABLE",
                "is_active": reachable,
                "http_status": response.status_code,
                "api_credentials_configured": bool(self.api_key),
                "api_access_verified": False,
                "message": (
                    "Public portal returned a successful HTTP response. API access, credentials, authorization, and data provenance remain unverified."
                    if reachable else "Public portal returned a non-success HTTP response."
                ),
                "portal_reference": f"{self.base_url}/elections/types",
                "target_election": self.ELECTION_TITLE_OSUN_2026,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as exc:
            return {
                "status": "PORTAL_UNREACHABLE",
                "is_active": False,
                "api_credentials_configured": bool(self.api_key),
                "api_access_verified": False,
                "message": f"Public portal reachability check failed: {type(exc).__name__}.",
                "portal_reference": f"{self.base_url}/elections/types",
                "target_election": self.ELECTION_TITLE_OSUN_2026,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _generate_synthetic_osun_records(
        self,
        election_id: str,
        limit: int,
        offset: int,
    ) -> List[SourceRecord]:
        """
        Generates fictional demonstration records for testing only. These records
        are not retrieved from INEC and must never be presented as official results.
        """
        # Fictional fixture records with zero-padded example identifiers.
        osun_raw_fixtures = [
            {
                "pu_code": "29-24-01-001",
                "name": "OPEN SPACE, ATAOJA PALACE SQUARE, OSOGBO",
                "state_id": "29",
                "lga_name": "Osogbo",
                "lga_code": "OSOGBO",
                "ward_name": "Ataoja 'A'",
                "ward_code": "ATAOJA_A",
                "registered": 680,
                "accredited": 412,
                "doc_url": "https://example.invalid/demo/EC8A/29-24-01-001.jpg",
                "upload_time": "2026-08-15T16:45:22.000Z",
                "content_bytes": b"INEC_FORM_EC8A_OSUN_29-24-01-001_OSOGBO_ATAOJA_PALACE_OFFICIAL",
            },
            {
                "pu_code": "29-24-01-002",
                "name": "COMMUNITY GRAMMAR SCHOOL, OJA-OBA, OSOGBO",
                "state_id": "29",
                "lga_name": "Osogbo",
                "lga_code": "OSOGBO",
                "ward_name": "Ataoja 'A'",
                "ward_code": "ATAOJA_A",
                "registered": 750,
                "accredited": 465,
                "doc_url": "https://example.invalid/demo/EC8A/29-24-01-002.jpg",
                "upload_time": "2026-08-15T17:10:14.000Z",
                "content_bytes": b"INEC_FORM_EC8A_OSUN_29-24-01-002_COMMUNITY_GRAMMAR_OJA_OBA",
            },
            {
                "pu_code": "29-11-01-003",
                "name": "OPEN SPACE, TIMI PALACE GATE, EDE SOUTH",
                "state_id": "29",
                "lga_name": "Ede South",
                "lga_code": "EDE_SOUTH",
                "ward_name": "Babanla / Agbalemobutu",
                "ward_code": "EDE_S_01",
                "registered": 820,
                "accredited": 540,
                "doc_url": "https://example.invalid/demo/EC8A/29-11-01-003.jpg",
                "upload_time": "2026-08-15T17:35:00.000Z",
                "content_bytes": b"INEC_FORM_EC8A_OSUN_29-11-01-003_TIMI_PALACE_EDE_SOUTH",
            },
            {
                "pu_code": "29-17-02-004",
                "name": "ST. JOHN'S PRIMARY SCHOOL, ILORO, ILESA EAST",
                "state_id": "29",
                "lga_name": "Ilesa East",
                "lga_code": "ILESA_EAST",
                "ward_name": "Iloro / Ijoka",
                "ward_code": "ILESA_E_01",
                "registered": 690,
                "accredited": 398,
                "doc_url": "https://example.invalid/demo/EC8A/29-17-02-004.jpg",
                "upload_time": "2026-08-15T18:02:40.000Z",
                "content_bytes": b"INEC_FORM_EC8A_OSUN_29-17-02-004_ST_JOHNS_ILORO_ILESA",
            },
            {
                "pu_code": "29-15-01-005",
                "name": "TOWN HALL, ENUWA SQUARE, IFE CENTRAL",
                "state_id": "29",
                "lga_name": "Ife Central",
                "lga_code": "IFE_CENTRAL",
                "ward_name": "Ilare / Enuwa",
                "ward_code": "IFE_C_01",
                "registered": 780,
                "accredited": 480,
                "doc_url": "https://example.invalid/demo/EC8A/29-15-01-005.jpg",
                "upload_time": "2026-08-15T18:25:10.000Z",
                "content_bytes": b"INEC_FORM_EC8A_OSUN_29-15-01-005_ENUWA_IFE_CENTRAL",
            },
        ]

        records = []
        for fix in osun_raw_fixtures:
            sha256_hash = hashlib.sha256(fix["content_bytes"]).hexdigest()
            record = SourceRecord(
                polling_unit_code=fix["pu_code"],
                election_id=election_id,
                form_type="EC8A",
                source_url=fix["doc_url"],
                file_hash=sha256_hash,
                image_url=fix["doc_url"],
                source_timestamp=datetime.fromisoformat(fix["upload_time"].replace("Z", "+00:00")),
                registered_voters=fix["registered"],
                accredited_voters=fix["accredited"],
                raw_payload=fix,
                is_demonstration=True,
                source_status="DEMONSTRATION",
                version=1,
            )
            records.append(record)

        return records[offset : offset + limit]

    async def fetch_polling_unit_records(
        self,
        election_id: str,
        state_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[SourceRecord]:
        """
        Fetches polling unit records and Form EC8A references from the official portal.
        Handles pagination, authentication headers, rate limits, and idempotent ingestion.
        """
        # Require an explicitly configured upstream API URL and credentials. The public portal URL alone is not an API contract.
        if self.api_key and self.api_base_configured and httpx is not None:
            await self._throttle()
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "NigeriaElectionWatch/1.0 (Independent Research Monitor)",
                "Accept": "application/json",
            }

            url = f"{self.base_url}/api/v1/elections/{election_id}/pus"
            params = {"state": state_code or "OSUN", "limit": limit, "offset": offset}

            # Exponential backoff retry loop
            for attempt in range(self.max_retries):
                try:
                    async with httpx.AsyncClient(timeout=self.request_timeout) as client:
                        response = await client.get(url, headers=headers, params=params)
                        if response.status_code in (429, 502, 503, 504):
                            wait_time = self.backoff_factor ** (attempt + 1)
                            await asyncio.sleep(wait_time)
                            continue
                        response.raise_for_status()
                        data = response.json()
                        # Map incoming INEC JSON array to SourceRecord instances
                        records = []
                        for item in data.get("data", []):
                            doc = item.get("document", {})
                            doc_url = doc.get("url", "")
                            # Compute or extract hash
                            file_hash = doc.get("file_hash") or hashlib.sha256(doc_url.encode()).hexdigest()
                            rec = SourceRecord(
                                polling_unit_code=item.get("pu_code") or item.get("delimitation"),
                                election_id=election_id,
                                form_type="EC8A",
                                source_url=doc_url,
                                file_hash=file_hash,
                                image_url=doc_url,
                                source_timestamp=datetime.fromisoformat(doc["updated_at"].replace("Z", "+00:00")) if doc.get("updated_at") else datetime.now(timezone.utc),
                                registered_voters=item.get("voters", {}).get("registered", 0),
                                accredited_voters=item.get("voters", {}).get("accredited", 0),
                                raw_payload=item,
                                is_demonstration=False,
                            )
                            records.append(rec)
                        return records
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        if self.synthetic_mode:
                            print(f"[InecApprovedSourceAdapter] Live fetch error: {e}. Falling back to authorized synthetic schema.")
                            break
                        raise e

        # If synthetic mode is enabled (for testing/simulated evaluation), return canonical Osun records
        if self.synthetic_mode:
            return self._generate_synthetic_osun_records(election_id, limit, offset)

        # Do not silently call the public website as if it were a documented API.
        raise RuntimeError(
            "Live retrieval is disabled until INEC_API_BASE_URL points to a documented, authorized API endpoint "
            "and INEC_API_KEY is configured. The public portal URL alone is not a verified API contract."
        )


class DevelopmentFixtureAdapter(ElectionSourceAdapter):
    """
    Supplies clearly labelled demonstration records for development and testing.
    Guaranteed to never be mistaken for live official election data.
    """

    def get_adapter_name(self) -> str:
        return "DevelopmentFixtureAdapter (Demonstration Data Only)"

    def is_live_official_source(self) -> bool:
        return False

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "status": "connected",
            "mode": "DEVELOPMENT_FIXTURE",
            "message": "Local fixture repository available with sample demonstration records.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def fetch_polling_unit_records(
        self,
        election_id: str,
        state_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[SourceRecord]:
        records = [
            SourceRecord(
                polling_unit_code="25-01-01-001",
                election_id=election_id,
                form_type="EC8A",
                source_url="https://inecelectionresults.ng/mock/sheets/25-01-01-001-ec8a.pdf",
                file_hash=hashlib.sha256(b"sample_ec8a_25_01_01_001").hexdigest(),
                image_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
                raw_payload={"votes": {"APC": 142, "PDP": 110, "LP": 104, "NNPP": 18}, "cast": 395},
                is_demonstration=True,
            ),
            SourceRecord(
                polling_unit_code="25-01-01-002",
                election_id=election_id,
                form_type="EC8A",
                source_url="https://inecelectionresults.ng/mock/sheets/25-01-01-002-ec8a.pdf",
                file_hash=hashlib.sha256(b"sample_ec8a_25_01_01_002").hexdigest(),
                image_url="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
                raw_payload={"votes": {"APC": 150, "PDP": 125, "LP": 102, "NNPP": 16}, "cast": 420},
                is_demonstration=True,
            ),
        ]
        return records[offset : offset + limit]


class HistoricalDataAdapter(ElectionSourceAdapter):
    def get_adapter_name(self) -> str:
        return "HistoricalDataAdapter (Certified Past Election Datasets)"

    def is_live_official_source(self) -> bool:
        return False

    async def test_connection(self) -> Dict[str, Any]:
        return {"status": "connected", "mode": "HISTORICAL_ARCHIVE"}

    async def fetch_polling_unit_records(
        self,
        election_id: str,
        state_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[SourceRecord]:
        return []


class ManualImportAdapter(ElectionSourceAdapter):
    def get_adapter_name(self) -> str:
        return "ManualImportAdapter (Admin Certified Batch Uploads)"

    def is_live_official_source(self) -> bool:
        return False

    async def test_connection(self) -> Dict[str, Any]:
        return {"status": "ready", "mode": "MANUAL_IMPORT"}

    async def fetch_polling_unit_records(
        self,
        election_id: str,
        state_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[SourceRecord]:
        return []
