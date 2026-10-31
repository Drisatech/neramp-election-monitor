# NERAMP Backup and Disaster Recovery Architecture

**Status:** Design baseline — implementation not yet started  
**Canonical application:** Node.js / Express (`server.ts`) on Render  
**Off-site backup provider:** Backblaze B2 (S3-compatible API)  
**Target branch:** `hardening/canonical-ingestion-provenance`

## 1. Purpose and design boundary

This document defines the backup inventory, archive contract, security controls, recovery behavior, and verification requirements for NERAMP's first complete backup and recovery implementation.

The current Render application uses the Node.js/Express API and JSON-file persistence. The FastAPI/PostgreSQL/PostGIS code under `backend/` is a reference/development implementation and is not the production source of truth. The first B2 implementation MUST back up the active Node application. It MUST NOT treat the unconnected PostgreSQL implementation as production data.

Backblaze B2 is an independent disaster-recovery destination. Existing Google Cloud Storage (GCS) evidence/document storage remains operational and is not replaced by this work.

This design does not claim that backups are already being created, that the B2 account is configured, or that recovery objectives have been achieved.

## 2. Current-state inventory

### 2.1 Canonical local JSON files

The following paths are currently derived from `DATA_DIR` in `server.ts`:

| File | Data | Backup treatment |
|---|---|---|
| `neramp_polling_units.json` | Polling-unit records | Required |
| `neramp_result_sheets.json` | Result sheets, transcription and provenance metadata | Required |
| `neramp_users.json` | Management account records and password hashes/salts | Required only inside encrypted archive; never expose in backup listings or logs |
| `neramp_user_sessions.json` | Session history, identity, IP and user-agent metadata | Required for audit continuity; active sessions must be invalidated during restore |
| `neramp_audit_logs.json` | Audit history | Required |
| `neramp_discrepancies.json` | Discrepancy records | Required |
| `neramp_incidents.json` | Incident reports and evidence references | Required |
| `neramp_elections.json` | Election configuration | Required |
| `neramp_database_snapshot.json` | Existing local recovery snapshot | Include as a recovery input/reference, but do not treat it as the complete backup source |

`neramp_auth_tokens.json` is deliberately excluded. It contains hashes of active bearer tokens and must not be restored. Restore must revoke all active sessions/tokens and require users to sign in again.

The code also declares `neramp_scheduler.json` and `neramp_loop_config.json` paths. Their actual persistence/read/write behavior must be verified before they are classified as authoritative backup inputs. Do not assume a declared path means the file is actively maintained.

### 2.2 File-based uploads and evidence

Current code paths include:

- Observer evidence stored under `DATA_DIR/evidence`.
- OCR/Form EC8A uploads written under `process.cwd()/data/uploads` in the inspected upload handler and read by OCR/image retrieval paths.
- Existing in-memory maps (`EVIDENCE_FILES` and `UPLOADED_EC8A_STORE`) that are not themselves durable stores.

The OCR upload path is inconsistent with the configured `DATA_DIR`. Before backup automation is enabled, local upload paths must be consolidated behind one configured durable upload root or explicitly enumerated in a migration-safe inventory. A backup must not silently omit `data/uploads` while it still contains the only surviving copy of a document.

Files must be archived as binary objects with their relative storage keys, detected content type, byte length, SHA-256 digest, and relevant record references. Do not reconstruct files from data URLs embedded in result-sheet JSON when an original binary file is available.

### 2.3 Existing GCS objects

The current application uses the configured `GCS_BUCKET_NAME` for evidence and EC8A uploads. GCS is a separate object store and may contain the only durable copy of uploaded documents.

The backup design must inventory and copy all in-scope objects from the configured GCS bucket to B2, including object name, generation/version where available, content type, size, update time, and SHA-256 (computed by streaming the object if trusted checksum metadata is unavailable).

The current `queryRealGcsBucket()` implementation lists at most 1,000 objects. It is a UI/status helper, not a complete backup enumerator. Backup code must use paginated listing and must fail or report an explicit incomplete result if any page/object cannot be read.

Do not make private evidence public as a side effect of backup. Preserve object names and access semantics; never rely on public GCS URLs as the backup source.

### 2.4 In-memory and derived data

The current process also maintains values such as ingestion jobs, observer assignments, OCR cache entries, rate-limit state, and readiness checklist state. Their persistence and business importance differ.

Before implementation, each such store must be classified as one of:
1. Durable business state — must be persisted and included.
2. Rebuildable cache/derived state — may be excluded and rebuilt.
3. Ephemeral operational state — exclude, documenting the loss behavior.

