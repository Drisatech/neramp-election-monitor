# NIGERIA ELECTION WATCH
### Election Results Analysis and Monitoring Platform (Nigeria 2027 General Elections)

> **DEVELOPMENT MODE NOTICE**: Demonstration data only. All candidate names and numerical records in development mode are fictional simulations. This platform is an independent election analysis and monitoring tool and is **not an official INEC product**.

---

## 1. Project Overview

**Nigeria Election Watch** is a modern, data-driven web application designed for analyzing Nigerian election results, monitoring the availability of official Form EC8A polling-unit result sheets, supporting independent election observers, verifying transcribed figures against source documents, and identifying data discrepancies using deterministic rules.

The current Render production entry point is **React/Vite + Node.js/Express** (`server.ts`), and its API is the canonical application API for this repository. The separate **FastAPI/PostgreSQL/PostGIS** implementation is a prototype/reference backend and is not wired into the Render blueprint or the frontend API path. Do not run both as competing production sources of election data. See [Production Hardening](docs/PRODUCTION_HARDENING.md).

Official reference portal:
https://inecelectionresults.ng/elections/types

---

## 2. Key Capabilities

* **National Election Overview & Dashboard**:
  - Polling unit upload completion monitoring.
  - Candidate and political party vote share comparisons.
  - Verification queue status and arithmetic consistency checks.
  - Neutral data discrepancy reporting.

* **Geographical Navigation & Polling Unit Explorer**:
  - Hierarchy: Nigeria &rarr; State &rarr; LGA &rarr; Ward &rarr; Polling Unit.
  - Strict preservation of official zero-padded polling unit strings (e.g. `25-01-01-001`).
  - Interactive Leaflet map of all 36 Nigerian states and the Federal Capital Territory (FCT).

* **Source Document & EC8A Viewer**:
  - Image viewer with pan, zoom, and rotate controls.
  - Cryptographic SHA-256 document checksum validation.
  - Clear separation of source upload timestamps vs platform retrieval timestamps.

* **Side-by-Side Transcription Verification Workspace**:
  - Side-by-side view of scanned Form EC8A alongside extracted OCR figures.
  - Deterministic ballot arithmetic check: `Valid Votes + Rejected Ballots = Total Votes Cast`.
  - Audited correction logs requiring explanation for every manual modification.

* **Observer & Incident Monitoring Portal**:
  - Role-Based Access Control (`SUPER_ADMIN`, `MONITORING_COORDINATOR`, `RESULT_VERIFIER`, `REGISTERED_OBSERVER`, `PUBLIC_USER`).
  - Secure field report submission with category, severity, and status progression (`SUBMITTED` &rarr; `UNDER_REVIEW` &rarr; `VERIFIED` &rarr; `APPROVED_FOR_PUBLICATION`).

* **Modular Source Adapters**:
  - `ElectionSourceAdapter` (Common contract).
  - `InecApprovedSourceAdapter` (Integration point for the approved official INEC portal).
  - `DevelopmentFixtureAdapter` (Isolated demonstration records).
  - `HistoricalDataAdapter` & `ManualImportAdapter`.

* **Security & Permitted Exports**:
  - Sanitized CSV exports with protection against formula injection (`=`, `+`, `-`, `@`).
  - Structured audit trail for all verification and ingestion events.

---

## 3. Quick Start & Startup Instructions

### Option A: Local Development Server (Node.js & Vite / Express Full-Stack)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

3. **Verify API health**:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

---

### Option B: FastAPI reference backend (development only)

> **Not the production API.** This parallel implementation contains independent in-memory services and fixtures. Do not use it as a second production backend or treat its health checks as evidence of production database readiness. The Node/Express API remains canonical until a deliberate, tested migration replaces it.

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment and install requirements**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start the FastAPI server**:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Open `http://localhost:8000/docs` to inspect interactive Swagger documentation.

5. **Run automated backend tests**:
   ```bash
   pytest
   ```

---

### Option D: Deploy to Render.com with GitHub (Zero-Config Continuous Deployment)

The repository includes a ready-to-use `render.yaml` blueprint:

1. Push your repository to GitHub.
2. In [Render.com](https://render.com), select **New +** &rarr; **Blueprint** and connect your repository.
3. Render automatically reads `render.yaml`, runs `npm install && npm run build`, and starts `npm start` on dynamic `PORT`.
4. Continuous deployment is automated on push to GitHub.

To disconnect older Google Cloud Run triggers and manage webhook settings, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 4. Environment Variables

See `.env.example` for the full reference configuration:

```env
PROJECT_NAME="NIGERIA ELECTION WATCH"
DATA_SOURCE_MODE=OFFICIAL-SOURCE
IS_DEMONSTRATION=false
DATABASE_URL=
SYNC_DATABASE_URL=
SECRET_KEY=secure-jwt-secret-key-min-32-chars
INEC_OFFICIAL_PORTAL_URL=https://inecelectionresults.ng/elections/types
# Required for live retrieval; configure only after verifying the endpoint, access permission, and response contract.
INEC_RESULTS_API_BASE_URL=
```

---

## 5. Documentation Directory

- `docs/ARCHITECTURE.md`: Complete system architecture, data flow, and technology breakdown.
- `docs/INEC_INTEGRATION_SPEC.md`: Technical specification and credentials guide for connecting the live official INEC portal.
- `docs/DATA_DICTIONARY.md`: Full schema documentation for all 30 database tables.
- `docs/SECURITY_CHECKLIST.md`: Cybersecurity guidelines, RBAC policies, and formula injection mitigations.

---

## 6. License & Disclaimer

Independent election results analysis and monitoring platform. Data is presented with source references and verification status. This platform is not an official INEC website.
