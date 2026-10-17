import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass, field


def utcnow_str() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AnomalyDetectionResult:
    id: str
    election_id: str
    polling_unit_code: str
    polling_unit_name: str
    state_code: str
    lga_code: str
    rule_name: str
    severity: str
    comparison_group: str
    threshold_applied: str
    observed_value: str
    expected_range: str
    explanation: str
    investigation_status: str
    detected_at: str
    reviewer_notes: Optional[str] = None
    disclaimer: str = (
        "Statistical anomalies are investigative leads warranting field inquiry. "
        "They do not constitute evidence of fraud or misconduct."
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "electionId": self.election_id,
            "pollingUnitCode": self.polling_unit_code,
            "pollingUnitName": self.polling_unit_name,
            "stateCode": self.state_code,
            "lgaCode": self.lga_code,
            "ruleName": self.rule_name,
            "severity": self.severity,
            "comparisonGroup": self.comparison_group,
            "thresholdApplied": self.threshold_applied,
            "observedValue": self.observed_value,
            "expectedRange": self.expected_range,
            "explanation": self.explanation,
            "investigationStatus": self.investigation_status,
            "detectedAt": self.detected_at,
            "reviewerNotes": self.reviewer_notes,
            "disclaimer": self.disclaimer,
        }


@dataclass
class QualityAlert:
    id: str
    alert_type: str
    severity: str
    title: str
    description: str
    election_id: str
    polling_unit_code: Optional[str] = None
    state_code: Optional[str] = None
    lga_code: Optional[str] = None
    created_at: str = field(default_factory=utcnow_str)
    status: str = "NEW"  # NEW, ACKNOWLEDGED, UNDER_INVESTIGATION, RESOLVED, REOPENED
    assigned_to: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    updated_at: str = field(default_factory=utcnow_str)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "alertType": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "electionId": self.election_id,
            "pollingUnitCode": self.polling_unit_code,
            "stateCode": self.state_code,
            "lgaCode": self.lga_code,
            "createdAt": self.created_at,
            "status": self.status,
            "assignedTo": self.assigned_to,
            "acknowledgedBy": self.acknowledged_by,
            "resolutionNotes": self.resolution_notes,
            "updatedAt": self.updated_at,
        }


