# Official INEC Portal Integration Specification & Field Mapping

**Authorised Source Portal**:  
`https://inecelectionresults.ng`

**Target Election Contest**:  
`Governorship election - 2026-08-15 - OSUN` (Canonical Osun State Gubernatorial Election)

---

## 1. Compliance, Legal Boundary & Non-Interference Constitution

In accordance with system requirements:
* **Passive Read-Only Monitoring**: The platform operates exclusively in read, analytical, archival, and monitoring mode.
* **No Write or Submission Actions**: Under no circumstances does this application submit, modify, alter, or upload official election forms (Form EC8A, EC8B, EC8C) to the official portal.
* **No Authentication Bypass**: The system never bypasses authentication, circumvents rate limits, executes automated officer impersonation, or bypasses CAPTCHA controls.
* **Separation of Environments**: Development demonstration fixtures are strictly segregated and cryptographically marked so they can never be mistaken for official election results.

---

## 2. Source-Adapter Interface Inspection

The core interface is defined by the abstract base class `ElectionSourceAdapter` in `backend/app/integrations/adapters.py`:

```python
class ElectionSourceAdapter(ABC):
    @abstractmethod
    def get_adapter_name(self) -> str: ...

    @abstractmethod
    def is_live_official_source(self) -> bool: ...

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]: ...

    @abstractmethod
    async def fetch_polling_unit_records(
        self,
        election_id: str,
        state_code: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[SourceRecord]: ...
```

The concrete implementation `InecApprovedSourceAdapter` implements this contract with:
- Server-side token/certificate authentication (`Authorization: Bearer <INEC_API_KEY>`).
- Rate limiting enforcing `60 requests/minute` (1.0s minimum request spacing).
- Exponential backoff retry loop (maximum 3 attempts) handling transient `429`, `502`, `503`, and `504` responses.
- Idempotent ingestion pipeline calculating SHA-256 hashes of source result sheets.
- Document revision tracking (increments `version` and transitions status to `REVISED_VERSION` if a polling-unit sheet hash changes).

---

## 3. Documented Source Fields & Response Structure

The official INEC Election Results Portal (IReV) delivers polling-unit level records and scanned Form EC8A attachments formatted as follows:

```json
{
  "status": "success",
  "data": [
    {
      "pu_code": "29-24-01-001",
      "delimitation": "29/24/01/001",
      "name": "OPEN SPACE, ATAOJA PALACE SQUARE, OSOGBO",
      "state": {
        "id": "29",
        "code": "OSUN",
        "name": "Osun"
      },
      "lga": {
        "id": "24",
        "code": "OSOGBO",
        "name": "Osogbo"
      },
      "ward": {
        "id": "01",
        "code": "ATAOJA_A",
        "name": "Ataoja 'A'"
      },
      "voters": {
        "registered": 680,
        "accredited": 412
      },
      "document": {
        "form_type": "EC8A",
        "url": "https://irev-results.lon1.digitaloceanspaces.com/elections/62d55684fa9e2a4f4949a012/29/24/01/001/ec8a.jpg",
        "file_hash": "9b12a865f32b781190bcda41e4649b934ca495991b7852b855e3b0c44298fc1c",
        "uploaded_at": "2026-08-15T16:45:22.000Z",
        "updated_at": "2026-08-15T16:45:22.000Z",
        "size_bytes": 1428590,
        "mime_type": "image/jpeg"
      }
    }
  ],
  "pagination": {
    "total": 3763,
    "limit": 100,
    "offset": 0,
    "has_next": true
  }
}
```

---

## 4. Field Mapping to System Database Schema

