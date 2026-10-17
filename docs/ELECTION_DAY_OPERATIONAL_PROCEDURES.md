# NERAMP: Election-Day Operational Procedures & Incident Response Runbook

This document defines standardized standard operating procedures (SOPs), role responsibilities, escalation workflows, and failure response protocols for administrators, verification officers, and technical personnel during election operations.

---

## 1. Operational Roles & Responsibilities

| Role | Primary Election-Day Responsibilities | Emergency Escalation Authority |
| :--- | :--- | :--- |
| **System Administrator (SRE / DevOps)** | Infrastructure uptime, container auto-scaling, database connection pools, Cloud Armor WAF monitoring, circuit-breaker supervision. | Authority to declare Infrastructure Red Alert, throttle non-critical endpoints, restart instances. |
| **Database Administrator (DBA)** | PgBouncer pool health, PostgreSQL replication lag, point-in-time snapshot verification, query performance optimization. | Authority to freeze long-running analytical queries and initiate replica failover. |
| **Monitoring Coordinator** | Regional incident review, approving observer field reports for publication, coordinating with state field supervisors. | Authority to escalate critical security incidents to public liaison. |
| **Result Verification Lead** | Supervising dual-transcription queue, reassigning disputed Form EC8A sheets, resolving arithmetic discrepancies. | Authority to route disputed result sheets for secondary verification. |
| **Data Analyst** | Monitoring statistical turnout anomalies, baseline variance detection, generating authorized analytical reports. | Authority to flag high-turnout polling units as investigation leads (without fraud presumption). |

---

## 2. Pre-Election Preparation Protocol (T-24 Hours to T-0)

1. **Infrastructure Pre-Scaling**:
   - Set Cloud Run backend minScale to 10 instances; web tier minScale to 15 instances.
   - Verify PgBouncer connection limit is set to 500 connections (`max_client_conn = 500`).
2. **Cache Warming**:
   - Run cache warming scripts for all 36 States, FCT, and national overview endpoints.
   - Confirm Redis cache hit ratio exceeds 90%.
3. **Connectivity Verification**:
   - Execute synthetic health ping to official portal adapter (`/api/v1/admin/ingestion/test-connection`).
   - Confirm rate-limiting configuration is active (max 60 requests/minute).
4. **Observer Roster Audit**:
   - Audit accredited observers in the database and ensure jurisdiction boundaries (State, LGA) are locked.
   - Verify that observer telephone numbers and PII are redacted from all public serialization routines.
5. **Backup & PITR Baseline**:
   - Take an explicit pre-election database snapshot (`gcloud sql backups create`).
   - Perform a dry-run restoration drill on the staging cluster and verify SHA-256 hash chains.

---

## 3. Election-Day Live Monitoring Schedule (06:00 – 24:00 WAT)

### Phase A: Poll Opening & Accreditation (06:00 – 14:00 WAT)
- **06:00 WAT**: Technical team executes diagnostic health check (`/api/v1/health/ready`).
- **08:30 WAT**: Observers begin submitting morning opening and BVAS accreditation incident reports.
- **Continuous**: Coordinators review incident feed. Incidents with severity `CRITICAL` or `HIGH` are prioritized.

### Phase B: Poll Closing & Form EC8A Upload Surge (14:00 – 20:00 WAT)
- **14:30 WAT**: Ingestion scheduler commences polling for Form EC8A uploads.
- **15:00 WAT**: Result Verification Officers begin dual-key transcription and arithmetic validation.
- **Continuous**: System monitors OCR queue latency. If average OCR latency exceeds 5 seconds per sheet, worker pool auto-scales up to 16 container workers.
- **17:00 WAT**: Public dashboard traffic surge. SRE monitors API p95 latency and database connection pool.

### Phase C: Collation & Verification Climax (20:00 – 04:00+ WAT)
- **20:00 WAT**: Collation completeness reaches critical threshold. Discrepancy logs audited by Verification Leads.
- **22:00 WAT**: Analysts review statistical turnout outliers and ensure neutral, factual labeling.
- **Continuous**: Immutable audit log export taken hourly with cryptographic SHA-256 integrity checksums.

---

## 4. Emergency Incident Response Procedures

### Scenario 1: Upstream Source (INEC Portal) Downtime or Timeout Spike
1. **Automated Response**: Circuit breaker trips to `OPEN` state after 5 consecutive timeouts, failing fast and preventing worker exhaustion.
2. **Dashboard Indicator**: Public dashboard displays prominent notice: *"Official source portal currently synchronizing. Displaying last verified snapshot from [Timestamp]."*
3. **Operator Action**: SRE executes synthetic ping from Admin Command Centre. Do NOT flood upstream portal with manual requests. Wait for recovery timeout; circuit breaker will enter `HALF_OPEN` and self-heal once upstream recovers.

### Scenario 2: High Arithmetic Discrepancy Spike
1. **Verification Action**: Verification Lead filters queue by `DISCREPANCY_FLAGGED`.
2. **Review Protocol**: Compare original Form EC8A scan against OCR extraction and human transcription.
3. **Neutral Escalation**: If discrepancy stems from arithmetic error on original sheet (e.g. valid + rejected != cast), record factual note: *"Arithmetic variance of X votes noted on source Form EC8A"*. Do not claim fraud. Route to secondary reviewer for confirmation.

### Scenario 3: Suspected Observer Credential Compromise
1. **Containment**: Coordinator immediately navigates to **Command Centre -> Users & Access** and deactivates the compromised observer account.
2. **Session Invalidation**: System revokes active JWT token (`revoke_token`).
3. **Audit Inspection**: Review all incident reports submitted by the compromised badge during the preceding 4 hours. Flag unverified reports as `REJECTED`.

---

## 5. Post-Election Reconciliation & Archival Protocol

1. **Final Completeness Audit**: Compare ingested Form EC8A count against total canonical polling units (176,846).
2. **Certified Legal Export**: Export certified audit trail via `/api/v1/admin/audit-logs/export`. Calculate and record overarching SHA-256 hash. Store in immutable cold storage.
3. **Post-Mortem Review**: Convene technical post-mortem within 48 hours to analyze latency percentiles, error spikes, and worker queue performance.