In particular, do not report a backup as complete if a business-critical store is only in memory and has no durable representation. The implementation should add explicit persistence for any business-critical state discovered in this classification.

## 3. Backup archive contract

Each successful backup is one immutable archive object and one manifest object in B2. Use a unique UTC backup identifier, for example:

`neramp-full-2026-10-31T120000Z-<random-id>`

Recommended logical archive layout:

```
manifest.json
database/
  neramp_polling_units.json
  neramp_result_sheets.json
  neramp_users.json
  neramp_user_sessions.json
  neramp_audit_logs.json
  neramp_discrepancies.json
  neramp_incidents.json
  neramp_elections.json
  neramp_database_snapshot.json
uploads/
  evidence/...
  data/uploads/...
gcs/
  <original-object-key>...
```

The exact file set is recorded in the manifest. Do not include `.env`, provider credentials, raw API keys, B2 credentials, Render secrets, or `neramp_auth_tokens.json`.

### 3.1 Manifest fields

The manifest must be versioned and machine validated. At minimum it records:

- `format`: fixed product identifier (NERAMP backup).
- `manifestVersion`: integer schema version.
- `backupId`: unique immutable identifier.
- `createdAt`: UTC ISO-8601 timestamp.
- `application`: repository, source commit SHA when available, application version and canonical backend identifier.
- `environment`: environment label only; never include secret values or full sensitive deployment configuration.
- `backupType`: full.
- `consistency`: capture strategy and whether all sources completed successfully.
- `components`: per-component status, item count and byte count.
- `files`: archive-relative path, size, SHA-256 and content type for every entry.
- `excluded`: explicit list/reason for active token registry, secrets, caches and other excluded ephemeral data.
- `encryption`: algorithm, key identifier/version, nonce/IV and authentication-tag metadata as required by the selected envelope format; never the encryption key.
- `archiveSha256`: digest of the encrypted archive, stored in the separate manifest/metadata record.

The manifest must not contain passwords, hashes of user passwords, session tokens, provider keys, signed URLs, or unnecessary personal data. The manifest itself should be encrypted or contain metadata only; do not leak sensitive filenames or record-level information through an unencrypted public object.

### 3.2 Consistent capture

Atomic JSON writes protect individual files from truncation but do not make a multi-file backup transactionally consistent. Backup capture must therefore:

1. Acquire a process-wide backup/capture lock.
2. Prevent or serialize conflicting persistence mutations during the short capture window, or capture a single immutable in-memory state snapshot using a documented version/sequence boundary.
3. Flush pending debounced writes before capture.
4. Copy files to a private temporary staging directory, not directly to B2.
5. Enumerate local binary files and paginated GCS objects.
6. Verify that every required component completed and that sizes/digests match.
7. Create the manifest and archive.
8. Encrypt, upload, verify the uploaded object, then release temporary staging data.
9. Release the lock in a `finally` path.

If any required source is missing, unreadable, changing during capture, or inaccessible, mark the backup failed/incomplete. Never label a partial archive as a successful full backup. Use bounded retries with exponential backoff for transient provider failures.

The first implementation may use a brief write pause for correctness. A future high-volume implementation can move to versioned object inventories and a transactional database snapshot.

## 4. Encryption and B2 security

### 4.1 Client-side encryption

Encrypt the completed archive before it leaves the application environment. Use an authenticated encryption construction such as AES-256-GCM with a fresh cryptographically random nonce for every backup. Bind the manifest/backup identifier as authenticated additional data where supported.

The encryption key must be supplied through a deployment secret manager/environment secret, never committed to Git, written to the archive, returned by an API, or logged. Support explicit key identifiers and key rotation. Recovery documentation must explain how to retain and securely escrow prior decryption keys; losing the key makes the backup unrecoverable.

Do not invent a default key or silently fall back to plaintext if encryption configuration is missing. Backup creation must fail closed.

### 4.2 Backblaze B2

Use B2's S3-compatible API through a server-side SDK/client. Credentials must remain server-side and be least-privilege, scoped to the dedicated backup bucket and required object operations. Do not reuse GCS credentials or the general B2 account master key.

The bucket must be private. Enable object versioning where supported/configured and apply a documented lifecycle/retention policy. Consider B2 Object Lock only after deciding the required retention period and operational/legal implications; do not enable an irreversible retention policy by default.

Use a separate B2 key for backup operations and a separate read/restore credential if the provider's access model permits it. Never return object-store credentials or internal provider error details to clients.

### 4.3 Operational secrets

Proposed environment variables (names are design proposals, not yet consumed by code):

