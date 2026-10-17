from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
        def model_dump(self):
            return self.__dict__
    def Field(*args, **kwargs):
        return None


class CandidateComparisonItem(BaseModel):
    candidate_id: str
    candidate_name: str
    party_code: str
    party_name: str
    party_color: str
    total_votes: int
    valid_vote_share: float
    vote_margin: int
    states_won: int
    lgas_won: int
    is_leading: bool


class CandidateComparisonResponse(BaseModel):
    election_id: str
    election_title: str
    level: str  # NATIONAL, STATE, LGA, WARD, POLLING_UNIT
    filter_value: Optional[str] = None
    total_valid_votes: int
    total_votes_cast: int
    leading_candidate_name: Optional[str] = None
    leading_margin: int
    candidates: List[CandidateComparisonItem]


class CompletenessStatusBreakdown(BaseModel):
    expected_polling_units: int
    results_received: int
    results_missing: int
    results_incomplete: int
    awaiting_ocr: int
    under_verification: int
    discrepancy_flagged: int
    verified_results: int
    approved_published: int
    completeness_percentage: Optional[float] = None
    verification_percentage: Optional[float] = None


class GeographicCompletenessItem(BaseModel):
    code: str
    name: str
    zone: Optional[str] = None
    expected_pus: int
    received_pus: int
    verified_pus: int
    discrepant_pus: int
    completeness_rate: Optional[float] = None
    verification_rate: Optional[float] = None
    leading_party: Optional[str] = None


class AnalyticsOverviewResponse(BaseModel):
    election_id: str
    election_title: str
    election_year: int
    election_type: str
    geographic_scope: str
    last_sync_time: str
    last_analytics_update: str
    data_source_mode: str
    is_demonstration: bool
    registered_voters: int
    accredited_voters: int
    total_votes_cast: int
    valid_votes: int
    rejected_votes: int
    turnout_percentage: Optional[float] = None
    rejected_vote_percentage: Optional[float] = None
    completeness: CompletenessStatusBreakdown
    unresolved_discrepancies: int
    active_anomalies_count: int
    active_alerts_count: int
    geographic_summary: List[GeographicCompletenessItem]


class ValidationRuleResult(BaseModel):
    rule_name: str
    passed: bool = True
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    observed_value: Any
    expected_value: Any
    variance: Optional[float] = None


class PollingUnitValidationReport(BaseModel):
    polling_unit_code: str
    election_id: str
    overall_valid: bool
    checks: List[ValidationRuleResult]
    summary_notes: str


class StatisticalAnomalyItem(BaseModel):
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
    disclaimer: str = "Statistical anomalies denote quantitative variances warranting field inquiry. They do not constitute evidence of fraud."


class DataQualityAlert(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    description: str
    election_id: str
    polling_unit_code: Optional[str] = None
    state_code: Optional[str] = None
    lga_code: Optional[str] = None
    created_at: str
    status: str
    assigned_to: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    updated_at: str


class AlertUpdatePayload(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    review_notes: Optional[str] = None
    reviewer_name: str = "Coordinator"


class SourceDocumentChangeItem(BaseModel):
    id: str
    polling_unit_code: str
    election_id: str
    previous_hash: str
    current_hash: str
    previous_version: int
    current_version: int
    change_type: str
    source_url: str
    detected_at: str
    ocr_rerun_status: str
    affects_verified_result: bool
    audit_notes: str


class HistoricalVersionDiff(BaseModel):
    result_sheet_id: str
    polling_unit_code: str
    election_id: str
    version_number: int
    timestamp: str
    actor: str
    action_type: str
    reason: str
    valid_votes: int
    rejected_votes: int
    total_votes_cast: int
    party_votes: Dict[str, int]
    field_changes: List[Dict[str, Any]]
