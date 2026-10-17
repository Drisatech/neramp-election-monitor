# Production Deployment Guide - Nigeria Election Watch 2027

This guide outlines deployment procedures across Local, Staging, and Production environments for the Nigeria Election Watch platform.

---

## 1. Local Development & Testing Deployment

### Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.20+
- Node.js 20 LTS & Python 3.12 (optional for running outside containers)

### Step-by-Step Local Deployment
1. **Clone the repository & copy environment configuration:**
   ```bash
   cp .env.example .env
   ```

2. **Launch all services via Docker Compose:**
   ```bash
   docker compose up -d --build
   ```
   This will spin up:
   - `election_watch_db`: PostgreSQL 16 + PostGIS on port 5432
   - `election_watch_redis`: Redis 7.2 on port 6379
   - `election_watch_backend`: FastAPI API Gateway on port 8000
   - `election_watch_worker`: Background OCR & Ingestion worker
   - `election_watch_frontend`: React + Express Web Application on port 3000

3. **Verify service health probes:**
   ```bash
   curl -f http://localhost:8000/api/v1/health
   curl -f http://localhost:8000/api/v1/health/ready
   curl -f http://localhost:3000/api/v1/health
   ```

4. **Run backend automated test suite:**
   ```bash
   python3 -m unittest discover backend/tests
   ```

---

## 2. Staging Environment Deployment

Staging mirrors production with synthetic election fixtures and test credentials.

1. **Create Staging Secrets in Secret Manager:**
   ```bash
   gcloud secrets create election-watch-secrets-staging --data-file=.env.staging
   ```

2. **Deploy Cloud SQL (PostGIS enabled):**
   ```bash
   gcloud sql instances create election-watch-sql-staging \
       --database-version=POSTGRES_16 \
       --tier=db-custom-2-7680 \
       --region=europe-west1
   ```

3. **Run Database Migrations (Alembic):**
   ```bash
   alembic upgrade head
   ```

---

## 3. Production Deployment (Google Cloud Run & Cloud SQL)

### Prerequisites
- Google Cloud SDK (`gcloud`) initialized with active project billing
- Cloud SQL Admin, Cloud Run Admin, and Secret Manager access roles

### Architecture Setup

1. **Deploy Managed Cloud SQL with PostGIS:**
   ```bash
   gcloud sql instances create election-watch-sql-prod \
       --database-version=POSTGRES_16 \
       --tier=db-custom-8-32768 \
       --region=europe-west1 \
       --availability-type=REGIONAL \
       --backup-start-time=02:00 \
       --enable-bin-log \
       --storage-auto-increase
   
   # Connect and enable PostGIS extension
   gcloud sql connect election-watch-sql-prod --user=postgres
   # Inside psql:
   CREATE DATABASE election_watch;
   \c election_watch;
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **Configure Production Secrets:**
   ```bash
   # Generate 32-byte cryptographic secret key
   SECRET_KEY=$(openssl rand -hex 32)
   
   gcloud secrets create election-watch-secrets --replication-policy="automatic"
   echo -n "{\"database_url\":\"postgresql+asyncpg://...\", \"secret_key\":\"$SECRET_KEY\"}" | \
       gcloud secrets versions add election-watch-secrets --data-file=-
   ```

3. **Build and Push Container Images:**
   ```bash
   # Build FastAPI Backend
   docker build -t gcr.io/$PROJECT_ID/election-watch-backend:v1.0.0 -f backend/Dockerfile .
   docker push gcr.io/$PROJECT_ID/election-watch-backend:v1.0.0
   
   # Build React Frontend
   docker build -t gcr.io/$PROJECT_ID/election-watch-frontend:v1.0.0 -f Dockerfile.frontend .
   docker push gcr.io/$PROJECT_ID/election-watch-frontend:v1.0.0
   
   # Build Background Worker
   docker build -t gcr.io/$PROJECT_ID/election-watch-worker:v1.0.0 -f backend/Dockerfile.worker .
   docker push gcr.io/$PROJECT_ID/election-watch-worker:v1.0.0
   ```

4. **Deploy Backend Service to Google Cloud Run:**
   ```bash
   gcloud run services replace deploy/cloudrun-backend.yaml
   ```

5. **Deploy Frontend Web Tier to Google Cloud Run:**
   ```bash
   gcloud run services replace deploy/cloudrun-frontend.yaml
   ```

6. **Post-Deployment Smoke Test:**
   ```bash
   curl -I https://api.electionwatch.ng/api/v1/health
   curl -I https://api.electionwatch.ng/api/v1/health/ready
   curl -I https://electionwatch.ng/
   ```
