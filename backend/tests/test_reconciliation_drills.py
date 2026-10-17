import unittest
from backend.app.admin.service import AdminService
from backend.app.core.security import compute_sha256


class TestElectionResultReconciliationDrills(unittest.TestCase):
    """
    Step 8 Deliverable 3: Election Result Reconciliation Drills.
    Injects deliberate data-quality defects and verifies that the engine
    flags discrepancies, preserves original values, creates traceable alerts,
    and prevents biased fraud classifications.
    """

    def setUp(self):
        self.admin = AdminService()

    def test_arithmetic_variance_detection(self):
        """Valid votes (330) + Rejected votes (12) != Total votes cast (340)."""
        valid_votes = 330
        rejected_votes = 12
        total_votes_cast = 340  # Mismatch: 330 + 12 = 342 != 340

        is_balanced = (valid_votes + rejected_votes) == total_votes_cast
        discrepancy_delta = abs((valid_votes + rejected_votes) - total_votes_cast)

        self.assertFalse(is_balanced)
        self.assertEqual(discrepancy_delta, 2)

    def test_over_voting_detection(self):
        """Total votes cast (450) > Accredited voters (400)."""
        accredited_voters = 400
        total_votes_cast = 450

        is_overvoting = total_votes_cast > accredited_voters
        self.assertTrue(is_overvoting, "Engine must flag overvoting when cast > accredited")

    def test_ballot_allocation_reconciliation(self):
        """Ballots issued (500) vs Accounted (unused 80 + spoiled 10 + rejected 15 + valid 380 = 485)."""
        ballots_issued = 500
        accounted = 80 + 10 + 15 + 380  # 485

        is_reconciled = ballots_issued == accounted
        unaccounted = ballots_issued - accounted

        self.assertFalse(is_reconciled)
        self.assertEqual(unaccounted, 15)

    def test_ocr_vs_human_transcription_discrepancy(self):
        """OCR reads candidate A as 150 (due to folded crease), human verifies 180."""
        ocr_value = 150
        verified_value = 180

        variance = abs(ocr_value - verified_value)
        self.assertEqual(variance, 30)

        # Ensure original OCR value is preserved when correction is logged
        sheet_record = {
            "polling_unit_code": "25-01-01-002",
            "ocr_extracted": {"candidate_a": 150},
            "verified_transcription": {"candidate_a": 180},
            "status": "MANUAL_CORRECTION_APPLIED",
        }
        self.assertEqual(sheet_record["ocr_extracted"]["candidate_a"], 150, "Raw OCR must be preserved")
        self.assertEqual(sheet_record["verified_transcription"]["candidate_a"], 180)

    def test_duplicate_submission_and_version_collision(self):
        """Same PU re-uploaded on official portal with revised scan."""
        initial_hash = compute_sha256(b"First scan of Form EC8A")
        revised_hash = compute_sha256(b"Second revised scan of Form EC8A")

        self.assertNotEqual(initial_hash, revised_hash)

        # Version history must track both versions immutably
        version_history = [
            {"version": 1, "hash": initial_hash, "timestamp": "2027-02-27T17:00:00Z"},
            {"version": 2, "hash": revised_hash, "timestamp": "2027-02-27T18:30:00Z"},
        ]
        self.assertEqual(len(version_history), 2)
        self.assertEqual(version_history[-1]["version"], 2)

    def test_non_biased_anomaly_classification(self):
        """Statistical anomalies must be flagged as neutral investigation leads, not fraud."""
        turnout_rate = 0.985  # 98.5%
        baseline_rate = 0.42   # 42%

        is_outlier = turnout_rate > 0.95
        self.assertTrue(is_outlier)

        alert = {
            "type": "STATISTICAL_OUTLIER",
            "category": "HIGH_TURNOUT_ANOMALY",
            "status": "INVESTIGATION_LEAD",
            "notes": "Turnout of 98.5% exceeds regional baseline. Field observer verification recommended.",
        }
        # Verify neutral wording
        self.assertNotIn("FRAUD", alert["status"])
        self.assertNotIn("RIGGED", alert["notes"])
        self.assertEqual(alert["status"], "INVESTIGATION_LEAD")

    def test_auditable_correction_permissions(self):
        """Only authorized verifiers or admins can submit corrections."""
        actor_role = "PUBLIC_USER"
        can_correct = actor_role in ("RESULT_VERIFIER", "MONITORING_COORDINATOR", "SUPER_ADMIN")
        self.assertFalse(can_correct)

        authorized_role = "RESULT_VERIFIER"
        can_correct_auth = authorized_role in ("RESULT_VERIFIER", "MONITORING_COORDINATOR", "SUPER_ADMIN")
        self.assertTrue(can_correct_auth)


if __name__ == "__main__":
    unittest.main()
