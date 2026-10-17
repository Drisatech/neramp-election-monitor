import base64
import hashlib
import hmac
import json
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict, List, Set, Tuple

from backend.app.core.config import settings

# Graceful dependency handling for FastAPI / passlib / jose
try:
    from fastapi import HTTPException, Security, status, Depends
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    security_scheme = HTTPBearer(auto_error=False)
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(detail)

    class status:
        HTTP_400_BAD_REQUEST = 400
        HTTP_401_UNAUTHORIZED = 401
        HTTP_403_FORBIDDEN = 403
        HTTP_404_NOT_FOUND = 404
        HTTP_429_TOO_MANY_REQUESTS = 429

    def Depends(f):
        return f

    def Security(f):
        return None

    security_scheme = None
    HTTPAuthorizationCredentials = Any

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    HAS_PASSLIB = True
except ImportError:
    pwd_context = None
    HAS_PASSLIB = False


# In-memory Token Revocation Blocklist (can be backed by Redis in production)
REVOKED_TOKENS: Set[str] = set()

# Login Rate-Limiting & Brute Force Lockout Tracker
LOGIN_ATTEMPTS: Dict[str, Dict[str, Any]] = {}


# ==========================================
# SECURE PASSWORD HASHING (BCRYPT / PBKDF2)
# ==========================================

def get_password_hash(password: str) -> str:
    """Generates a secure password hash with salt."""
    if HAS_PASSLIB and pwd_context:
        return pwd_context.hash(password)
    # Standard library fallback: PBKDF2-HMAC-SHA256 with 100,000 iterations
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"pbkdf2_sha256$100000${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the hash."""
    if HAS_PASSLIB and pwd_context and not hashed_password.startswith("pbkdf2_sha256$"):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass

    if hashed_password.startswith("pbkdf2_sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 4:
            _, rounds, salt_hex, key_hex = parts
            salt = bytes.fromhex(salt_hex)
            key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, int(rounds))
            return hmac.compare_digest(key.hex(), key_hex)

    return False


# ==========================================
# CRYPTOGRAPHIC JWT SIGNING & VERIFICATION
# ==========================================

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data_str: str) -> bytes:
    padding = "=" * (4 - len(data_str) % 4)
    return base64.urlsafe_b64decode((data_str + padding).encode("utf-8"))


