# INEC IReV Field Mapping and Technical Specification

Target Election:
**Governorship election - 2026-08-15 - OSUN**
Official Portal Reference:
`https://inecelectionresults.ng`

---

## 1. Documented Source Fields & JSON Response Structure

The official INEC Result Viewing Portal (IReV) serves polling unit data and Form EC8A result sheets organized by election and electoral geography.

### A. Election Object
```json
{
  "_id": "62d55684fa9e2a4f4949a012",
  "name": "Governorship election - 2026-08-15 - OSUN",
  "state": "OSUN",
  "state_id": 29,
  "date": "2026-08-15T00:00:00.000Z",
  "type": "GOVERNORSHIP",
  "status": "CONCLUDED"
}
```

### B. Polling Unit & Document Payload (`GET /api/v1/elections/{election_id}/pus?ward={ward_id}`)
```json
{
  "_id": "62d56a1bfa9e2a4f4949c801",
  "name": "OPEN SPACE, ATAOJA PALACE SQUARE, OSOGBO",
  "pu_code": "29-24-01-001",
  "delimitation": "29/24/01/001",
  "state_id": "29",
  "lga_id": "24",
  "ward_id": "01",
  "document": {
    "url": "https://irev-results.lon1.digitaloceanspaces.com/elections/62d55684fa9e2a4f4949a012/29/24/01/001/ec8a.jpg",
    "updated_at": "2026-08-15T16:45:22.000Z",
    "size": 1845120,
    "version": 1
  },
  "voters": {
    "registered": 680,
    "accredited": 412
  },
  "is_canceled": false
}
```

---

## 2. Field Mapping to Platform Database Schema

| INEC Source Field | Platform Target Column | Table | Transformation & Validation Rules |
| :--- | :--- | :--- | :--- |
| `election._id` | `election.source_reference` | `elections` | String identifier preserved for provenance |
| `election.name` | `election.title` | `elections` | Exact title preserved |
| `election.date` | `election.election_date` | `elections` | Parsed into UTC `DateTime` |
| `pu.pu_code` / `delimitation` | `polling_units.code` | `polling_units` | Strict zero-padded string preservation (e.g. `29-24-01-001`) |
| `pu.name` | `polling_units.name` | `polling_units` | Polling unit location description |
| `pu.state_id` / `state` | `states.code` | `states` | Mapped to State entity (`OSUN`) |
| `pu.lga_id` | `lgas.code` | `lgas` | Mapped to parent LGA entity |
| `pu.ward_id` | `wards.code` | `wards` | Mapped to Ward entity |
| `pu.document.url` | `result_sheets.source_url` | `result_sheets` | Absolute URL to official scanned Form EC8A |
| `pu.document.updated_at` | `result_sheets.upload_timestamp` | `result_sheets` | Timestamp when collation officer uploaded document to portal |
| `pu.document.version` | `result_sheets.current_version` | `result_sheets` | Version tracking; revisions increment `result_sheet_versions` |
| Calculated Document Hash | `result_sheets.file_hash` | `result_sheets` | Cryptographic SHA-256 checksum of raw document bytes |
| Platform Clock | `result_sheets.retrieval_timestamp` | `result_sheets` | UTC timestamp when this platform ingested the record |
| `pu.voters.registered` | `polling_units.registered_voters` | `polling_units` | Validated non-negative integer |
| `pu.voters.accredited` | `polling_units.accredited_voters` | `polling_units` | Validated non-negative integer |
| Presence of `document.url` | `polling_units.upload_status` | `polling_units` | `'UPLOADED'` if document present, else `'NOT_YET_UPLOADED'` |

---

## 3. Rate Limits, Pagination, and Error Handling

1. **Rate Limiting**:
   - Authorized access limit: Maximum 60 requests per minute.
   - Enforced by token bucket or sliding-window rate limiter in `InecApprovedSourceAdapter`.
2. **Pagination**:
   - Where the endpoint supports offset/limit or page/page_size query parameters, the adapter requests batches of up to 100 polling units per ward.
3. **Transient Error Retries**:
   - HTTP 429 (Too Many Requests), 502 (Bad Gateway), 503 (Service Unavailable), and 504 (Gateway Timeout) trigger exponential backoff:
     `delay = backoff_factor * (2 ** retry_count)`
   - Maximum 3 retries before logging failure to `ingestion_errors`.
4. **Idempotency**:
   - Ingestion calculates the SHA-256 hash of every document.
   - If the hash matches an existing `result_sheets` record for that polling unit, the record is marked as unchanged and re-ingestion is skipped.
   - If the hash differs, the previous version is archived in `result_sheet_versions` and a discrepancy of category `SOURCE_DOCUMENT_REVISED` is raised for reviewer verification.

---

## 4. Fields Unavailable from INEC Portal (Documented Gaps)

1. **Structured Candidate Vote Numbers**:
   - INEC IReV does **not** provide machine-readable party vote numbers in the initial API response; only scanned raster image forms are uploaded.
   - **Resolution**: Our platform feeds the scanned image through `ResultSheetOcrProcessor` to extract candidate numbers, routes them to `VerificationWorkspace`, and only marks them verified after human sign-off.
2. **Rejected Ballots and Total Valid Votes**:
   - Available only visually on the paper form EC8A.
   - **Resolution**: Extracted via OCR and verified by human verifiers.
3. **Official Returning Officer Declarations**:
   - Declarations are made at State Collation Centers and published separately; not included in polling unit sheet upload endpoints.
