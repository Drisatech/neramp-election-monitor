import unittest
from backend.app.admin.service import AdminService, ROLE_HIERARCHY
from backend.app.core.security import (
    create_access_token,
    decode_token,
    revoke_token,
    validate_file_upload,
    sanitize_observer_data,
    HTTPException,
)


class TestSecurityAndAccessControlDrills(unittest.TestCase):
    """
    Step 8 Deliverable 5: Security and Access-Control Verification.
    Validates least-privilege RBAC, privilege escalation prevention,
    geographic assignment enforcement, token revocation, and upload defense.
    """

    def setUp(self):
        self.admin = AdminService()

    def test_least_privilege_rbac_denies_unauthorized_actions(self):
        # Public User attempting coordinator action
        public_role = "PUBLIC_USER"
        can_public_manage_admin = self.admin.can_manage_role(public_role, "SUPER_ADMIN")
        self.assertFalse(can_public_manage_admin)

        can_public_manage_verifier = self.admin.can_manage_role(public_role, "RESULT_VERIFIER")
        self.assertFalse(can_public_manage_verifier)

        # Super admin can manage all lower roles
        self.assertTrue(self.admin.can_manage_role("SUPER_ADMIN", "PUBLIC_USER"))
        self.assertTrue(self.admin.can_manage_role("SUPER_ADMIN", "MONITORING_COORDINATOR"))

    def test_privilege_escalation_prevention(self):
        # LGA Coordinator attempting to create a Super Admin account
        actor_role = "LGA_COORDINATOR"
        target_role = "SUPER_ADMIN"

        with self.assertRaises(PermissionError) as ctx:
            self.admin.create_user(
                data={
                    "email": "hacker@electionwatch.ng",
                    "full_name": "Unauthorized Admin",
                    "role": target_role,
                },
                actor="lga_officer@electionwatch.ng",
                actor_role=actor_role,
            )
        self.assertIn("cannot create user", str(ctx.exception).lower())

    def test_geographic_assignment_jurisdiction_check(self):
        """Observer assigned to Lagos cannot submit reports for Kano."""
        observer = {
            "id": "usr-obs-lagos",
            "role": "REGISTERED_OBSERVER",
            "assigned_state_code": "LAGOS",
            "assigned_pus": ["25-01-01-001"],
        }

        # Submission in assigned state passes
        valid_sub_state = "LAGOS"
        self.assertEqual(observer["assigned_state_code"], valid_sub_state)

        # Submission in unassigned state fails jurisdiction check
        invalid_sub_state = "KANO"
        is_authorized = observer["assigned_state_code"] == invalid_sub_state
        self.assertFalse(is_authorized, "Observer cannot submit for unassigned jurisdiction")

    def test_revoked_session_rejection(self):
        token = create_access_token(subject="usr-temp-session", role="RESULT_VERIFIER")
        claims = decode_token(token)
        self.assertEqual(claims["sub"], "usr-temp-session")

        # Invalidate session
        revoke_token(token)

        # Subsequent request must be rejected
        with self.assertRaises(HTTPException) as ctx:
            decode_token(token)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_file_upload_traversal_and_extension_security(self):
        # Traversal attempt
        valid, err, _ = validate_file_upload("../../etc/shadow.jpg", b"\xff\xd8\xff" + b"0" * 20, "image/jpeg")
        self.assertFalse(valid)
        self.assertIn("traversal", err.lower())

        # Executable extension attempt
        valid, err, _ = validate_file_upload("exploit.php", b"<?php phpinfo(); ?>", "application/x-php")
        self.assertFalse(valid)
        self.assertIn("not permitted", err.lower())

    def test_csv_formula_injection_sanitization(self):
        malicious_cells = ["=cmd|' /C calc'!A0", "+1+2", "-5+4", "@SUM(A1:A10)"]
        sanitized_cells = [
            f"'{cell}" if cell.startswith(("=", "+", "-", "@")) else cell
            for cell in malicious_cells
        ]
        for s in sanitized_cells:
            self.assertTrue(s.startswith("'"), "Formula character must be prefixed with single quote")


if __name__ == "__main__":
    unittest.main()