- `NERAMP_BACKUP_ENABLED`
- `NERAMP_BACKUP_SCHEDULE`
- `NERAMP_BACKUP_RETENTION_DAYS`
- `NERAMP_BACKUP_B2_BUCKET`
- `NERAMP_BACKUP_B2_REGION`
- `NERAMP_BACKUP_B2_ENDPOINT`
- `NERAMP_BACKUP_B2_KEY_ID`
- `NERAMP_BACKUP_B2_APPLICATION_KEY`
- `NERAMP_BACKUP_ENCRYPTION_KEY`
- `NERAMP_BACKUP_ENCRYPTION_KEY_ID`

Do not add real values to `.env.example`. Add only blank placeholders and explanatory comments in the implementation stage. Configuration validation must distinguish disabled/unconfigured from enabled-but-broken. If enabled, missing credentials or encryption keys must cause a visible unhealthy backup status and failed backup run.

## 5. Scheduling, retention and monitoring

- The initial default schedule should be daily, configurable by environment, and run in UTC.
- Provide a manual administrator-triggered backup in addition to the schedule.
- Prevent overlapping backup jobs with a process lock and an idempotent run identifier.
- Keep a bounded local job history for operational visibility, but treat B2 as the durable backup catalog.
- Retention must be configurable and enforced only after a new backup has been uploaded and verified.
- Never delete the last known-good backup. Retention must preserve a minimum number of successful full backups even when the age threshold is reached.
- Report last successful backup, last attempted backup, age, archive size, included components, verification result, and sanitized failure reason.
- Alert/health status must distinguish disabled, not configured, running, successful, failed, incomplete, and verification failed.
- Do not claim backup success based solely on a successful upload response; perform a remote HEAD/metadata check and, where practical, download and verify the encrypted archive checksum.

A single Render web process is the only supported scheduler topology for the first release. If the service scales to multiple instances, move scheduling/locking to a distributed job coordinator before enabling schedules on multiple replicas.

## 6. Restore contract

Restore is a privileged destructive operation. It must not be implemented as a merge into live state.

### 6.1 Authorization and approval

- Require a valid server-issued bearer session.
- Require `SUPER_ADMIN` or `PROJECT_ADMIN` role using `res.locals.authUser`, never caller-supplied identity headers.
- Require an explicit backup ID and a second confirmation token/phrase generated for that restore attempt.
- Apply rate limits and record the authenticated actor.
- Do not permit restore from an arbitrary URL or caller-provided remote path; resolve only validated objects in the configured private B2 bucket.

### 6.2 Preflight validation

Before any live mutation:

1. Download the selected immutable B2 object to a restricted temporary location.
2. Verify encrypted archive SHA-256 against the trusted manifest/catalog.
3. Decrypt using the manifest's key identifier; fail closed on missing key or authentication-tag error.
4. Validate archive paths against traversal, absolute paths, symlinks and unexpected entries.
5. Validate manifest version, required components, file sizes and SHA-256 checksums.
6. Parse JSON and validate each component's expected top-level schema and cross-references.
7. Verify that all required binary assets are present and match their hashes.
8. Produce a restore preview with counts, timestamp, source commit, component status and compatibility warnings.
9. Create and verify an automatic pre-restore safety backup of the current live state before proceeding.

A preflight failure must leave live application data unchanged.

### 6.3 Atomic restore and rollback

- Stop or gate application writes during the restore window.
- Extract into a new versioned staging directory under the configured data volume.
- Write files with restrictive permissions and fsync them.
- Validate the staged state using the same validators used by preflight.
- Preserve a rollback copy of the previous data directory.
- Switch the active data directory using an atomic directory/symlink strategy supported by the deployment filesystem, or use a journaled file-swap plan if atomic directory switching is not supported.
- Restart/reload the application state only after all components are staged and verified.
- If any swap or post-restore validation fails, restore the previous data set and report rollback status.
- Never delete the previous state until the restored application passes health and integrity checks.

The implementation must account for Render's mounted disk and deployment filesystem behavior. It must not assume that changing an environment variable can atomically switch the active data directory.

### 6.4 Authentication and audit behavior

- Never restore `neramp_auth_tokens.json`.
- Invalidate all active in-memory bearer tokens.
- Clear the persisted token registry.
- Mark previously active user sessions as terminated/revoked in restored session history, preserving historical records.
- Require fresh login after restore.
- Preserve restored audit history, then append a new restore-start and restore-completed/failed event with backup ID, actor, timestamp and outcome. The restore-start record must be durably written before live mutation; the completion record must be durably written after verification.
- Do not allow the restored audit file to erase the record of the restore operation itself.

### 6.5 GCS object recovery

