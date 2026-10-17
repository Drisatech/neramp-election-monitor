import unittest
from backend.app.admin.service import AdminService, ROLE_HIERARCHY


class TestAdminService(unittest.TestCase):
    def setUp(self):
        self.service = AdminService()

    def test_role_hierarchy(self):
        self.assertTrue(self.service.can_manage_role("SUPER_ADMIN", "PROJECT_ADMIN"))
        self.assertTrue(self.service.can_manage_role("SUPER_ADMIN", "REGISTERED_OBSERVER"))
        self.assertTrue(self.service.can_manage_role("PROJECT_ADMIN", "MONITORING_COORDINATOR"))
        self.assertFalse(self.service.can_manage_role("MONITORING_COORDINATOR", "SUPER_ADMIN"))
        self.assertFalse(self.service.can_manage_role("REGISTERED_OBSERVER", "RESULT_VERIFIER"))

    def test_create_user_with_permissions(self):
        new_user = self.service.create_user(
            {
                "email": "new.observer@electionwatch.ng",
                "full_name": "Halima Musa",
                "role": "REGISTERED_OBSERVER",
                "assigned_state_code": "KANO",
                "assigned_lga_code": "KANO_MUNICIPAL",
            },
            actor="sysadmin@electionwatch.ng",
            actor_role="SUPER_ADMIN",
        )
        self.assertIsNotNone(new_user["id"])
        self.assertEqual(new_user["email"], "new.observer@electionwatch.ng")
        self.assertEqual(new_user["role"], "REGISTERED_OBSERVER")
        self.assertTrue(new_user["is_active"])

        # Attempt to create SUPER_ADMIN using lower role must fail
        with self.assertRaises(PermissionError):
            self.service.create_user(
                {"email": "hack@electionwatch.ng", "full_name": "Attacker", "role": "SUPER_ADMIN"},
                actor="observer@electionwatch.ng",
                actor_role="REGISTERED_OBSERVER",
            )

    def test_toggle_user_status(self):
        user = self.service.toggle_user_status("usr-obs-01", actor="sysadmin@electionwatch.ng", actor_role="SUPER_ADMIN")
        self.assertFalse(user["is_active"])
        # Toggle back
        user = self.service.toggle_user_status("usr-obs-01", actor="sysadmin@electionwatch.ng", actor_role="SUPER_ADMIN")
        self.assertTrue(user["is_active"])

    def test_reset_user_access(self):
        reset_info = self.service.reset_user_access("usr-obs-01", actor="sysadmin@electionwatch.ng", actor_role="SUPER_ADMIN")
        self.assertEqual(reset_info["user_id"], "usr-obs-01")
        self.assertTrue(reset_info["reset_token"].startswith("rst-"))
        self.assertIsNotNone(reset_info["temporary_password"])
        self.assertIn("expires_at", reset_info)

    def test_command_center_metrics(self):
        metrics = self.service.get_command_center_metrics()
        self.assertGreater(metrics["total_users"], 0)
        self.assertGreater(metrics["configured_states_count"], 0)
        self.assertGreater(metrics["results_received"], 0)
        self.assertIn("ocr_queue_status", metrics)
        self.assertIn("inec_connectivity", metrics)
        self.assertIn("system_health", metrics)

    def test_audit_logs_read_only_export(self):
        export_data = self.service.export_audit_logs_read_only()
        self.assertIn("integrity_sha256", export_data)
        self.assertEqual(len(export_data["integrity_sha256"]), 64)
        self.assertGreaterEqual(len(export_data["logs"]), 2)
        self.assertIn("legal_notice", export_data)


if __name__ == "__main__":
    unittest.main()
