import unittest
from datetime import timedelta
import time

from backend.app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
    revoke_token,
    check_login_rate_limit,
    record_login_attempt,
    validate_file_upload,
    generate_secure_storage_key,
    sanitize_observer_data,
    compute_sha256,
)
from backend.app.core.config import Settings
from backend.app.core.security import HTTPException


class TestSecurityAndProtection(unittest.TestCase):
    def setUp(self):
        from backend.app.core.security import LOGIN_ATTEMPTS, REVOKED_TOKENS
        LOGIN_ATTEMPTS.clear()
        REVOKED_TOKENS.clear()

    def test_password_hashing(self):
        password = "SecurePassword2027!#"
        hashed = get_password_hash(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_jwt_token_creation_and_claims(self):
        token = create_access_token(
            subject="usr-1234",
            role="MONITORING_COORDINATOR",
            extra_claims={"email": "coordinator@electionwatch.ng", "badge": "COORD-01"},
        )
        claims = decode_token(token)
        self.assertEqual(claims["sub"], "usr-1234")
        self.assertEqual(claims["role"], "MONITORING_COORDINATOR")
        self.assertEqual(claims["email"], "coordinator@electionwatch.ng")
        self.assertIn("jti", claims)
        self.assertIn("exp", claims)

    def test_token_revocation(self):
        token = create_access_token(subject="usr-revoked", role="REGISTERED_OBSERVER")
        claims = decode_token(token)
        self.assertEqual(claims["sub"], "usr-revoked")

        # Revoke the token
        success = revoke_token(token)
        self.assertTrue(success)

        # Decoding now should raise 401
        with self.assertRaises(HTTPException) as ctx:
            decode_token(token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("revoked", ctx.exception.detail.lower())

    def test_brute_force_rate_limiting(self):
        from backend.app.core.config import settings
        identifier = "test_user_ip_bruteforce"
        # Failed attempts below threshold should not lock out
        for _ in range(settings.MAX_LOGIN_ATTEMPTS - 1):
            record_login_attempt(identifier, success=False)
            check_login_rate_limit(identifier)  # Should not raise

        # Final attempt reaching threshold locks out
        record_login_attempt(identifier, success=False)
        with self.assertRaises(HTTPException) as ctx:
            check_login_rate_limit(identifier)
        self.assertEqual(ctx.exception.status_code, 429)
        self.assertIn("locked", ctx.exception.detail.lower())

        # Reset on success
        record_login_attempt(identifier, success=True)
        # Now should not raise
        check_login_rate_limit(identifier)

    def test_observer_data_sanitization_public_view(self):
        raw_observer = {
            "fullName": "Jane Doe",
            "role": "REGISTERED_OBSERVER",
            "email": "janedoe@example.com",
            "phone": "+2348012345678",
            "homeAddress": "12 Secret St, Abuja",
            "exactGpsCoordinates": {"lat": 9.0765, "lng": 7.3986},
            "assignedState": "KD",
            "badge": "OBS-KD-100",
        }
        sanitized = sanitize_observer_data(raw_observer, is_public_view=True)
        self.assertEqual(sanitized["phone"], "[REDACTED FOR OBSERVER SAFETY]")
        self.assertNotIn("homeAddress", sanitized)
        self.assertNotIn("exactGpsCoordinates", sanitized)
        self.assertEqual(sanitized["badge"], "OBS-KD-100")
        self.assertEqual(sanitized["assignedState"], "KD")
        self.assertTrue(sanitized["email"].startswith("j***e@"))

    def test_file_upload_validation_valid_jpeg(self):
        # Valid JPEG magic bytes: \xff\xd8\xff...
        jpeg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00" + b"\x00" * 20
        valid, err, file_hash = validate_file_upload("result_sheet.jpg", jpeg_content, "image/jpeg")
        self.assertTrue(valid)
        self.assertEqual(err, "")
        self.assertEqual(file_hash, compute_sha256(jpeg_content))

    def test_file_upload_validation_valid_pdf(self):
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj"
        valid, err, file_hash = validate_file_upload("ec8a_transcription.pdf", pdf_content, "application/pdf")
        self.assertTrue(valid)
        self.assertEqual(err, "")
        self.assertEqual(len(file_hash), 64)

    def test_file_upload_rejection_path_traversal(self):
        content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00" * 5
        valid, err, _ = validate_file_upload("../../../etc/passwd.jpg", content, "image/jpeg")
        self.assertFalse(valid)
        self.assertIn("traversal", err.lower())

    def test_file_upload_rejection_forbidden_extension(self):
        content = b"#!/bin/bash\necho Malicious"
        valid, err, _ = validate_file_upload("exploit.sh", content)
        self.assertFalse(valid)
        self.assertIn("not permitted", err.lower())

    def test_file_upload_rejection_mismatched_magic_bytes(self):
        # Named .png but has text content
        content = b"This is a fake text file disguised as a png image"
        valid, err, _ = validate_file_upload("fake.png", content, "image/png")
        self.assertFalse(valid)
        self.assertIn("binary signature", err.lower())

    def test_secure_storage_key_generation(self):
        key = generate_secure_storage_key("user_upload.jpg")
        self.assertTrue(key.startswith("evidence/"))
        self.assertTrue(key.endswith(".jpg"))
        self.assertNotIn("user_upload", key)  # User filename replaced with random hash/timestamp

    def test_production_config_validation(self):
        # Default weak secret in production mode must fail
        insecure_prod_settings = Settings(
            ENVIRONMENT="production",
            SECRET_KEY="short",
        )
        with self.assertRaises(ValueError):
            insecure_prod_settings.validate_production_readiness()

        # Secure secret should succeed
        secure_prod_settings = Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a-very-secure-32-byte-hex-token-for-nigeria-2027",
        )
        # Should not raise
        secure_prod_settings.validate_production_readiness()


if __name__ == "__main__":
    unittest.main()