The archive must include the in-scope GCS objects. Restore should first reconstruct the application state and local assets in staging. Rehydrating GCS objects is a separately reported phase with idempotent object keys and hash checks. Do not overwrite newer production GCS objects silently. Provide a dry-run/compare step and require explicit confirmation before remote object replacement.

## 7. API and administration surface (proposed)

The exact route names can be finalized during implementation, but the API must support:

- Read backup configuration/status (never secrets).
- List backup catalog entries with pagination.
- Trigger a manual full backup.
- Inspect one backup manifest and verification status.
- Run a non-destructive backup verification.
- Preflight a restore and return a preview.
- Confirm and execute a restore.
- Read backup/restore job history and sanitized errors.

Every route must be behind the existing `/api/v1/admin` authentication middleware. Mutating or destructive backup operations must be restricted to `SUPER_ADMIN` and `PROJECT_ADMIN`. Restore must have stricter confirmation and audit requirements than backup creation.

Do not expose a route that returns the full manifest/archive, encryption key, B2 credentials, local filesystem paths, or unredacted provider diagnostics to ordinary management roles.

## 8. Testing and acceptance criteria

The first complete implementation is not done until all of the following are verified:

### Backup tests
- Missing B2 credentials and missing encryption key fail closed.
- A successful backup includes every required JSON component and every enumerated upload/evidence object.
- GCS pagination beyond 1,000 objects is handled.
- One unreadable/missing required component causes an incomplete/failed backup, not a false success.
- Concurrent backup triggers do not create overlapping captures.
- An interrupted upload leaves no catalog entry marked successful.
- Remote object size and SHA-256 match the uploaded archive.
- Secrets, raw bearer tokens and `.env` files are absent from archive contents and logs.
- Retention never deletes the last known-good backup.
- Scheduler does not run twice when multiple instances are accidentally started; until distributed locking exists, production must enforce one scheduler instance.

### Restore tests
- Anonymous and limited-role users are denied.
- Forged `x-actor-role` / `x-actor-email` headers cannot authorize backup or restore.
- Wrong key, tampered archive, wrong checksum, unsupported manifest, traversal path and missing required file all fail before mutation.
- Preflight does not change live state.
- Restore replaces rather than merges the selected backup state.
- Existing live state is rolled back if a staged swap or post-restore health check fails.
- All previous bearer tokens are rejected after restore.
- Restored historical audit records remain intact and the restore event is appended.
- Local evidence, EC8A assets and GCS object restoration are verified by content hash.
- A full restore is executed in an isolated staging environment from a real B2 backup.

### Operational acceptance
- Documented RPO/RTO are measured in repeated restore drills; do not advertise targets before measurement.
- Run backup/restore tests with large datasets and realistic document volumes.
- Verify memory, temporary disk and network usage on the actual Render plan.
- Verify behavior during deploy/restart and transient B2/GCS outages.
- Provide a human-readable runbook for key recovery, backup verification, restore approval, rollback and post-restore checks.

## 9. Implementation sequence

1. **Inventory and contract (this document):** agree the source-of-truth inventory, exclusions, manifest, consistency boundary and restore semantics.
2. **Storage foundation:** add server-side B2 S3-compatible client, validated configuration, encryption/decryption utilities, manifest schema and isolated tests.
3. **Backup capture:** implement consistent JSON capture, upload inventory, paginated GCS export, archive creation, encryption, upload and remote verification.
4. **Scheduling and catalog:** implement single-instance scheduling, manual trigger, job history, retention and status reporting.
5. **Restore engine:** implement catalog lookup, preflight, staged extraction, atomic replacement/rollback, session invalidation and audit events.
6. **Admin integration and drills:** add protected APIs/UI, end-to-end staging tests, runbook and measured RPO/RTO.

Do not combine the B2 integration, destructive restore rewrite and frontend changes into one unreviewable commit. Each stage should be validated and committed separately.

## 10. Open implementation decisions

The following values must be confirmed or measured before enabling automated production backups:

- Dedicated B2 bucket name and region.
- Render plan and available temporary disk/memory for archive creation.
- Required retention period and minimum successful backup count.
- Daily schedule time (UTC) and any additional interval required by the measured RPO.
- Whether GCS objects should be copied into every full archive or into a content-addressed incremental object catalog. The initial release should favor a complete, verifiable copy unless volume testing makes that impractical.
- Encryption-key custody and recovery/rotation procedure.
- Whether B2 Object Lock is required.
- Whether the current deployment will remain a single Render instance.

Until these are configured and tested, keep automated B2 backup disabled and report the integration as not configured rather than healthy.
