# Operational Runbooks - Nigeria Election Watch 2027

This document contains mission-critical operational runbooks for site reliability engineers (SRE), database administrators (DBA), and election monitoring coordinators supporting the Nigeria Election Watch platform.

---

## Runbook 1: Election-Day Traffic Scaling & Peak Surge Management

### Context
On election day (starting 14:00 West Africa Time as polling units conclude voting and Form EC8A uploads commence), traffic to the public results dashboard and the verification queue spikes dramatically.

### Pre-Election Day Scaling Checklist (T-24 Hours)
1. **Cloud Run Provisioning**:
   - Set minimum backend instances to 10 (`autoscaling.knative.dev/minScale: 10`).
   - Set maximum backend instances to 80 (`autoscaling.knative.dev/maxScale: 80`).
   - Increase frontend web tier minScale to 15, maxScale to 120.
2. **Database Connection Pooling**:
   - Verify PgBouncer connection pool: `default_pool_size = 50`, `max_client_conn = 500`.
   - Allocate 32GB RAM instance to PostgreSQL + PostGIS (`db-custom-8-32768`).
3. **Cache Warming**:
   - Pre-populate national and 36-state summary caches in Redis with a 60-second TTL.
   - Configure Cloud CDN to cache static assets and summary JSON endpoints for 30 seconds with stale-while-revalidate.
4. **Traffic Monitoring & Load Shedding**:
   - If database CPU exceeds 85%, invoke administrative cache freeze via Command Centre (`POST /api/v1/admin/operations/clear-cache`).
   - Degrade unverified PU drilldowns gracefully while keeping high-level aggregated results fully responsive.

---

## Runbook 2: Ingestion Circuit Breaker & INEC API Outage Response

### Context
If the official INEC IReV results portal experiences latency spikes, HTTP 500/503 errors, or rate-limiting:

### Automated System Behavior
1. The built-in `CircuitBreaker` (`backend/app/core/reliability.py`) tracks sequential failures.
2. Upon 5 consecutive failures, the circuit breaker shifts to `OPEN` state.
3. Requests to external sources fail fast without exhausting application thread pools.
4. The system automatically switches to serving the last verified snapshot.

### Operational Intervention Steps
1. Navigate to **Administrative Command Centre -> Operations** tab.
2. Inspect the **INEC Official Portal Connectivity** status card.
3. Click **"Test Connection"** to send a synthetic health ping and determine if rate limits or network issues are the cause.
4. If the INEC portal is undergoing prolonged maintenance:
   - Toggle **"Pause Ingestion Scheduler"** to suspend polling and prevent IP bans.
   - Enable manual Form EC8A ingestion mode for regional coordinators.
5. Once the external service recovers, resume the scheduler and trigger a test ingestion batch.

---

## Runbook 3: Disaster Recovery & Data Backup / Restore

### Objectives
- **Recovery Point Objective (RPO)**: < 5 minutes of data loss.
- **Recovery Time Objective (RTO)**: < 15 minutes to full service restoration.

### Backup Strategy
- **Continuous Archiving**: PostgreSQL WAL (Write-Ahead Logging) continuously archived to Google Cloud Storage bucket `gs://election-watch-wal-archive/`.
- **Hourly Automated Snapshots**: Managed Cloud SQL automated regional snapshots retained for 30 days.
- **Document Evidence**: Form EC8A scans and observer evidence are stored in versioned, object-locked GCS buckets with immutable lifecycle policies.

### Point-in-Time Recovery (PITR) Procedure
```bash
# 1. Identify recovery timestamp (e.g. before an accidental data corruption event)
TARGET_TIME="2027-02-27T17:45:00Z"

# 2. Restore Cloud SQL instance to a new point-in-time replica
gcloud sql instances clone election-watch-sql-prod election-watch-sql-restored \
    --point-in-time="$TARGET_TIME"

# 3. Verify table record counts and SHA-256 hash integrity
psql -h <RESTORED_IP> -U postgres -d election_watch -c "
  SELECT count(*) FROM polling_units;
  SELECT count(*) FROM result_sheets;
  SELECT count(*) FROM audit_logs;
"

# 4. Update DATABASE_URL secret in Secret Manager to point to restored instance
gcloud secrets versions add election-watch-secrets --data-file=new-db-config.json

# 5. Restart Cloud Run services
gcloud run services update election-watch-backend --update-env-vars RESTART_TRIGGER=$(date +%s)
```

---

## Runbook 4: Observer Credential & Account Compromise Response

### Indicators
- Repeated failed login attempts triggering brute-force rate limit (HTTP 429).
- Submissions from unusual IP blocks or jurisdictions mismatched with observer accreditation.

### Immediate Containment Steps
1. Navigate to **Admin Command Centre -> Users & Access**.
2. Search for the affected observer's email or accreditation badge (e.g. `OBS-KD-4412`).
3. Click **"Deactivate Account"** immediately. This instantly revokes all active JWT tokens and blocks API submissions.
4. If erroneous incident reports or result sheets were submitted:
   - Reassign disputed result sheets via **Admin Command Centre -> Supervision -> Reassign Disputed**.
   - Flag any suspect incident reports as `REJECTED` to prevent public dissemination.
5. Issue a new one-time password reset credential via **"Reset Access"**.

---

## Runbook 5: Cryptographic Audit Trail Verification

### Verification Procedure
1. Export the certified read-only audit log:
   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
       https://api.electionwatch.ng/api/v1/admin/audit-logs/export > certified_audit_trail.json
   ```
2. Verify SHA-256 integrity checksum:
   ```bash
   # Extract the reported checksum and compute over payload
   REPORTED_HASH=$(jq -r '.data.integritySha256' certified_audit_trail.json)
   ACTUAL_HASH=$(jq -c '.data.logs' certified_audit_trail.json | sha256sum | awk '{print $1}')
   echo "Reported: $REPORTED_HASH"
   echo "Computed: $ACTUAL_HASH"
   ```
3. If hashes match, the audit trail is cryptographically verified as intact and tamper-free.