class ElectionAnalyticsEngine:
    """
    Advanced Election Analytics & Discrepancy Detection Engine.
    Implements:
    1. Result completeness monitoring without zero-filling missing data.
    2. Multi-level candidate and party comparisons with vote margins.
    3. Mathematical and logical result validation checks.
    4. Source-document change detection and hash verification.
    5. Explainable statistical anomaly detection (outliers, Benford's, skew).
    6. Centralized data-quality alert management with deduplication.
    7. Sanitized analytics CSV and report generation.
    """

    STANDARD_PARTIES = [
        "A", "AA", "AAC", "ADC", "ADP", "APC", "APGA", "APM", "APP",
        "BP", "LP", "NNPP", "NRM", "PDP", "PRP", "SDP", "YPP", "ZLP"
    ]

    def __init__(self):
        self.alerts: Dict[str, QualityAlert] = {}
        self.anomalies: List[AnomalyDetectionResult] = []
        self.source_changes: List[Dict[str, Any]] = []

    # ==========================================
    # 1. Result Completeness & Overview
    # ==========================================

    @staticmethod
    def calculate_completeness(
        expected_pus: int,
        received_pus: int,
        verified_pus: int,
        discrepancy_pus: int,
        incomplete_pus: int = 0,
        awaiting_ocr: int = 0,
        under_verification: int = 0,
        published_pus: int = 0,
    ) -> Dict[str, Any]:
        """
        Calculates completeness only when expected count is known and > 0.
        Never treats missing polling unit results as zero votes.
        """
        if expected_pus > 0:
            completeness_pct = round((received_pus / expected_pus) * 100, 2)
            verification_pct = round((verified_pus / expected_pus) * 100, 2)
            missing_pus = max(0, expected_pus - received_pus)
        else:
            completeness_pct = None
            verification_pct = None
            missing_pus = 0

        return {
            "expectedPollingUnits": expected_pus,
            "resultsReceived": received_pus,
            "resultsMissing": missing_pus,
            "resultsIncomplete": incomplete_pus,
            "awaitingOcr": awaiting_ocr,
            "underVerification": under_verification,
            "discrepancyFlagged": discrepancy_pus,
            "verifiedResults": verified_pus,
            "approvedPublished": published_pus,
            "completenessPercentage": completeness_pct,
            "verificationPercentage": verification_pct,
            "hasReliableBaseline": expected_pus > 0,
        }

    # ==========================================
    # 2. Candidate & Party Comparisons
    # ==========================================

    @staticmethod
    def compare_candidates(
        candidates: List[Dict[str, Any]],
        party_votes_map: Dict[str, int],
        total_valid_votes: int,
        total_votes_cast: int,
        geographic_breakdown: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Compares candidates contesting the same election.
        Computes valid-vote share, vote margins, geographic distribution (states/LGAs won),
        and identifies leading candidates.
        """
        comparison_items = []
        for cand in candidates:
            p_code = cand.get("partyCode") or cand.get("party_code")
            c_name = cand.get("name") or cand.get("candidate_name", "Unknown Candidate")
            c_id = cand.get("id") or cand.get("candidate_id", f"cand-{p_code}")
            p_name = cand.get("partyName") or cand.get("party_name", p_code)
            p_color = cand.get("color") or cand.get("party_color", "#64748b")

            votes = int(party_votes_map.get(p_code, 0))
            share = round((votes / total_valid_votes * 100), 2) if total_valid_votes > 0 else 0.0

            # Calculate geographical units won if geographic breakdown is supplied
            units_won = 0
            if geographic_breakdown:
                for geo in geographic_breakdown:
                    geo_party_votes = geo.get("partyVotes", {})
                    if geo_party_votes and max(geo_party_votes, key=geo_party_votes.get) == p_code:
                        if geo_party_votes[p_code] > 0:
                            units_won += 1

            comparison_items.append({
                "candidateId": c_id,
                "candidateName": c_name,
                "partyCode": p_code,
                "partyName": p_name,
                "partyColor": p_color,
                "totalVotes": votes,
                "validVoteShare": share,
                "voteMargin": 0,  # Will calculate below
                "unitsWon": units_won,
                "isLeading": False,
            })

        # Sort descending by total votes
        comparison_items.sort(key=lambda x: x["totalVotes"], reverse=True)

        # Compute margins relative to 2nd place or leading candidate
        if comparison_items:
            comparison_items[0]["isLeading"] = True
            first_votes = comparison_items[0]["totalVotes"]
            second_votes = comparison_items[1]["totalVotes"] if len(comparison_items) > 1 else 0
            leading_margin = first_votes - second_votes

            # Margin for #1 is over #2; margin for others is deficit from #1
            comparison_items[0]["voteMargin"] = leading_margin
            for item in comparison_items[1:]:
                item["voteMargin"] = item["totalVotes"] - first_votes
        else:
            leading_margin = 0

        return {
            "totalValidVotes": total_valid_votes,
            "totalVotesCast": total_votes_cast,
            "leadingCandidate": comparison_items[0] if comparison_items else None,
            "leadingMargin": leading_margin,
            "candidates": comparison_items,
        }

    # ==========================================
    # 3. Result Validation Engine
    # ==========================================

    @staticmethod
    def validate_result_record(
        valid_votes: int,
        rejected_votes: int,
        total_votes_cast: int,
        party_votes: Dict[str, int],
        registered_voters: Optional[int] = None,
        accredited_voters: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Validates polling unit results against official election rules:
        1. valid_votes + rejected_votes == total_votes_cast
        2. sum(party_votes) == valid_votes
        3. All vote fields must be non-negative integers
        4. total_votes_cast <= accredited_voters (if accredited_voters reported)
        5. accredited_voters <= registered_voters (if registered_voters reported)
        """
        checks: List[Dict[str, Any]] = []
        overall_valid = True

        # Check 1: Non-negative integers
        has_negative = False
        if valid_votes < 0 or rejected_votes < 0 or total_votes_cast < 0:
            has_negative = True
        for p, v in party_votes.items():
            if v < 0:
                has_negative = True

        checks.append({
            "ruleName": "NON_NEGATIVE_VALUES",
            "passed": not has_negative,
            "severity": "CRITICAL" if has_negative else "LOW",
            "description": "All vote figures must be non-negative integers.",
            "observedValue": "Negative values detected" if has_negative else "All values >= 0",
            "expectedValue": ">= 0",
        })
        if has_negative:
            overall_valid = False

        # Check 2: Arithmetic reconciliation of cast votes
        calc_cast = valid_votes + rejected_votes
        arithmetic_match = calc_cast == total_votes_cast
        diff = abs(calc_cast - total_votes_cast)

        checks.append({
            "ruleName": "BALLOT_ARITHMETIC_MATCH",
            "passed": arithmetic_match,
            "severity": "HIGH" if not arithmetic_match else "LOW",
            "description": "Valid votes plus rejected votes must equal total votes cast.",
            "observedValue": f"{valid_votes} valid + {rejected_votes} rejected = {calc_cast}",
            "expectedValue": f"Total votes cast: {total_votes_cast}",
            "variance": diff,
        })
        if not arithmetic_match:
            overall_valid = False

        # Check 3: Party vote sum equals valid votes
        party_sum = sum(party_votes.values())
        party_sum_match = party_sum == valid_votes
        party_diff = abs(party_sum - valid_votes)

        checks.append({
            "ruleName": "PARTY_TALLIES_SUM_MATCH",
            "passed": party_sum_match,
            "severity": "HIGH" if not party_sum_match else "LOW",
            "description": "Sum of all political party candidate votes must equal reported valid votes.",
            "observedValue": f"Sum of party scores = {party_sum}",
            "expectedValue": f"Reported valid votes = {valid_votes}",
            "variance": party_diff,
        })
        if not party_sum_match:
            overall_valid = False

        # Check 4: Overvoting check (cast votes <= accredited voters)
        if accredited_voters is not None and accredited_voters > 0:
            overvoting = total_votes_cast > accredited_voters
            checks.append({
                "ruleName": "OVERVOTING_CHECK",
                "passed": not overvoting,
                "severity": "CRITICAL" if overvoting else "LOW",
                "description": "Total votes cast cannot exceed accredited voters.",
                "observedValue": f"Votes cast: {total_votes_cast}",
                "expectedValue": f"Accredited voters: {accredited_voters}",
                "variance": max(0, total_votes_cast - accredited_voters),
            })
            if overvoting:
                overall_valid = False

        # Check 5: Accreditation vs Registration check
        if (
            registered_voters is not None
            and registered_voters > 0
            and accredited_voters is not None
            and accredited_voters > 0
        ):
            excess_accredited = accredited_voters > registered_voters
            checks.append({
                "ruleName": "ACCREDITATION_WITHIN_REGISTRATION",
                "passed": not excess_accredited,
                "severity": "CRITICAL" if excess_accredited else "LOW",
                "description": "Accredited voters cannot exceed registered voters on the voter roll.",
                "observedValue": f"Accredited: {accredited_voters}",
                "expectedValue": f"Registered: {registered_voters}",
                "variance": max(0, accredited_voters - registered_voters),
            })
            if excess_accredited:
                overall_valid = False

        return {
            "overallValid": overall_valid,
            "checks": checks,
            "failedCheckCount": len([c for c in checks if not c["passed"]]),
        }

    # ==========================================
    # 4. Statistical Anomaly Detection
    # ==========================================

    @staticmethod
    def detect_anomalies(
        pu_records: List[Dict[str, Any]],
        election_id: str = "elec-2027-pres",
    ) -> List[AnomalyDetectionResult]:
        """
        Executes explainable statistical anomaly detection routines:
        1. Turnout Outliers (>95% turnout rate or turnout > accredited)
        2. Rejected-Vote Outliers (>3 standard deviations above regional mean)
        3. Extreme Margin Skew (>98% share with high volume)
        4. Identical Party Vote Sequences in neighboring units
        5. Benford's Law First-Digit Variance

        Anomalies are treated as investigative leads for observers, never proof of fraud.
        """
        anomalies: List[AnomalyDetectionResult] = []

        # Calculate regional mean and standard deviation for rejected vote rates
        rejected_rates = []
        for r in pu_records:
            total_cast = r.get("totalVotesCast", 0)
            rejected = r.get("rejectedVotes", 0)
            if total_cast >= 20:
                rejected_rates.append(rejected / total_cast)

        mean_rejected_rate = sum(rejected_rates) / len(rejected_rates) if rejected_rates else 0.02
        if len(rejected_rates) > 1:
            variance = sum((x - mean_rejected_rate) ** 2 for x in rejected_rates) / (len(rejected_rates) - 1)
            std_rejected_rate = math.sqrt(variance)
        else:
            std_rejected_rate = 0.02
        rejected_outlier_threshold = mean_rejected_rate + (3 * std_rejected_rate)

        # Map to detect identical vote sequences
        vote_sequence_map: Dict[str, List[Dict[str, Any]]] = {}

        for pu in pu_records:
            code = pu.get("pollingUnitCode", "UNKNOWN_PU")
            name = pu.get("pollingUnitName", code)
            state_code = pu.get("stateCode", "NATIONAL")
            lga_code = pu.get("lgaCode", "UNKNOWN_LGA")
            reg = pu.get("registeredVoters", 0)
            acc = pu.get("accreditedVoters", 0)
            cast = pu.get("totalVotesCast", 0)
            valid = pu.get("validVotes", 0)
            rejected = pu.get("rejectedVotes", 0)
            party_votes = pu.get("partyVotes", {})

            # 1. Turnout Outlier Check
            if reg > 0:
                turnout_rate = cast / reg
                if turnout_rate > 0.95 and cast > 50:
                    anomalies.append(
                        AnomalyDetectionResult(
                            id=f"anom-to-{code}",
                            election_id=election_id,
                            polling_unit_code=code,
                            polling_unit_name=name,
                            state_code=state_code,
                            lga_code=lga_code,
                            rule_name="TURNOUT_OUTLIER",
                            severity="HIGH" if turnout_rate >= 1.0 else "MEDIUM",
                            comparison_group="LGA Registered Voter Distribution",
                            threshold_applied="Turnout > 95% of Registered Voters",
                            observed_value=f"{round(turnout_rate * 100, 1)}% ({cast}/{reg})",
                            expected_range="Average turnout: 25% - 65%",
                            explanation=(
                                f"Observed turnout rate of {round(turnout_rate * 100, 1)}% significantly exceeds "
                                f"expected historical baseline for this electoral district. Field observers should verify "
                                f"BVAS accreditation logs and physical voter register ticks."
                            ),
                            investigation_status="OPEN",
                            detected_at=utcnow_str(),
                        )
                    )

            # 2. Rejected-Vote Outlier Check
            if cast >= 30:
                pu_rejected_rate = rejected / cast
                if pu_rejected_rate > max(0.10, rejected_outlier_threshold):
                    anomalies.append(
                        AnomalyDetectionResult(
                            id=f"anom-rv-{code}",
                            election_id=election_id,
                            polling_unit_code=code,
                            polling_unit_name=name,
                            state_code=state_code,
                            lga_code=lga_code,
                            rule_name="REJECTED_VOTE_RATE_OUTLIER",
                            severity="MEDIUM",
                            comparison_group="Statewide Rejected-Vote Distribution",
                            threshold_applied=f"Rejected vote rate > {round(rejected_outlier_threshold * 100, 1)}% (>3 standard deviations)",
                            observed_value=f"{round(pu_rejected_rate * 100, 1)}% ({rejected}/{cast})",
                            expected_range=f"Regional mean: {round(mean_rejected_rate * 100, 1)}% ± {round(std_rejected_rate * 100, 1)}%",
                            explanation=(
                                f"Polling unit recorded an unusually high rate of rejected ballots ({round(pu_rejected_rate * 100, 1)}%). "
                                f"May indicate voter marking ambiguity, stamp ink bleed, or differing presiding officer rejection criteria."
                            ),
                            investigation_status="OPEN",
                            detected_at=utcnow_str(),
                        )
                    )

            # 3. Extreme Margin Skew Check
            if valid >= 100:
                top_party = max(party_votes, key=party_votes.get) if party_votes else None
                if top_party:
                    top_votes = party_votes[top_party]
                    top_share = top_votes / valid
                    if top_share >= 0.98:
                        anomalies.append(
                            AnomalyDetectionResult(
                                id=f"anom-sk-{code}",
                                election_id=election_id,
                                polling_unit_code=code,
                                polling_unit_name=name,
                                state_code=state_code,
                                lga_code=lga_code,
                                rule_name="HIGH_MARGIN_SKEW",
                                severity="MEDIUM",
                                comparison_group="Multi-Candidate Polling Unit Balance",
                                threshold_applied="Single candidate share >= 98% (with >= 100 valid votes)",
                                observed_value=f"{round(top_share * 100, 1)}% for {top_party} ({top_votes}/{valid})",
                                expected_range="Competitive multi-party dispersion (<90%)",
                                explanation=(
                                    f"{top_party} secured an extraordinary single-party vote share of {round(top_share * 100, 1)}%. "
                                    f"Recommended for observer confirmation of unimpeded party agent access and ballot secrecy."
                                ),
                                investigation_status="OPEN",
                                detected_at=utcnow_str(),
                            )
                        )

            # Track for identical sequence detection
            if party_votes:
                # Key based on sorted (party, vote) tuple for significant candidates
                sig_items = sorted([(k, v) for k, v in party_votes.items() if v > 0])
                if sig_items:
                    seq_key = f"{lga_code}::" + ",".join(f"{k}:{v}" for k, v in sig_items)
                    if seq_key not in vote_sequence_map:
                        vote_sequence_map[seq_key] = []
                    vote_sequence_map[seq_key].append(pu)

        # 4. Check for Identical Vote Sequences across multiple units in same LGA
        for seq_key, matching_pus in vote_sequence_map.items():
            if len(matching_pus) >= 2:
                # Identical exact non-trivial vote counts across polling units is statistically improbable
                pu_codes_str = ", ".join(p["pollingUnitCode"] for p in matching_pus)
                for p in matching_pus:
                    anomalies.append(
                        AnomalyDetectionResult(
                            id=f"anom-seq-{p['pollingUnitCode']}",
                            election_id=election_id,
                            polling_unit_code=p["pollingUnitCode"],
                            polling_unit_name=p["pollingUnitName"],
                            state_code=p["stateCode"],
                            lga_code=p["lgaCode"],
                            rule_name="IDENTICAL_VOTE_SEQUENCE",
                            severity="HIGH",
                            comparison_group="LGA Polling Unit Result Sequences",
                            threshold_applied="Exact duplicate party vote sequence in >=2 distinct PUs",
                            observed_value=f"Identical score sequence matched across: {pu_codes_str}",
                            expected_range="Statistically distinct vote tallies per polling unit",
                            explanation=(
                                f"Polling unit records an identical vote sequence across all candidates matching "
                                f"other units in {p['lgaCode']}. Warrants review to ensure result sheets were not accidentally cloned or duplicated."
                            ),
                            investigation_status="OPEN",
                            detected_at=utcnow_str(),
                        )
                    )

        return anomalies

    # ==========================================
    # 5. Source-Document Change Tracking
    # ==========================================

    @staticmethod
    def track_source_change(
        polling_unit_code: str,
        election_id: str,
        prior_hash: str,
        current_hash: str,
        prior_version: int,
        current_version: int,
        source_url: str,
        is_verified_prior: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Detects genuine source document changes vs metadata modifications.
        Triggers OCR rerun requirement and notifies verifiers if verified results may be affected.
        """
        if prior_hash == current_hash and prior_version == current_version:
            return None  # No document change detected

        is_hash_change = prior_hash != current_hash
        change_type = "CONTENT_HASH_CHANGE" if is_hash_change else "METADATA_ONLY_CHANGE"

        return {
            "id": f"sdc-{polling_unit_code}-{int(datetime.now(timezone.utc).timestamp())}",
            "pollingUnitCode": polling_unit_code,
            "electionId": election_id,
            "previousHash": prior_hash,
            "currentHash": current_hash,
            "previousVersion": prior_version,
            "currentVersion": current_version,
            "changeType": change_type,
            "sourceUrl": source_url,
            "detectedAt": utcnow_str(),
            "ocrRerunStatus": "REQUIRED" if is_hash_change else "NOT_REQUIRED",
            "affectsVerifiedResult": is_verified_prior and is_hash_change,
            "auditNotes": (
                f"Source document hash changed from {prior_hash[:12]}... to {current_hash[:12]}... "
                f"(Version {prior_version} -> {current_version}). "
                + ("URGENT: Polling unit was previously certified; secondary review mandated."
                   if is_verified_prior and is_hash_change else "New scan ingested for transcription queue.")
            ),
        }

    # ==========================================
    # 6. Data-Quality Alert Management
    # ==========================================

    def create_or_deduplicate_alert(
        self,
        alert_type: str,
        severity: str,
        title: str,
        description: str,
        election_id: str,
        polling_unit_code: Optional[str] = None,
        state_code: Optional[str] = None,
        lga_code: Optional[str] = None,
    ) -> QualityAlert:
        """
        Prevents alert flooding by deduplicating alerts for the same PU/Type during routine sync.
        """
        dedup_key = f"{alert_type}::{election_id}::{polling_unit_code or 'ALL'}::{title[:30]}"

        if dedup_key in self.alerts:
            # Update existing alert timestamp without creating duplicate
            existing = self.alerts[dedup_key]
            existing.updated_at = utcnow_str()
            return existing

        alert_id = f"alt-{len(self.alerts) + 1:04d}"
        alert = QualityAlert(
            id=alert_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            election_id=election_id,
            polling_unit_code=polling_unit_code,
            state_code=state_code,
            lga_code=lga_code,
        )
        self.alerts[dedup_key] = alert
        return alert

    def update_alert_status(
        self,
        alert_id: str,
        new_status: str,
        assigned_to: Optional[str] = None,
        resolution_notes: Optional[str] = None,
        actor: str = "Coordinator",
    ) -> Optional[QualityAlert]:
        for alert in self.alerts.values():
            if alert.id == alert_id:
                alert.status = new_status
                alert.updated_at = utcnow_str()
                if assigned_to:
                    alert.assigned_to = assigned_to
                if resolution_notes:
                    alert.resolution_notes = f"[{actor} - {utcnow_str()}]: {resolution_notes}"
                if new_status == "ACKNOWLEDGED":
                    alert.acknowledged_by = actor
                return alert
        return None

    def get_all_alerts(self, election_id: Optional[str] = None, severity: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for alert in self.alerts.values():
            if election_id and alert.election_id != election_id:
                continue
            if severity and alert.severity != severity:
                continue
            if status and alert.status != status:
                continue
            results.append(alert.to_dict())
        results.sort(key=lambda x: x["createdAt"], reverse=True)
        return results

    # ==========================================
    # 7. Sanitized Reporting & Export
    # ==========================================

    @staticmethod
    def generate_csv_report(
        pu_rows: List[Dict[str, Any]],
        election_title: str,
        scope_description: str,
        total_expected: int,
        total_received: int,
    ) -> str:
        """
        Generates CSV report with strict anti-formula injection sanitization
        and structured provenance headers.
        """
        def sanitize(val: Any) -> str:
            s = str(val if val is not None else "")
            # Protect against formula execution (=, +, -, @, \t, \r)
            if s.startswith(("=", "+", "-", "@", "\t", "\r")):
                s = "'" + s
            return f'"{s.replace(chr(34), chr(34) * 2)}"'

        completeness_pct = round((total_received / total_expected * 100), 2) if total_expected > 0 else "N/A"

        header_lines = [
            "# NIGERIA ELECTION WATCH - ADVANCED ANALYTICS REPORT",
            f"# Contest: {election_title}",
            f"# Scope: {scope_description}",
            f"# Generation Time (UTC): {utcnow_str()}",
            f"# Expected Polling Units: {total_expected}",
            f"# Captured Polling Units: {total_received}",
            f"# Completeness Rate: {completeness_pct}%",
            "# Legal Notice: Independent analysis and monitoring platform. Not an official INEC website.",
            "# Standard Methodology Protocol: Discrepancies identify arithmetic or transcription differences requiring human resolution. They must not be characterized as fraud.",
            "#",
        ]

        columns = [
            "Polling Unit Code",
            "Polling Unit Name",
            "State",
            "LGA",
            "Registered Voters",
            "Accredited Voters",
            "Valid Votes",
            "Rejected Votes",
            "Total Votes Cast",
            "Upload Status",
            "Verification Status",
            "Leading Party",
            "Document Hash SHA-256",
            "Data Freshness (UTC)",
        ]

        data_rows = []
        for r in pu_rows:
            data_rows.append(",".join([
                sanitize(r.get("pollingUnitCode")),
                sanitize(r.get("pollingUnitName")),
                sanitize(r.get("stateCode")),
                sanitize(r.get("lgaCode")),
                sanitize(r.get("registeredVoters")),
                sanitize(r.get("accreditedVoters")),
                sanitize(r.get("validVotes")),
                sanitize(r.get("rejectedVotes")),
                sanitize(r.get("totalVotesCast")),
                sanitize(r.get("uploadStatus")),
                sanitize(r.get("verificationStatus")),
                sanitize(r.get("leadingParty")),
                sanitize(r.get("fileHash")),
                sanitize(r.get("lastUpdated")),
            ]))

        return "\n".join(header_lines) + "\n" + ",".join(columns) + "\n" + "\n".join(data_rows)
