# Environment Variables Reference - Nigeria Election Watch 2027

This reference document defines all environment variables utilized across the Nigeria Election Watch platform, detailing types, default values, sensitivity levels, and environment profiles.

---

## 1. Core Application Variables

| Variable | Type | Default | Environments | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | String | `NIGERIA ELECTION WATCH` | All | Public application branding title. |
| `PROJECT_SUBTITLE` | String | `Election Results Analysis and Monitoring Platform` | All | Secondary application descriptive subtitle. |
| `API_V1_STR` | String | `/api/v1` | All | API Gateway prefix for versioned routes. |
| `ENVIRONMENT` | String | `development` | All | Deployment profile: `development`, `testing`, `staging`, or `production`. |
| `PORT` | Integer | `8000` (Backend) / `3000` (Frontend) | All | Container listening port (Cloud Run sets this automatically). |

---

## 2. Security & Authentication Configuration (SENSITIVE)

| Variable | Type | Default / Requirement | Sensitivity | Description |
| :--- | :--- | :--- | :--- | :--- |
| `SECRET_KEY` | String | Must be $\ge$ 32 chars in production | **CRITICAL** | HMAC-SHA256 signing secret for JWT access tokens and state verification. |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Integer | `1440` (24 Hours) | Low | Duration before an access token expires. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Integer | `7` | Low | Duration before a refresh token expires. |
| `MAX_LOGIN_ATTEMPTS` | Integer | `5` | Low | Maximum failed login attempts before temporary lockout. |
| `LOCKOUT_DURATION_MINUTES` | Integer | `15` | Low | Lockout duration following repeated authentication failures. |
| `COOKIE_SECURE` | Boolean | `false` (Dev) / `true` (Prod) | Low | When `true`, session cookies require HTTPS. |
| `COOKIE_SAMESITE` | String | `lax` | Low | SameSite cookie policy (`lax`, `strict`, `none`). |

---

## 3. Database & Caching Infrastructure (SENSITIVE)

| Variable | Type | Default | Sensitivity | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | `postgresql+asyncpg://...` | **HIGH** | Connection URI for FastAPI async SQLAlchemy connection pool. |
| `SYNC_DATABASE_URL` | String | `postgresql://...` | **HIGH** | Connection URI for Alembic migrations and background Celery/scheduler jobs. |
| `DB_POOL_SIZE` | Integer | `20` | Low | Maximum number of permanent connections in the pool. |
| `DB_MAX_OVERFLOW` | Integer | `10` | Low | Maximum overflow connections allowed beyond `DB_POOL_SIZE`. |
| `REDIS_URL` | String | `redis://...` | **HIGH** | Redis connection URI for caching summaries and managing distributed mutex locks. |
| `CACHE_DEFAULT_TTL_SECONDS`| Integer | `300` | Low | Default TTL (in seconds) for cached public election dashboards. |

---

## 4. Official Election Source Integration (SENSITIVE)

| Variable | Type | Default | Sensitivity | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATA_SOURCE_MODE` | String | `DEVELOPMENT` | Low | Modes: `DEVELOPMENT`, `HISTORICAL`, `MANUAL_IMPORT`, `OFFICIAL_SOURCE`. |
| `IS_DEMONSTRATION` | Boolean | `true` (Dev) / `false` (Prod) | Low | Disclaims synthetic demonstration data vs official election records. |
| `INEC_OFFICIAL_PORTAL_URL` | String | `https://inecelectionresults.ng` | Low | Public reference URL for official INEC portal. |
| `INEC_API_BASE_URL` | String | `https://api.inecelectionresults.ng/v1` | Low | Endpoint URL for authorized automated result syndication. |
| `INEC_API_KEY` | String | Empty (Optional in dev) | **CRITICAL** | Authorized API Key or Bearer token for automated data retrieval. |
| `INGESTION_RATE_LIMIT_PER_MINUTE` | Integer | `60` | Low | Ingestion client throttle limit to prevent overloading upstream endpoints. |

---

## 5. Evidence & Storage Configuration

| Variable | Type | Default | Sensitivity | Description |
| :--- | :--- | :--- | :--- | :--- |
| `UPLOAD_MAX_FILE_SIZE_BYTES`| Integer | `10485760` (10MB) | Low | Maximum file size for Form EC8A scans and incident photos. |
| `STORAGE_LOCAL_PATH` | String | `./data/uploads` | Low | Local filesystem fallback path for file uploads during development. |
| `STORAGE_BUCKET_NAME` | String | Empty | Medium | Cloud Storage bucket name for persistent immutable document storage. |

---

## 6. Startup Validation Behavior

The backend enforces strict startup validation:
- When `ENVIRONMENT=production` or `ENVIRONMENT=staging`, `Settings.validate_production_readiness()` checks that `SECRET_KEY` is not default or shorter than 32 characters.
- If invalid, the application raises a fatal error immediately and refuses to start, preventing insecure deployments from serving traffic.
