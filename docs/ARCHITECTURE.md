# NERAMP backend architecture and hardening decisions

## Canonical production API

The current Render blueprint builds and starts the root Node/Express application (server.ts). The React client uses the same-origin /api/v1 endpoints. **Node/Express is therefore the canonical production API for this branch.**

The backend/ FastAPI application, PostgreSQL/PostGIS models, Redis configuration and worker are a separate legacy/experimental implementation. They are not started by the current Render blueprint and must not be treated as sharing users, sessions, election records, verification history or audit logs with Node. Do not add new product features to both implementations. Before migrating any route or data, write a separate migration plan and reconcile the data models.

## Source access: current state

- Public portal reference: https://inecelectionresults.ng/elections/types
- The public portal URL is not, by itself, a documented API contract.
- Live ingestion now requires INEC_RESULTS_API_BASE_URL to be explicitly configured to a documented, authorized HTTPS API endpoint. INEC_API_KEY, when issued for that endpoint, is sent as a Bearer token.
- The previous implicit third-party DigitalOcean endpoint is no longer used as a fallback.
- The connection check performs an HTTP request to the public INEC portal and reports **portal reachability only**. It does not claim API authentication, authorization, or successful retrieval of election records.
- Configuring an upstream URL does not establish that it is operated or authorized by INEC. Until the API contract and access are independently confirmed, records are marked CONFIGURED_UPSTREAM_NOT_VERIFIED.

## Ingestion outcome contract

The Node API records explicit outcomes:

- SUCCEEDED: a non-empty live retrieval completed without failed ward requests.
- PARTIAL_SUCCESS: some records were retrieved but one or more ward requests failed.
- FAILED: upstream retrieval failed; local baseline records are not counted as retrieved records.
- SUCCEEDED_EMPTY: the configured upstream responded successfully but returned no polling-unit records.
- SIMULATED: the explicit DevelopmentFixtureAdapter was selected; no live source was queried.

Each job records counts, source endpoint where available, provenance state, failed ward fetches and error information. A job outcome does not certify the source as official.

The outcome classifier and HTTPS URL validation have unit tests. Run npm test.

## Provenance and verification semantics

- sourceProvenance: where the source came from and whether that upstream is independently verified.
- sourceReferenceHash: a fingerprint of a source URL only; it is not a document checksum.
- documentHashStatus: whether a document checksum was calculated from bytes. User-uploaded files are hashed from their uploaded bytes; upstream documents are marked NOT_DOWNLOADED until their actual bytes are retrieved.
- transcriptionProvenance: NOT_PROCESSED, OCR_EXTRACTED, or HUMAN_CORRECTED.
- humanVerified: separate sign-off state; OCR is never treated as human verification.
- New records from a configured but unverified upstream remain pending verification. A human review of figures does not independently authenticate the source.
- An anomaly or arithmetic mismatch is a review flag, not proof of fraud or wrongdoing.
- Fixture records in the legacy Python adapter are explicitly marked demonstration data and use reserved example.invalid URLs.

Older stored records may lack these fields. Missing provenance must be treated as **unknown**, not inferred to be official.

## Authentication boundary

The Node application now issues in-memory management tokens at login and requires a valid, unexpired server-issued Bearer token for administrative routes and verification writes. The server derives actor identity and role from the token-backed user record instead of trusting client-supplied x-actor-role / x-actor-email headers.

Tokens expire after eight hours and are revoked on logout. They are in-memory, so a process restart invalidates existing sessions. Production startup requires NERAMP_INITIAL_ADMIN_PASSWORD to be a unique secret of at least 32 characters. Fresh production stores seed only the root account; on existing stores, accounts still using the known development password are rotated (root) or disabled pending approval (other users). This is a hardening step, not a substitute for a mature persistent identity provider or distributed session store.

## Persistence and deployment

The Node app persists JSON stores to DATA_DIR. It does not use the FastAPI PostgreSQL database. Local files may be ephemeral unless the hosting provider's durable disk is attached and correctly mounted.

On Render:
1. Attach a persistent disk mounted at /var/data (requires a paid service plan).
2. Set DATA_DIR=/var/data.
3. Set PERSISTENT_STORAGE_CONFIGURED=true only after confirming the disk is attached, writable, and tested through a restart/redeploy.
4. Keep independent, access-controlled backups and perform restore drills. A disk is not a backup.
5. The readiness endpoint reports degraded status in production until durable storage is explicitly confirmed.

The Render blueprint remains on the existing free plan and does not silently enable a paid disk. Consequently, production durability is **not yet established** until the operator performs the steps above.

## Validation still required

Before public election-day operation:
- Confirm INEC's written technical authorization, the real API endpoint, auth mechanism, schema, pagination, rate limits and document download workflow.
- Download source documents through a constrained, authorized workflow and compute SHA-256 from actual bytes before marking document hashes verified.
- Add integration tests for source timeout, invalid payload, partial ward failure, retries, duplicate records, revisions, provenance and verification permissions.
- Test every admin write route against anonymous, expired-token, inactive-user and insufficient-role requests.
- Verify all result/user/session/verification/evidence/audit data survives process restart and redeploy; test backup restoration.
- Run dependency/security scanning, upload validation tests, concurrent traffic tests, queue/retry recovery and storage capacity tests.
