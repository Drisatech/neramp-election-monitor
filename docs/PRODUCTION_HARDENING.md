# Production Hardening — Implementation Status

## Canonical backend decision

**Node.js/Express (server.ts) is the canonical API for the current Render deployment.** The frontend uses relative /api/v1 paths and render.yaml starts npm start, which runs the Express server. The FastAPI/PostgreSQL/PostGIS implementation under backend/ is a reference/development implementation and is not connected to the current Render frontend path. It must not be treated as a second production source of truth.

This is a deployment decision based on the checked-in configuration, not a claim that the Node service is production-ready. A future move to FastAPI should be a deliberate migration with contract tests, data migration, and a single cutover—not a parallel write path.

## Implemented in this branch

- Source connection checks perform an HTTP request to the INEC reference portal. The result differentiates a reachable web page from a verified API. Credentials and actual document retrieval are explicitly reported as untested.
- The Node live-ingestion endpoint no longer falls back to existing polling-unit data and reports that fallback as a successful live retrieval.
- Ingestion jobs distinguish SUCCESS, SUCCESS_NO_RECORDS, SIMULATED, and FAILED. A failed live attempt returns HTTP 502 and preserves the error in the job/audit record.
- The previously hard-coded third-party source API URL is now configured through INEC_RESULTS_API_BASE_URL. If it is missing, live ingestion fails closed.
- Result sheets support explicit provenance fields for origin, processing stage, source/document URLs, retrieval time, SHA-256, and verification status. Newly ingested external documents are marked UNKNOWN origin and PENDING verification until provenance is actually established. Manually uploaded sheets are marked MANUAL_IMPORT.
- The Node readiness endpoint reports file-backed storage and whether the data directory is writable. It no longer claims that a database or cache is connected.
- The FastAPI adapter now makes a real HTTP probe in live mode or reports SIMULATED; its scheduler records fixture runs as simulations and includes provenance metadata.
- The README and architecture overview now distinguish the current deployment from the intended target architecture.

## Required environment configuration

Set `NERAMP_BOOTSTRAP_ADMIN_PASSWORD` in the deployment secret store to a unique password of at least 16 characters before enabling management access. Never use the former shared default password `Admin@Neramp2026!`. The application now disables that legacy password in persisted accounts; the migration replaces it with the configured bootstrap secret for the Super Admin only, or clears it when no valid secret is configured. Other seeded management accounts no longer share a default password and must be securely provisioned by an administrator.


Set INEC_RESULTS_API_BASE_URL in the deployment environment **only after confirming that the endpoint is permitted, technically accessible, and returns the expected documented contract**. The application currently does not establish that the endpoint is an official INEC API merely because the official portal is used as a reference. The source connection check probes https://inecelectionresults.ng/elections/types; it does not validate the configured results API.

Do not set DATA_SOURCE_MODE=OFFICIAL_SOURCE or publish data as official solely because an ingestion job ran. Each result sheet needs source-document provenance and verification.

## Outcome definitions

- SUCCESS: a configured live retrieval returned one or more records. This is not the same as verified election results.
- SUCCESS_NO_RECORDS: the request completed but returned no records.
- SIMULATED: the Node endpoint records that simulation mode was selected; it does not perform live retrieval and reports zero retrieved records. The FastAPI fixture adapter can return demo records. Neither is official results.
- FAILED: the live request or ingestion operation failed; no fallback data is represented as live.
- PARTIAL_SUCCESS and VALIDATION_REJECTED are reserved for future batch-level reporting when the ingestion contract exposes per-record failures and validation counts. The current Node source function does not yet expose sufficient per-record failure metrics to implement those statuses accurately.

## Persistence and recovery

The current Node service stores important state in JSON files and in-memory maps; it does not use the PostgreSQL models in backend/. The Render blueprint still uses the free plan and does not provision a persistent disk. Therefore durable persistence across deployments is **not guaranteed**.

Before production use:
1. Attach a persistent disk or migrate the canonical Node service to a managed database and object storage.
2. Keep election records, user accounts, sessions, result-sheet versions, incident evidence, and audit logs in durable stores.
3. Create encrypted, access-controlled backups and perform a restore drill.
4. Do not store incident evidence solely under a path derived from __dirname; route it through the configured persistent/object store.
5. Test restart, redeploy, partial-write recovery, and backup restoration.

## Security and scale — remaining release blockers

This branch is not a production security certification. The main administrative route groups now require server-issued bearer tokens, and sensitive operations have initial role gates. Endpoint-by-endpoint authorization review is still required; some non-administrative upload/observer routes remain intentionally public or require a separate observer identity design. Do not expose the service for production election operations until staging authorization tests and the remaining upload/persistence checks pass.

Additional release blockers:
- [x] Centralize server-issued bearer-token authentication for the /api/v1/admin route group, alert mutations, registered-voter imports, result verification, and OCR management/transcription endpoints. Caller-supplied x-actor-role and x-actor-email headers no longer authenticate admin requests.
- [x] Apply role gates to sensitive admin operations (restore/purge, user management, configuration, operations, OCR API-key changes, and registered-voter imports); restrict verification/OCR writes to verifiers or administrators.
- [x] Prevent passwordless login and prevent the login endpoint from setting a missing account password based only on knowledge of the account email.
- [x] Remove the shared default password from seeded management accounts, disable it for persisted accounts, and support a unique deployment secret via NERAMP_BOOTSTRAP_ADMIN_PASSWORD.
- [x] Add negative API integration tests for missing tokens, forged identity headers, invalid tokens, passwordless login, limited-role access, and logout token revocation. Run with npm run test:security against a dedicated test deployment; set NERAMP_TEST_BASE_URL, and optional test-account variables documented in the test file.
- [ ] Run the negative tests against a dedicated staging instance and add role-by-role positive/negative coverage for every administrative route before merge.
- Validate file content by magic bytes as well as extension/MIME; enforce strict request and decoded-upload size limits. Review the global JSON body limit.
- Keep provider keys and storage credentials server-side; rotate any credentials that may have been committed or exposed.
- Add durable audit logging and ensure restore/import operations are authorized and logged before and after mutation.
- Add request timeouts, bounded retries with backoff, per-source rate limits, idempotency keys, queue persistence, and dead-letter/retry handling.
- Add concurrency/load tests, database/object-storage capacity tests, dependency/security scans, and backup/restore drills.


### Authentication implementation notes

The current Node API issues random opaque bearer tokens stored in a process-local registry, with an eight-hour expiry. Restarting the Node process invalidates these tokens. This is a containment improvement over trusting caller-supplied headers, not a durable session architecture. Before production, move sessions to a shared durable store, add CSRF/origin protections if cookie auth is introduced, enforce secure transport, and audit every endpoint's role policy. Administrative endpoints should not be publicly exposed until staging authorization tests pass.

The integration tests intentionally skip when NERAMP_TEST_BASE_URL is not configured. They were added to the repository but have not been executed from this environment. Use dedicated test accounts only; never put production credentials in test configuration.

## Verification status

The repository changes were made through GitHub on a separate branch. No production endpoint was called from this change process, no INEC API credentials were available for verification, and no build, lint, unit, integration, security, or load tests were run in this environment. Review the diff and run the checks before merging.
