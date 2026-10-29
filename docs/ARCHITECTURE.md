# Production Architecture Overview - Nigeria Election Watch 2027

> **Implementation status (important):** This document includes a target-state architecture, not proof that all components are deployed or connected. The active Render blueprint currently deploys the Node.js/Express API in `server.ts`. The frontend calls `/api/v1` on that server. The separate FastAPI/PostgreSQL/Redis stack in `docker-compose.yml` is a development/reference implementation and is not the canonical production API. The current Node service uses JSON-file/in-memory stores; it does not yet use the PostgreSQL/PostGIS schema described below. Do not infer production readiness, durable backups, or a live INEC integration from the target-state diagram.

## 1. System Topology & Production Components

Nigeria Election Watch is architected as an independent, enterprise-grade, fault-tolerant election monitoring and verification platform designed to handle peak election-day loads across 176,846 polling units across all 36 States and the Federal Capital Territory (FCT).

```
                      ┌───────────────────────────────────────────────┐
                      │    Public Traffic & Election Observers        │
                      └──────────────────────┬────────────────────────┘
                                             │ HTTPS (TLS 1.3)
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │    Cloud Armor / WAF / CDN / Rate Limiting   │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      │                                               │
                      ▼                                               ▼
     ┌───────────────────────────────────┐           ┌───────────────────────────────────┐
     │    React Web Application (SPA)    │           │    FastAPI Application Gateway    │
     │  - Vite / Tailwind CSS / Leaflet  │           │  - Non-blocking async endpoints   │
     │  - Strict CSP & Security Headers  │           │  - Role-based authorization (RBAC)│
     │  - Google Cloud Run (Autoscaling) │           │  - Rate limiting & Audit logger   │
     └───────────────────────────────────┘           └─────────────────┬─────────────────┘
                                                                       │
                                   ┌───────────────────────────────────┼──────────────────────────────────┐
                                   │                                   │                                  │
                                   ▼                                   ▼                                  ▼
                    ┌────────────────────────────┐      ┌─────────────────────────────┐    ┌──────────────────────────────┐
                    │ Managed PostgreSQL+PostGIS │      │ Redis Cache & Mutex Lock    │    │ Persistent Object Storage    │
                    │ - 30 Normalized tables     │      │ - Results summary caching   │    │ - Immutable EC8A form scans  │
                    │ - Geospatial indexes       │      │ - Distributed job locks     │    │ - Observer incident photos   │
                    │ - Append-only audit trails │      │ - Rate limit tracking       │    │ - SHA-256 verified integrity │
                    └────────────────────────────┘      └──────────────┬──────────────┘    └──────────────────────────────┘
                                                                       │
                                                                       ▼
                                                        ┌─────────────────────────────┐
                                                        │ Background Processing Pool  │
                                                        │ - Dedicated container jobs  │
                                                        │ - Scheduled INEC ingestion  │
                                                        │ - Tesseract/PyMuPDF OCR     │
                                                        │ - Anomaly & Alert engine    │
                                                        └──────────────┬──────────────┘
                                                                       │
                                                                       ▼
                                                        ┌─────────────────────────────┐
                                                        │ INEC Official Portal (IReV) │
                                                        │ (Rate limited, retried with │
                                                        │  exponential backoff & CB)  │
                                                        └─────────────────────────────┘
```

## 2. Infrastructure Tiers

### A. Web Tier (React SPA)
- Deployed on autoscaling container platform (Google Cloud Run / Kubernetes).
- Min instances: 2, Max instances: 100 on election day.
- Hardened HTTP security headers: Content-Security-Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict CORS policies.
- Client-side data masking guaranteeing observer privacy in all public dashboards.

### B. API Gateway Tier (FastAPI)
- High-concurrency async Python runtime with Uvicorn workers.
- Stateless design enabling seamless horizontal autoscaling.
- Cryptographically verified JWT sessions with token revocation blocklist (`jti`).
- Built-in brute force lockout and IP-level rate-limiting.
- Readiness (`/api/v1/health/ready`) and Liveness (`/api/v1/health/live`) probes.

### C. Persistent Storage Tier
- **Managed PostgreSQL 16 with PostGIS**: Geographic polygons and centroids for all 36 States, 774 LGAs, 8,809 Wards, and 176,846 Polling Units. Connection pooling via PgBouncer.
- **Encrypted Object Storage (GCS / S3)**: Append-only storage for original Form EC8A scans, verified transcription proofs, and incident evidence. Content addressed by SHA-256 hashes to prevent tampering or overwriting.

### D. Dedicated Background Worker Tier
- Background workers decoupled from user-facing API containers to prevent resource contention during heavy OCR and image processing.
- Handles polling unit batch ingestion, OCR extraction, arithmetic reconciliation, and statistical anomaly detection.
- Distributed job locks managed via Redis to prevent concurrent duplicate ingestion runs.

## 3. Data Protection & Security Perimeter

1. **Role-Based Access Control (RBAC)**:
   - `SUPER_ADMIN`: System configuration, user account management, read-only audit exports.
   - `PROJECT_ADMIN`: Observer and coordinator supervision, approval workflows.
   - `MONITORING_COORDINATOR`: Regional report review, clarification requests, publication authorizations.
   - `RESULT_VERIFIER`: Result-sheet transcription verification, discrepancy logging.
   - `REGISTERED_OBSERVER`: Geo-assigned PU incident submission, evidence upload, draft tracking.
   - `PUBLIC_USER`: Read-only access to published, verified election results and incidents.
2. **Observer Anonymity Guarantee**: Personal telephone numbers, home addresses, and real-time GPS locations are never exposed to public APIs or frontend code. Public incident feeds display only administrative jurisdictions and masked accreditation badges.
3. **Audit Trail Immutability**: All modifications generate immutable records tracking actor, timestamp, prior value, new value, and justification. Exported audit streams include cryptographic SHA-256 hashes for independent verification.
