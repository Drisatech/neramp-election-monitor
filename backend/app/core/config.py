import os
import sys
from typing import List, Optional

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    class BaseSettings:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    def Field(default=None, **kwargs):
        return default


class Settings(BaseSettings):
    PROJECT_NAME: str = "NIGERIA ELECTION WATCH"
    PROJECT_SUBTITLE: str = "Election Results Analysis and Monitoring Platform"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode: development, testing, staging, production
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Cryptographic secrets
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "nigeria-election-watch-dev-secret-key-change-in-production-min32chars"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Data Source & Demonstration Flags
    DATA_SOURCE_MODE: str = os.getenv("DATA_SOURCE_MODE", "DEVELOPMENT")
    IS_DEMONSTRATION: bool = os.getenv("IS_DEMONSTRATION", "true").lower() in ("true", "1")
    
    # Database (PostgreSQL with PostGIS)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/election_watch"
    )
    SYNC_DATABASE_URL: str = os.getenv(
        "SYNC_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/election_watch"
    )
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "20"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    
    # Redis / In-Memory Caching & Distributed Job Locks
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    CACHE_DEFAULT_TTL_SECONDS: int = int(os.getenv("CACHE_DEFAULT_TTL_SECONDS", "300"))
    
    # Approved Official Portal Reference
    INEC_OFFICIAL_PORTAL_URL: str = "https://inecelectionresults.ng"
    INEC_API_BASE_URL: Optional[str] = os.getenv("INEC_API_BASE_URL")
    INEC_API_KEY: Optional[str] = os.getenv("INEC_API_KEY")
    INEC_CLIENT_CERT_PATH: Optional[str] = os.getenv("INEC_CLIENT_CERT_PATH")
    
    # Ingestion Configuration
    INGESTION_REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("INGESTION_REQUEST_TIMEOUT_SECONDS", "30"))
    INGESTION_MAX_RETRIES: int = int(os.getenv("INGESTION_MAX_RETRIES", "3"))
    INGESTION_BACKOFF_FACTOR: float = float(os.getenv("INGESTION_BACKOFF_FACTOR", "2.0"))
    INGESTION_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("INGESTION_RATE_LIMIT_PER_MINUTE", "60"))
    
    # OCR Settings
    OCR_ENGINE: str = os.getenv("OCR_ENGINE", "tesseract")
    OCR_CONFIDENCE_THRESHOLD: float = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "85.0"))
    
    # Security & Rate Limiting
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_DURATION_MINUTES: int = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))
    RATE_LIMIT_LOGIN_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", "10"))
    RATE_LIMIT_GENERAL_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_GENERAL_PER_MINUTE", "120"))
    
    # Secure Evidence & File Uploads
    UPLOAD_MAX_FILE_SIZE_BYTES: int = int(os.getenv("UPLOAD_MAX_FILE_SIZE_BYTES", str(10 * 1024 * 1024)))
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".pdf"]
    ALLOWED_UPLOAD_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "application/pdf",
    ]
    STORAGE_LOCAL_PATH: str = os.getenv("STORAGE_LOCAL_PATH", "./data/uploads")
    STORAGE_BUCKET_NAME: Optional[str] = os.getenv("STORAGE_BUCKET_NAME")
    
    # Cookie & Session Security
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    COOKIE_HTTPONLY: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

    def validate_production_readiness(self) -> None:
        """
        Validates critical configuration when running in production or staging.
        Fails safely and halts startup if dangerous defaults or missing configurations are detected.
        """
        if self.ENVIRONMENT in ("production", "staging"):
            insecure_keys = [
                "nigeria-election-watch-dev-secret-key-change-in-production-min32chars",
                "change-in-production-secure-32char-token",
                "secret",
                "password",
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_keys or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    f"CRITICAL PRODUCTION ERROR: SECRET_KEY must be a cryptographically secure random "
                    f"string of at least 32 characters in {self.ENVIRONMENT} mode. Current length: {len(self.SECRET_KEY or '')}."
                )


settings = Settings()