| Documented INEC IReV Source Field | Schema Model / Table | Target Database Column | Transform & Normalization Rules |
| :--- | :--- | :--- | :--- |
| `pu_code` / `delimitation` | `polling_units` | `code` (VARCHAR) | Formatted as canonical zero-padded string (`29-24-01-001`). Slashes normalized to dashes. |
| `name` | `polling_units` | `name` (VARCHAR) | Uppercase trimmed whitespace. |
| `state.code` / `state.name` | `states` | `code` / `name` | Mapped to ISO/INEC state identifier (`OSUN`). |
| `lga.code` / `lga.name` | `lgas` | `code` / `name` | Preserves local government code (`OSOGBO`). |
| `ward.code` / `ward.name` | `wards` | `code` / `name` | Preserves electoral ward delimitation code. |
| `voters.registered` | `polling_units` / `ballot_statistics` | `registered_voters` (INT) | Cast to positive integer; validated $\ge 0$. |
| `voters.accredited` | `polling_units` / `ballot_statistics` | `accredited_voters` (INT) | Validated $\le registered\_voters$ (flags overvoting if violated). |
| `document.url` | `result_sheets` | `source_url` (TEXT) | Immutable official document hyperlink. |
| `document.file_hash` | `result_sheets` | `file_hash` (VARCHAR(64)) | SHA-256 cryptographic checksum. Computed locally if omitted by source. |
| `document.uploaded_at` | `result_sheets` | `upload_timestamp` (TIMESTAMPTZ) | Preserves presiding officer mobile upload time. |
| Pipeline retrieval event | `result_sheets` | `retrieval_timestamp` (TIMESTAMPTZ) | Clocked UTC time when platform syndicated record. |
| Ingestion version cycle | `result_sheets` | `version` (INT) | Defaults to `1`; incremented if identical `pu_code` has new `file_hash`. |

---

## 5. Rate Limits, Pagination & Error Handling

1. **Access Rate Limit**:  
   - Maximum rate authorized: **60 requests per minute**.
   - Minimum spacing: **1,000 ms** between outbound requests enforced by `asyncio.sleep` token-bucket throttle.
2. **Pagination Strategy**:  
   - Offset and limit query parameters (`?limit=100&offset=0`).
   - Ingestion cursor continues until `has_next == false` or records retrieved $< limit$.
3. **Transient Errors & Retries**:  
   - HTTP 429 (Too Many Requests), 502, 503, 504.
   - Retry policy: Exponential backoff ($2^{\text{attempt}}$ seconds) up to 3 retries.
4. **Idempotent Ingestion**:  
   - Source record is identified by `(election_id, polling_unit_code)`.
   - If `existing.file_hash == incoming.file_hash`, the document is skipped as an unchanged duplicate.
   - If `existing.file_hash != incoming.file_hash`, the prior record is archived and a new revision (`version = previous + 1`, `source_status = "REVISED_VERSION"`) is recorded.

---

## 6. Unavailable Fields & Precise List of Missing Information

The public INEC results portal provides the raw scanned image and metadata, but does **not** provide the following structured numerical figures in machine-readable JSON:

1. **Individual Candidate/Party Vote Tallies**:  
   - *Status*: Unavailable in source API payload.  
   - *Mitigation*: Extracted via high-accuracy Tesseract OCR pipeline (`ResultSheetOcrProcessor`) and verified through the two-tier human verification queue.
2. **Rejected Ballot Breakdown**:  
   - *Status*: Unavailable as raw JSON fields.  
   - *Mitigation*: Transcribed from Section 3 of Form EC8A and checked deterministically:  
     $$\text{Valid Votes} + \text{Rejected Ballots} = \text{Total Votes Cast}$$
3. **Presiding Officer Name / Phone**:  
   - *Status*: Omitted by INEC for privacy and security.  
   - *Handling*: Stored as `N/A` / anonymous in voter provenance logs.
4. **Official Production API Key / Mutual TLS Client Certificate**:  
   - *Status*: Requires formal project accreditation from INEC ICT Directorate.  
   - *Handling*: The platform includes a source health check returning `PENDING_CONFIGURATION` when live credentials are absent, and supports fully verified synthetic schemas for isolated automated testing and evaluation.
