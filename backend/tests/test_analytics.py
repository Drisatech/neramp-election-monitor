import unittest
from backend.app.analytics.engine import (
    ElectionAnalyticsEngine,
    AnomalyDetectionResult,
    QualityAlert,
)


class TestElectionAnalyticsEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ElectionAnalyticsEngine()

    def test_completeness_calculation_with_baseline(self):
        # 10 expected, 8 received, 6 verified, 2 discrepancies
        comp = self.engine.calculate_completeness(
            expected_pus=10,
            received_pus=8,
            verified_pus=6,
            discrepancy_pus=2,
            incomplete_pus=1,
            awaiting_ocr=1,
            under_verification=1,
            published_pus=6,
        )
        self.assertEqual(comp["expectedPollingUnits"], 10)
        self.assertEqual(comp["resultsReceived"], 8)
        self.assertEqual(comp["resultsMissing"], 2)
        self.assertEqual(comp["completenessPercentage"], 80.0)
        self.assertEqual(comp["verificationPercentage"], 60.0)
        self.assertTrue(comp["hasReliableBaseline"])

    def test_completeness_without_expected_count_never_assumes_zero_or_hundred(self):
        # When expected count is not reliably known (0), completeness percentage is None
        comp = self.engine.calculate_completeness(
            expected_pus=0,
            received_pus=5,
            verified_pus=3,
            discrepancy_pus=1,
        )
        self.assertIsNone(comp["completenessPercentage"])
        self.assertIsNone(comp["verificationPercentage"])
        self.assertFalse(comp["hasReliableBaseline"])

    def test_candidate_comparisons_and_margins(self):
        candidates = [
            {"id": "c1", "name": "Candidate A", "partyCode": "APC", "color": "#16a34a"},
            {"id": "c2", "name": "Candidate B", "partyCode": "PDP", "color": "#dc2626"},
            {"id": "c3", "name": "Candidate C", "partyCode": "LP", "color": "#ea580c"},
        ]
        party_votes = {"APC": 500, "PDP": 350, "LP": 150}
        total_valid = 1000
        total_cast = 1020

        comp = self.engine.compare_candidates(
            candidates=candidates,
            party_votes_map=party_votes,
            total_valid_votes=total_valid,
            total_votes_cast=total_cast,
        )

        self.assertEqual(comp["totalValidVotes"], 1000)
        self.assertEqual(comp["leadingCandidate"]["candidateName"], "Candidate A")
        self.assertEqual(comp["leadingCandidate"]["totalVotes"], 500)
        self.assertEqual(comp["leadingCandidate"]["validVoteShare"], 50.0)
        self.assertEqual(comp["leadingMargin"], 150)  # 500 - 350

        # Check rankings order
        cands = comp["candidates"]
        self.assertEqual(cands[0]["partyCode"], "APC")
        self.assertEqual(cands[1]["partyCode"], "PDP")
        self.assertEqual(cands[2]["partyCode"], "LP")
        self.assertEqual(cands[1]["voteMargin"], -150)  # Deficit from 1st
        self.assertEqual(cands[2]["voteMargin"], -350)  # Deficit from 1st

    def test_validation_sound_record(self):
        val = self.engine.validate_result_record(
            valid_votes=400,
            rejected_votes=20,
            total_votes_cast=420,
            party_votes={"APC": 250, "PDP": 100, "LP": 50},
            registered_voters=800,
            accredited_voters=450,
        )
        self.assertTrue(val["overallValid"])
        self.assertEqual(val["failedCheckCount"], 0)

    def test_validation_arithmetic_mismatch(self):
        # 400 + 20 != 430
        val = self.engine.validate_result_record(
            valid_votes=400,
            rejected_votes=20,
            total_votes_cast=430,
            party_votes={"APC": 250, "PDP": 100, "LP": 50},
        )
        self.assertFalse(val["overallValid"])
        failed = [c for c in val["checks"] if not c["passed"]]
        self.assertTrue(any(c["ruleName"] == "BALLOT_ARITHMETIC_MATCH" for c in failed))

    def test_validation_party_sum_mismatch(self):
        # Sum of party votes (200 + 100 + 50 = 350) != valid_votes (400)
        val = self.engine.validate_result_record(
            valid_votes=400,
            rejected_votes=20,
            total_votes_cast=420,
            party_votes={"APC": 200, "PDP": 100, "LP": 50},
        )
        self.assertFalse(val["overallValid"])
        failed = [c for c in val["checks"] if not c["passed"]]
        self.assertTrue(any(c["ruleName"] == "PARTY_TALLIES_SUM_MATCH" for c in failed))

    def test_validation_overvoting_detected(self):
        # Cast votes (420) > accredited voters (400)
        val = self.engine.validate_result_record(
            valid_votes=400,
            rejected_votes=20,
            total_votes_cast=420,
            party_votes={"APC": 250, "PDP": 100, "LP": 50},
            registered_voters=800,
            accredited_voters=400,
        )
        self.assertFalse(val["overallValid"])
        failed = [c for c in val["checks"] if not c["passed"]]
        self.assertTrue(any(c["ruleName"] == "OVERVOTING_CHECK" for c in failed))

    def test_validation_negative_values(self):
        val = self.engine.validate_result_record(
            valid_votes=-5,
            rejected_votes=10,
            total_votes_cast=5,
            party_votes={"APC": -5, "PDP": 10},
        )
        self.assertFalse(val["overallValid"])
        failed = [c for c in val["checks"] if not c["passed"]]
        self.assertTrue(any(c["ruleName"] == "NON_NEGATIVE_VALUES" for c in failed))

    def test_anomaly_detection_turnout_outlier(self):
        pu_records = [
            {
                "pollingUnitCode": "24-01-01-001",
                "pollingUnitName": "Central Primary School",
                "stateCode": "LAGOS",
                "lgaCode": "LAGOS_ISLAND",
                "registeredVoters": 300,
                "accreditedVoters": 298,
                "totalVotesCast": 296,  # 98.6% turnout
                "validVotes": 290,
                "rejectedVotes": 6,
                "partyVotes": {"APC": 150, "PDP": 100, "LP": 40},
            },
            {
                "pollingUnitCode": "24-01-01-002",
                "pollingUnitName": "Normal School",
                "stateCode": "LAGOS",
                "lgaCode": "LAGOS_ISLAND",
                "registeredVoters": 800,
                "accreditedVoters": 320,
                "totalVotesCast": 315,  # ~39% turnout
                "validVotes": 300,
                "rejectedVotes": 15,
                "partyVotes": {"APC": 160, "PDP": 100, "LP": 40},
            },
        ]

        anomalies = self.engine.detect_anomalies(pu_records)
        turnout_anoms = [a for a in anomalies if a.rule_name == "TURNOUT_OUTLIER"]
        self.assertGreaterEqual(len(turnout_anoms), 1)
        self.assertEqual(turnout_anoms[0].polling_unit_code, "24-01-01-001")
        self.assertIn("investigative leads", turnout_anoms[0].disclaimer.lower())

    def test_anomaly_detection_identical_vote_sequences(self):
        # Two polling units with exact same non-trivial candidate votes in same LGA
        pu_records = [
            {
                "pollingUnitCode": "24-02-01-005",
                "pollingUnitName": "Unit 5",
                "stateCode": "LAGOS",
                "lgaCode": "IKEJA",
                "registeredVoters": 600,
                "totalVotesCast": 210,
                "validVotes": 200,
                "rejectedVotes": 10,
                "partyVotes": {"APC": 123, "PDP": 54, "LP": 23},
            },
            {
                "pollingUnitCode": "24-02-01-006",
                "pollingUnitName": "Unit 6",
                "stateCode": "LAGOS",
                "lgaCode": "IKEJA",
                "registeredVoters": 750,
                "totalVotesCast": 210,
                "validVotes": 200,
                "rejectedVotes": 10,
                "partyVotes": {"APC": 123, "PDP": 54, "LP": 23},
            },
        ]

        anomalies = self.engine.detect_anomalies(pu_records)
        seq_anoms = [a for a in anomalies if a.rule_name == "IDENTICAL_VOTE_SEQUENCE"]
        self.assertGreaterEqual(len(seq_anoms), 2)
        pu_codes = [a.polling_unit_code for a in seq_anoms]
        self.assertIn("24-02-01-005", pu_codes)
        self.assertIn("24-02-01-006", pu_codes)

    def test_source_document_change_detection(self):
        hash1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        hash2 = "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"

        # Content changed on a verified result sheet
        change = self.engine.track_source_change(
            polling_unit_code="24-01-01-001",
            election_id="elec-2027-pres",
            prior_hash=hash1,
            current_hash=hash2,
            prior_version=1,
            current_version=2,
            source_url="https://inecelectionresults.ng/scan2.pdf",
            is_verified_prior=True,
        )

        self.assertIsNotNone(change)
        self.assertEqual(change["changeType"], "CONTENT_HASH_CHANGE")
        self.assertEqual(change["ocrRerunStatus"], "REQUIRED")
        self.assertTrue(change["affectsVerifiedResult"])

        # No change
        no_change = self.engine.track_source_change(
            polling_unit_code="24-01-01-001",
            election_id="elec-2027-pres",
            prior_hash=hash1,
            current_hash=hash1,
            prior_version=1,
            current_version=1,
            source_url="https://inecelectionresults.ng/scan1.pdf",
        )
        self.assertIsNone(no_change)

    def test_quality_alert_deduplication_and_workflow(self):
        # Create alert 1
        alt1 = self.engine.create_or_deduplicate_alert(
            alert_type="OCR_DISCREPANCY",
            severity="HIGH",
            title="Form EC8A Arithmetic Mismatch",
            description="Valid votes plus rejected votes differs from total votes cast",
            election_id="elec-2027-pres",
            polling_unit_code="24-01-01-002",
        )
        self.assertEqual(alt1.status, "NEW")
        alert_id = alt1.id

        # Routine sync triggers again with same parameters
        alt2 = self.engine.create_or_deduplicate_alert(
            alert_type="OCR_DISCREPANCY",
            severity="HIGH",
            title="Form EC8A Arithmetic Mismatch",
            description="Valid votes plus rejected votes differs from total votes cast",
            election_id="elec-2027-pres",
            polling_unit_code="24-01-01-002",
        )
        # Should be deduplicated into the same alert ID
        self.assertEqual(alt1.id, alt2.id)
        self.assertEqual(len(self.engine.get_all_alerts()), 1)

        # Transition workflow to ACKNOWLEDGED
        updated = self.engine.update_alert_status(
            alert_id=alert_id,
            new_status="ACKNOWLEDGED",
            actor="Coordinator Jane",
        )
        self.assertIsNotNone(updated)
        self.assertEqual(updated.status, "ACKNOWLEDGED")
        self.assertEqual(updated.acknowledged_by, "Coordinator Jane")

        # Transition to RESOLVED with notes
        resolved = self.engine.update_alert_status(
            alert_id=alert_id,
            new_status="RESOLVED",
            resolution_notes="Physical Form EC8A re-verified by returning officer.",
            actor="Lead Verifier",
        )
        self.assertEqual(resolved.status, "RESOLVED")
        self.assertIn("Physical Form EC8A re-verified", resolved.resolution_notes)

    def test_csv_sanitization_against_formula_injection(self):
        malicious_pu_rows = [
            {
                "pollingUnitCode": "=cmd|' /C calc'!A0",
                "pollingUnitName": "+2348000000",
                "stateCode": "-DANGEROUS",
                "lgaCode": "@SUM(1+1)",
                "registeredVoters": 500,
                "accreditedVoters": 300,
                "validVotes": 290,
                "rejectedVotes": 10,
                "totalVotesCast": 300,
                "uploadStatus": "UPLOADED",
                "verificationStatus": "VERIFIED",
                "leadingParty": "APC",
                "fileHash": "hash123",
                "lastUpdated": "2027-02-27T18:00:00Z",
            }
        ]

        csv_text = self.engine.generate_csv_report(
            pu_rows=malicious_pu_rows,
            election_title="2027 Presidential General Election",
            scope_description="National Aggregate",
            total_expected=176846,
            total_received=1,
        )

        # Formula characters must be escaped with single quote prefix
        self.assertIn("\"'=cmd|' /C calc'!A0\"", csv_text)
        self.assertIn("\"'+2348000000\"", csv_text)
        self.assertIn("\"'-DANGEROUS\"", csv_text)
        self.assertIn("\"'@SUM(1+1)\"", csv_text)
        self.assertIn("NIGERIA ELECTION WATCH - ADVANCED ANALYTICS REPORT", csv_text)
        self.assertIn("Legal Notice:", csv_text)


if __name__ == "__main__":
    unittest.main()
