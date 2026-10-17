from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class DiscrepancyResult:
    def __init__(
        self,
        category: str,
        severity: str,
        original_value: str,
        compared_value: str,
        notes: str,
    ):
        self.category = category  # e.g., ARITHMETIC_MISMATCH, OVERVOTING_FLAG, OCR_TRANSCRIPTION_VARIANCE
        self.severity = severity  # LOW, MEDIUM, HIGH
        self.original_value = original_value
        self.compared_value = compared_value
        self.notes = notes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "severity": self.severity,
            "original_value": self.original_value,
            "compared_value": self.compared_value,
            "notes": self.notes,
        }


class ResultValidator:
    """
    Deterministic data-quality and ballot arithmetic validator.
    Applies objective election science rules without speculative accusations.
    Uses neutral terminology ('requires review', 'data discrepancy detected').
    """

    @staticmethod
    def validate_ballot_arithmetic(
        valid_votes: int,
        rejected_votes: int,
        total_votes_cast: int,
        accredited_voters: Optional[int] = None,
        registered_voters: Optional[int] = None,
        ballots_issued: Optional[int] = None,
        unused_ballots: Optional[int] = None,
        spoiled_ballots: Optional[int] = None,
    ) -> List[DiscrepancyResult]:
        discrepancies: List[DiscrepancyResult] = []

        # 1. Negative count check
        if valid_votes < 0 or rejected_votes < 0 or total_votes_cast < 0:
            discrepancies.append(
                DiscrepancyResult(
                    category="INVALID_NEGATIVE_VOTES",
                    severity="HIGH",
                    original_value=f"valid={valid_votes}, rejected={rejected_votes}, cast={total_votes_cast}",
                    compared_value="Expected non-negative integers (>= 0)",
                    notes="Negative vote entries detected in ballot breakdown. Requires review.",
                )
            )

        # 2. Total votes cast = valid votes + rejected votes
        expected_total = valid_votes + rejected_votes
        if expected_total != total_votes_cast:
            diff = abs(expected_total - total_votes_cast)
            discrepancies.append(
                DiscrepancyResult(
                    category="ARITHMETIC_MISMATCH",
                    severity="MEDIUM",
                    original_value=f"Valid ({valid_votes}) + Rejected ({rejected_votes}) = {expected_total}",
                    compared_value=f"Recorded Total Cast: {total_votes_cast} (Difference: {diff})",
                    notes="Data discrepancy detected: sum of valid and rejected ballots does not equal recorded total votes cast.",
                )
            )

        # 3. Accredited voters bounds check
        if accredited_voters is not None and accredited_voters > 0:
            if total_votes_cast > accredited_voters:
                discrepancies.append(
                    DiscrepancyResult(
                        category="BALLOT_TOTAL_EXCEEDS_ACCREDITED",
                        severity="HIGH",
                        original_value=f"Total Votes Cast: {total_votes_cast}",
                        compared_value=f"Accredited Voters (BVAS): {accredited_voters}",
                        notes="Total votes cast exceeds the number of accredited voters recorded at this polling unit. Requires review.",
                    )
                )

        # 4. Registered voters ceiling check
        if registered_voters is not None and registered_voters > 0:
            if accredited_voters is not None and accredited_voters > registered_voters:
                discrepancies.append(
                    DiscrepancyResult(
                        category="ACCREDITED_EXCEEDS_REGISTERED",
                        severity="HIGH",
                        original_value=f"Accredited Voters: {accredited_voters}",
                        compared_value=f"Registered Voters: {registered_voters}",
                        notes="Accredited voter count exceeds the total registered voter list for this polling unit. Requires verification.",
                    )
                )

        # 5. Ballot allocation check (Issued == Unused + Spoiled + Total Cast)
        if ballots_issued is not None and ballots_issued > 0 and unused_ballots is not None and spoiled_ballots is not None:
            accounted_ballots = unused_ballots + spoiled_ballots + total_votes_cast
            if accounted_ballots != ballots_issued:
                discrepancies.append(
                    DiscrepancyResult(
                        category="BALLOT_RECONCILIATION_VARIANCE",
                        severity="LOW",
                        original_value=f"Issued Ballots: {ballots_issued}",
                        compared_value=f"Unused ({unused_ballots}) + Spoiled ({spoiled_ballots}) + Cast ({total_votes_cast}) = {accounted_ballots}",
                        notes="Discrepancy in ballot paper reconciliation statistics. Flagged for verification.",
                    )
                )

        return discrepancies

    @staticmethod
    def compare_ocr_and_transcription(
        ocr_scores: Dict[str, int],
        transcribed_scores: Dict[str, int],
        tolerance: int = 0,
    ) -> List[DiscrepancyResult]:
        discrepancies: List[DiscrepancyResult] = []

        all_keys = set(ocr_scores.keys()).union(set(transcribed_scores.keys()))
        for party in sorted(all_keys):
            ocr_val = ocr_scores.get(party, 0)
            tr_val = transcribed_scores.get(party, 0)
            if abs(ocr_val - tr_val) > tolerance:
                discrepancies.append(
                    DiscrepancyResult(
                        category="OCR_TRANSCRIPTION_VARIANCE",
                        severity="MEDIUM",
                        original_value=f"{party} OCR Extraction: {ocr_val}",
                        compared_value=f"{party} Transcribed/Recorded: {tr_val}",
                        notes=f"Discrepancy between raw OCR output and transcribed figure for party {party}. Flagged for secondary human verification.",
                    )
                )

        return discrepancies

    @staticmethod
    def detect_document_hash_change(
        previous_hash: str,
        new_hash: str,
        polling_unit_code: str,
    ) -> Optional[DiscrepancyResult]:
        if previous_hash and new_hash and previous_hash != new_hash:
            return DiscrepancyResult(
                category="SOURCE_DOCUMENT_REVISED",
                severity="HIGH",
                original_value=f"Previous Document Hash: {previous_hash}",
                compared_value=f"New Document Hash: {new_hash}",
                notes=f"Source result sheet replaced on the portal for polling unit {polling_unit_code}. Revision archived in version history.",
            )
        return None