def create_access_token(
    subject: str | Any,
    role: str = "PUBLIC_USER",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Creates a signed HMAC-SHA256 JWT access token with JTI and role claims."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    jti = str(uuid.uuid4())
    payload = {
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "sub": str(subject),
        "role": role,
        "jti": jti,
    }
    if extra_claims:
        payload.update(extra_claims)

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    message = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def create_refresh_token(subject: str | Any) -> Tuple[str, str]:
    """Generates a long-lived refresh token and returns (token, jti)."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = str(uuid.uuid4())
    payload = {
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
    }

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    message = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}", jti


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes, verifies signature, expiry, and checks revocation blocklist."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")

        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
        actual_sig = _base64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Check expiration
        now_ts = int(datetime.now(timezone.utc).timestamp())
        if "exp" in payload and now_ts > payload["exp"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")

        # Check revocation
        jti = payload.get("jti")
        if jti and jti in REVOKED_TOKENS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked or invalidated.",
            )

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )


def revoke_token(token: str) -> bool:
    """Adds a token's jti to the revocation blocklist."""
    try:
        parts = token.split(".")
        if len(parts) == 3:
            payload = json.loads(_base64url_decode(parts[1]).decode("utf-8"))
            jti = payload.get("jti")
            if jti:
                REVOKED_TOKENS.add(jti)
                return True
        return False
    except Exception:
        return False


# ==========================================
# BRUTE-FORCE & LOGIN RATE LIMITING
# ==========================================

def check_login_rate_limit(identifier: str) -> None:
    now = datetime.now(timezone.utc)
    record = LOGIN_ATTEMPTS.get(identifier)
    if record:
        locked_until = record.get("locked_until")
        if locked_until and now < locked_until:
            remaining_seconds = int((locked_until - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Account temporarily locked for {remaining_seconds} seconds.",
            )
        if locked_until and now >= locked_until:
            LOGIN_ATTEMPTS.pop(identifier, None)


def record_login_attempt(identifier: str, success: bool) -> None:
    now = datetime.now(timezone.utc)
    if success:
        LOGIN_ATTEMPTS.pop(identifier, None)
        return

    record = LOGIN_ATTEMPTS.get(identifier, {"attempts": 0, "locked_until": None})
    record["attempts"] += 1
    if record["attempts"] >= settings.MAX_LOGIN_ATTEMPTS:
        record["locked_until"] = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
    LOGIN_ATTEMPTS[identifier] = record


# ==========================================
# FILE UPLOAD SECURITY & DATA INTEGRITY
# ==========================================

ALLOWED_MIME_TYPES = set(settings.ALLOWED_UPLOAD_MIME_TYPES)
ALLOWED_EXTENSIONS = set(settings.ALLOWED_UPLOAD_EXTENSIONS)

MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"%PDF-": "application/pdf",
}


def compute_sha256(data: bytes) -> str:
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest()


def validate_file_upload(
    filename: str,
    content: bytes,
    content_type: Optional[str] = None,
) -> Tuple[bool, str, str]:
    if len(content) > settings.UPLOAD_MAX_FILE_SIZE_BYTES:
        return False, f"File exceeds maximum allowed size ({settings.UPLOAD_MAX_FILE_SIZE_BYTES // (1024*1024)}MB)", ""

    if len(content) < 8:
        return False, "File is empty or corrupted", ""

    clean_filename = os.path.basename(filename)
    if ".." in filename or clean_filename != filename:
        return False, "Path traversal pattern detected in filename", ""

    ext = os.path.splitext(clean_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File extension '{ext}' not permitted. Allowed: {', '.join(ALLOWED_EXTENSIONS)}", ""

    matched_type = None
    for header, m_type in MAGIC_BYTES.items():
        if content.startswith(header):
            matched_type = m_type
            break

    if not matched_type:
        return False, "File binary signature does not match allowed types (JPEG, PNG, PDF)", ""

    if content_type and content_type not in ALLOWED_MIME_TYPES:
        return False, f"Provided Content-Type '{content_type}' is not permitted", ""

    sha256_hash = compute_sha256(content)
    return True, "", sha256_hash


def generate_secure_storage_key(filename: str, prefix: str = "evidence") -> str:
    ext = os.path.splitext(os.path.basename(filename))[1].lower()
    unique_id = uuid.uuid4().hex
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return f"{prefix}/{timestamp}_{unique_id}{ext}"


# ==========================================
# OBSERVER PRIVACY & DATA SANITIZATION
# ==========================================

def sanitize_observer_data(observer_data: Dict[str, Any], is_public_view: bool = True) -> Dict[str, Any]:
    sanitized = dict(observer_data)
    if is_public_view:
        if "phone" in sanitized:
            sanitized["phone"] = "[REDACTED FOR OBSERVER SAFETY]"
        if "email" in sanitized and sanitized.get("role") == "REGISTERED_OBSERVER":
            parts = sanitized["email"].split("@")
            if len(parts) == 2:
                user_part, domain = parts
                masked_user = user_part[0] + "***" + (user_part[-1] if len(user_part) > 1 else "")
                sanitized["email"] = f"{masked_user}@{domain}"
        if "homeAddress" in sanitized:
            sanitized.pop("homeAddress", None)
        if "exactGpsCoordinates" in sanitized:
            sanitized.pop("exactGpsCoordinates", None)

    return sanitized


# ==========================================
# FASTAPI ROLE-BASED ACCESS CONTROL DEPENDENCIES
# ==========================================

def get_current_user_claims(
    credentials: Optional[Any] = None,
) -> Dict[str, Any]:
    if not credentials:
        return {"sub": "public-anonymous", "role": "PUBLIC_USER"}
    token = getattr(credentials, "credentials", str(credentials))
    return decode_token(token)


def require_roles(allowed_roles: List[str]):
    def role_checker(claims: Dict[str, Any]) -> Dict[str, Any]:
        user_role = claims.get("role", "PUBLIC_USER")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user_role}' does not have required permissions. Required: {', '.join(allowed_roles)}.",
            )
        return claims
    return role_checker
