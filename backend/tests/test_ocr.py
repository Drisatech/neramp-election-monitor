import unittest
from backend.app.ocr.processor import (
    ResultSheetOcrProcessor,
    SourceDocumentReference,
    OcrExtractionOutput,
    ManualTranscription,
    VerifiedTranscription,
    BallotStatisticsData,
)
from backend.app.integrations.adapters import DevelopmentFixtureAdapter


class TestResultSheetOcrModule(unittest.IsolatedAsyncioTestCase):
    """
    Automated test suite using synthetic Form EC8A documents and responses.
    Verifies document retrieval, file validation, preprocessing, OCR text extraction,
    candidate vote tallies, ballot statistics, separate data representations,
    confidence scoring, version history, audit logging, and human-in-the-loop rules.
    """

    def setUp(self):
        self.processor = ResultSheetOcrProcessor(confidence_threshold=85.0)
        self.pu_code = "29-24-01-001"
        self.election_id = "elec-2026-gov-osun"

        # Valid synthetic PDF payload (magic header %PDF-1.4)
        self.valid_pdf_bytes = (
            b"%PDF-1.4\n"
            b"INEC FORM EC8A - POLLING UNIT RESULT SHEET\n"
            b"PU CODE: 29-24-01-001\n"
            b"ELECTION: GOVERNORSHIP 2026-08-15 OSUN\n"
            b"REGISTERED: 680. ACCREDITED: 412.\n"
            b"BALLOTS ISSUED: 680. UNUSED BALLOTS: 268. SPOILED: 0.\n"
            b"APC: 142. PDP: 110. LP: 104. NNPP: 18. APGA: 8. SDP: 4. ADC: 2.\n"
            b"TOTAL VALID: 388. REJECTED: 7. TOTAL CAST: 395.\n"
            + (b"\x00" * 300)
        )

        # Valid synthetic JPEG payload (magic header \xff\xd8\xff)
        self.valid_jpeg_bytes = b"\xff\xd8\xff\xe0" + (b"\x00" * 200)

        # Valid synthetic PNG payload (magic header \x89PNG\r\n\x1a\n)
        self.valid_png_bytes = b"\x89PNG\r\n\x1a\n" + (b"\x00" * 200)

    # 1. File type and magic byte validation
    def test_file_type_validation_accepts_valid_types(self):
        # Should not raise exception
        self.processor.validate_file(self.valid_pdf_bytes, "application/pdf")
        self.processor.validate_file(self.valid_jpeg_bytes, "image/jpeg")
        self.processor.validate_file(self.valid_png_bytes, "image/png")

    def test_file_type_validation_rejects_unsupported_types(self):
        invalid_exe = b"MZ\x90\x00\x03\x00" + (b"\x00" * 150)
        with self.assertRaises(ValueError) as ctx:
            self.processor.validate_file(invalid_exe, "application/x-dosexec")
        self.assertIn("Unsupported file type", str(ctx.exception))

    # 2. File size bounds validation
    def test_file_size_validation_rejects_too_small(self):
        tiny_bytes = b"%PDF"
        with self.assertRaises(ValueError) as ctx:
            self.processor.validate_file(tiny_bytes, "application/pdf")
        self.assertIn("File size too small", str(ctx.exception))

    def test_file_size_validation_rejects_too_large(self):
        # Exceeds 10 MB limit
        huge_bytes = b"%PDF-1.4\n" + (b"X" * (10 * 1024 * 1024 + 50))
        with self.assertRaises(ValueError) as ctx:
            self.processor.validate_file(huge_bytes, "application/pdf")
        self.assertIn("exceeds maximum limit", str(ctx.exception))

    # 3. Image preprocessing execution
    def test_image_preprocessing_metadata(self):
        _, meta = self.processor.preprocessor.preprocess(self.valid_pdf_bytes, "application/pdf")
        self.assertIn("preprocessing_steps", meta)
        self.assertTrue(meta["binarized"])
        self.assertTrue(meta["contrast_stretched"])
        self.assertIn("roi_regions", meta)
        self.assertIn("candidate_votes", meta["roi_regions"])

    # 4. Accurate extraction of candidate votes and ballot statistics
    def test_ocr_extraction_accuracy(self):
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
            election_id=self.election_id,
        )

        ocr: OcrExtractionOutput = result["ocr_output"]
        self.assertEqual(ocr.party_votes.get("APC"), 142)
        self.assertEqual(ocr.party_votes.get("PDP"), 110)
        self.assertEqual(ocr.party_votes.get("LP"), 104)
        self.assertEqual(ocr.party_votes.get("NNPP"), 18)
        self.assertEqual(ocr.ballot_statistics.valid_votes, 388)
        self.assertEqual(ocr.ballot_statistics.rejected_votes, 7)
        self.assertEqual(ocr.ballot_statistics.total_votes_cast, 395)
        self.assertEqual(ocr.ballot_statistics.registered_voters, 680)
        self.assertEqual(ocr.ballot_statistics.accredited_voters, 412)
        self.assertTrue(ocr.overall_confidence >= 85.0)

    # 5. Polling unit and election association
    def test_polling_unit_code_mismatch_detection(self):
        mismatched_text = (
            "INEC FORM EC8A. PU CODE: 29-99-99-999. "
            "APC: 100. PDP: 100. TOTAL VALID: 200. REJECTED: 0. TOTAL CAST: 200."
        )
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,  # 29-24-01-001
            simulated_ocr_text=mismatched_text,
        )
        ocr: OcrExtractionOutput = result["ocr_output"]
        self.assertFalse(ocr.pu_code_matched)
        self.assertTrue(ocr.requires_human_review)
        self.assertTrue(any("does not match assigned PU record" in r for r in ocr.review_reasons))

    # 6. Arithmetic discrepancy detection & automatic human review flagging
    def test_arithmetic_mismatch_flags_human_review(self):
        corrupted_text = (
            f"INEC FORM EC8A. PU CODE: {self.pu_code}. "
            "APC: 140. PDP: 120. TOTAL VALID: 260. REJECTED: 10. TOTAL CAST: 300."
        )
        # 260 + 10 = 270 != 300
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
            simulated_ocr_text=corrupted_text,
        )
        ocr: OcrExtractionOutput = result["ocr_output"]
        self.assertTrue(ocr.requires_human_review)
        self.assertTrue(any("Arithmetic mismatch" in r for r in ocr.review_reasons))

    # 7. Ambiguous or smudged figure handling
    def test_smudged_digits_flag_human_review(self):
        smudged_text = (
            f"INEC FORM EC8A. PU CODE: {self.pu_code}. "
            "APC: 14?. PDP: 110. TOTAL VALID: 250. REJECTED: 5. TOTAL CAST: 255."
        )
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
            simulated_ocr_text=smudged_text,
        )
        ocr: OcrExtractionOutput = result["ocr_output"]
        self.assertTrue(ocr.requires_human_review)
        self.assertTrue(any("Ambiguous or smudged digit" in r for r in ocr.review_reasons))

    # 8. CRITICAL REQUIREMENT: Never automatically mark OCR output as verified
    def test_never_automatically_mark_ocr_as_verified(self):
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
        )
        self.assertIsNone(result["verified_transcription"])
        self.assertNotEqual(result["verification_status"], "VERIFIED")
        self.assertIn(result["verification_status"], ["PENDING_VERIFICATION", "DISCREPANCY_FLAGGED"])

    # 9. Separate storage of source reference, OCR, manual transcription, and verified transcription
    def test_separate_data_stores(self):
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
        )

        source_ref: SourceDocumentReference = result["source_reference"]
        ocr_out: OcrExtractionOutput = result["ocr_output"]
        current_tr: ManualTranscription = result["current_transcription"]

        # Ensure distinct types and separate storage
        self.assertIsInstance(source_ref, SourceDocumentReference)
        self.assertIsInstance(ocr_out, OcrExtractionOutput)
        self.assertIsInstance(current_tr, ManualTranscription)
        self.assertIsNone(result["verified_transcription"])

        # Original source hash remains preserved
        expected_hash = self.processor.compute_sha256(self.valid_pdf_bytes)
        self.assertEqual(source_ref.file_hash, expected_hash)
        self.assertEqual(ocr_out.file_hash, expected_hash)

    # 10. Manual correction and version history
    def test_manual_correction_and_version_history(self):
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
        )
        self.assertEqual(len(result["version_history"]), 1)
        self.assertEqual(result["current_transcription"].version_number, 1)

        # Apply manual correction
        corrected_scores = {"APC": 150, "PDP": 110, "LP": 104, "NNPP": 18, "APGA": 8, "SDP": 4, "ADC": 2}
        corrected_stats = BallotStatisticsData(
            registered_voters=680,
            accredited_voters=412,
            valid_votes=396,
            rejected_votes=7,
            total_votes_cast=403,
        )

        updated_record = self.processor.apply_manual_correction(
            record=result,
            corrected_scores=corrected_scores,
            corrected_stats=corrected_stats,
            correction_reason="Visual verification against original Form EC8A: APC row was 150, not 142.",
            actor="Lead Verifier #08",
        )

        # Version increments to 2
        self.assertEqual(updated_record["current_transcription"].version_number, 2)
        self.assertEqual(len(updated_record["version_history"]), 2)
        self.assertEqual(updated_record["current_transcription"].party_votes["APC"], 150)
        # Original OCR extraction remains untouched!
        self.assertEqual(updated_record["ocr_output"].party_votes["APC"], 142)

        # Audit log tracks the change
        self.assertTrue(any(log.action == "MANUAL_CORRECTION" for log in updated_record["audit_logs"]))

    # 11. Authorised human reviewer verification
    def test_human_verification_workflow(self):
        result = self.processor.process_document(
            file_bytes=self.valid_pdf_bytes,
            content_type="application/pdf",
            polling_unit_code=self.pu_code,
        )

        # Unauthorised role must be rejected
        with self.assertRaises(PermissionError):
            self.processor.verify_transcription(
                record=result,
                decision="VERIFIED",
                verifier_id="usr-guest",
                verifier_name="Guest User",
                verifier_role="PUBLIC_USER",
                verifier_notes="Trying to verify.",
            )

        # Authorised verifier sign-off
        verified_record = self.processor.verify_transcription(
            record=result,
            decision="VERIFIED",
            verifier_id="usr-ver-001",
            verifier_name="Dr. Amina Yusuf",
            verifier_role="RESULT_VERIFIER",
            verifier_notes="Form EC8A stamp verified; presiding officer signature verified; arithmetic sound.",
        )

        self.assertEqual(verified_record["verification_status"], "VERIFIED")
        self.assertIsNotNone(verified_record["verified_transcription"])
        self.assertTrue(verified_record["verified_transcription"].is_verified)
        self.assertEqual(verified_record["verified_transcription"].verifier_name, "Dr. Amina Yusuf")

    # 12. Confidential document access control
    def test_confidential_document_access(self):
        # Public user cannot access confidential evidence
        self.assertFalse(self.processor.check_document_access("PUBLIC_USER", is_confidential=True))
        # Verifier or Admin can access
        self.assertTrue(self.processor.check_document_access("RESULT_VERIFIER", is_confidential=True))
        self.assertTrue(self.processor.check_document_access("SUPER_ADMIN", is_confidential=True))
        # Non-confidential documents are accessible to all
        self.assertTrue(self.processor.check_document_access("PUBLIC_USER", is_confidential=False))

    # 13. Document retrieval via adapter integration
    async def test_retrieve_and_process_integration(self):
        adapter = DevelopmentFixtureAdapter()
        result = await self.processor.retrieve_and_process(
            adapter=adapter,
            polling_unit_code=self.pu_code,
            source_url="https://inecelectionresults.ng/mock/sheets/29-24-01-001-ec8a.pdf",
            election_id=self.election_id,
        )
        self.assertIn("source_reference", result)
        self.assertIn("ocr_output", result)
        self.assertEqual(result["source_reference"].polling_unit_code, self.pu_code)


if __name__ == "__main__":
    unittest.main()
