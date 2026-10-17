import unittest
from backend.app.verification.validation import ResultValidator


class TestResultValidator(unittest.TestCase):
    def test_valid_ballot_arithmetic(self):
        # 388 valid + 7 rejected = 395 cast
        discrepancies = ResultValidator.validate_ballot_arithmetic(
            valid_votes=388,
            rejected_votes=7,
            total_votes_cast=395,
            accredited_voters=395,
            registered_voters=750,
        )
        self.assertEqual(len(discrepancies), 0)

    def test_arithmetic_mismatch_detection(self):
        # 388 valid + 7 rejected != 405 cast
        discrepancies = ResultValidator.validate_ballot_arithmetic(
            valid_votes=388,
            rejected_votes=7,
            total_votes_cast=405,
        )
        self.assertEqual(len(discrepancies), 1)
        self.assertEqual(discrepancies[0].category, "ARITHMETIC_MISMATCH")
        self.assertEqual(discrepancies[0].severity, "MEDIUM")

    def test_negative_vote_detection(self):
        discrepancies = ResultValidator.validate_ballot_arithmetic(
            valid_votes=-5,
            rejected_votes=2,
            total_votes_cast=10,
        )
        categories = [d.category for d in discrepancies]
        self.assertIn("INVALID_NEGATIVE_VOTES", categories)

    def test_overvoting_relative_to_accreditation(self):
        discrepancies = ResultValidator.validate_ballot_arithmetic(
            valid_votes=500,
            rejected_votes=10,
            total_votes_cast=510,
            accredited_voters=400,
        )
        categories = [d.category for d in discrepancies]
        self.assertIn("BALLOT_TOTAL_EXCEEDS_ACCREDITED", categories)

    def test_ocr_transcription_variance(self):
        ocr_votes = {"APC": 140, "PDP": 125}
        transcribed_votes = {"APC": 150, "PDP": 125}

        discrepancies = ResultValidator.compare_ocr_and_transcription(ocr_votes, transcribed_votes)
        self.assertEqual(len(discrepancies), 1)
        self.assertEqual(discrepancies[0].category, "OCR_TRANSCRIPTION_VARIANCE")


if __name__ == "__main__":
    unittest.main()
