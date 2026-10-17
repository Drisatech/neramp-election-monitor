from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from backend.app.analytics.engine import ElectionAnalyticsEngine, AnomalyDetectionResult, QualityAlert

router = APIRouter(prefix="/analytics", tags=["Analytics & Discrepancies"])

# Singleton engine instance
engine = ElectionAnalyticsEngine()

# Seed demonstration anomalies and alerts
_DEMO_SEEDED = False


def _ensure_seeded():
    global _DEMO_SEEDED
    if _DEMO_SEEDED:
        return
    _DEMO_SEEDED = True

    # Seed alerts
    engine.create_or_deduplicate_alert(
        alert_type="OCR_DISCREPANCY",
        severity="HIGH",
        title="Form EC8A Arithmetic Variance",
        description="PU 24-01-01-002: Valid votes (330) + Rejected votes (12) != Total votes cast (340). Variance: 2 ballots.",
        election_id="elec-2027-pres",
        polling_unit_code="24-01-01-002",
        state_code="LAGOS",
        lga_code="LAGOS_ISLAND",
    )
    engine.create_or_deduplicate_alert(
        alert_type="STATISTICAL_ANOMALY",
        severity="MEDIUM",
        title="High Turnout Outlier Flag",
        description="PU 24-01-01-001 recorded a turnout rate of 98.6% of registered voters. Field inquiry recommended.",
        election_id="elec-2027-pres",
        polling_unit_code="24-01-01-001",
        state_code="LAGOS",
        lga_code="LAGOS_ISLAND",
    )
    engine.create_or_deduplicate_alert(
        alert_type="SOURCE_DOCUMENT_CHANGE",
        severity="HIGH",
        title="Form EC8A Revision Uploaded",
        description="PU 24-08-01-004: New Form EC8A document scan uploaded with modified hash. Previous verification invalidated pending re-check.",
        election_id="elec-2027-pres",
        polling_unit_code="24-08-01-004",
        state_code="LAGOS",
        lga_code="IKEJA",
    )
    engine.create_or_deduplicate_alert(
        alert_type="MISSING_RESULTS",
        severity="LOW",
        title="Awaiting Result Sheet Upload",
        description="PU 24-03-01-003: Collation portal indicates result sheet pending mobile scanning from polling unit.",
        election_id="elec-2027-pres",
        polling_unit_code="24-03-01-003",
        state_code="LAGOS",
        lga_code="SURULERE",
    )


# Demo candidates
DEMO_CANDIDATES = [
    {"id": "cand-1", "name": "Fictional Candidate A", "partyCode": "APC", "partyName": "All Progressives Congress", "color": "#16a34a"},
    {"id": "cand-2", "name": "Fictional Candidate B", "partyCode": "PDP", "partyName": "Peoples Democratic Party", "color": "#dc2626"},
    {"id": "cand-3", "name": "Fictional Candidate C", "partyCode": "LP", "partyName": "Labour Party", "color": "#ea580c"},
    {"id": "cand-4", "name": "Fictional Candidate D", "partyCode": "NNPP", "partyName": "New Nigeria Peoples Party", "color": "#2563eb"},
]

DEMO_PARTY_VOTES = {
    "APC": 914,
    "PDP": 565,
    "LP": 744,
    "NNPP": 400,
}


@router.get("/overview")
async def get_analytics_overview(
    election_id: str = Query("elec-2027-pres"),
    state: Optional[str] = Query(None),
    lga: Optional[str] = Query(None),
) -> Dict[str, Any]:
    _ensure_seeded()

    expected_pus = 176846 if not state else (8462 if state == "LAGOS" else 3763)
    received_pus = 8 if not state else (6 if state == "LAGOS" else 2)
    verified_pus = 6 if not state else (4 if state == "LAGOS" else 2)
    discrepancy_pus = 2 if not state else (1 if state == "LAGOS" else 0)

    comp = engine.calculate_completeness(
        expected_pus=expected_pus,
        received_pus=received_pus,
        verified_pus=verified_pus,
        discrepancy_pus=discrepancy_pus,
        incomplete_pus=1,
        awaiting_ocr=1,
        under_verification=1,
        published_pus=verified_pus,
    )

    reg_voters = 93469008 if not state else 7060195
    acc_voters = 2850 if not state else 2100
    valid_votes = 2623 if not state else 1980
    rejected_votes = 54 if not state else 38
    total_votes_cast = 2677 if not state else 2018

    alerts = engine.get_all_alerts(election_id=election_id)
    active_alerts = len([a for a in alerts if a["status"] in ["NEW", "ACKNOWLEDGED", "UNDER_INVESTIGATION"]])

    return {
        "electionId": election_id,
        "electionTitle": "2027 Presidential General Election (Demonstration)",
        "electionYear": 2027,
        "electionType": "PRESIDENTIAL",
        "geographicScope": f"State: {state}" if state else "National Aggregate (37 States & FCT)",
        "lastSyncTime": "2027-02-27T18:35:00Z",
        "lastAnalyticsUpdate": datetime.now(timezone.utc).isoformat(),
        "dataSourceMode": "DEVELOPMENT_FIXTURE",
        "isDemonstration": True,
        "registeredVoters": reg_voters,
        "accreditedVoters": acc_voters,
        "totalVotesCast": total_votes_cast,
        "validVotes": valid_votes,
        "rejectedVotes": rejected_votes,
        "turnoutPercentage": round((acc_voters / reg_voters * 100), 2) if reg_voters > 0 else 0.0,
        "rejectedVotePercentage": round((rejected_votes / total_votes_cast * 100), 2) if total_votes_cast > 0 else 0.0,
        "completeness": comp,
        "unresolvedDiscrepancies": discrepancy_pus,
        "activeAnomaliesCount": 3,
        "activeAlertsCount": active_alerts,
        "geographicSummary": [
            {
                "code": "LAGOS",
                "name": "Lagos",
                "zone": "South West",
                "expectedPus": 8462,
                "receivedPus": 6,
                "verifiedPus": 4,
                "discrepantPus": 1,
                "completenessRate": round((6 / 8462) * 100, 2),
                "verificationRate": round((4 / 8462) * 100, 2),
                "leadingParty": "APC",
            },
            {
                "code": "KANO",
                "name": "Kano",
                "zone": "North West",
                "expectedPus": 11222,
                "receivedPus": 2,
                "verifiedPus": 2,
                "discrepantPus": 0,
                "completenessRate": round((2 / 11222) * 100, 2),
                "verificationRate": round((2 / 11222) * 100, 2),
                "leadingParty": "NNPP",
            },
            {
                "code": "RIVERS",
                "name": "Rivers",
                "zone": "South South",
                "expectedPus": 6866,
                "receivedPus": 1,
                "verifiedPus": 1,
                "discrepantPus": 0,
                "completenessRate": round((1 / 6866) * 100, 2),
                "verificationRate": round((1 / 6866) * 100, 2),
                "leadingParty": "PDP",
            },
        ],
    }


@router.get("/candidate-comparisons")
async def get_candidate_comparisons(
    election_id: str = Query("elec-2027-pres"),
    level: str = Query("NATIONAL"),
    filter_value: Optional[str] = Query(None),
) -> Dict[str, Any]:
    geo_breakdown = [
        {"code": "LAGOS", "partyVotes": {"APC": 500, "LP": 450, "PDP": 200, "NNPP": 50}},
        {"code": "KANO", "partyVotes": {"NNPP": 300, "APC": 200, "PDP": 150, "LP": 20}},
        {"code": "RIVERS", "partyVotes": {"PDP": 215, "APC": 214, "LP": 274, "NNPP": 50}},
    ]

    total_valid = sum(DEMO_PARTY_VOTES.values())
    total_cast = total_valid + 54

    comparisons = engine.compare_candidates(
        candidates=DEMO_CANDIDATES,
        party_votes_map=DEMO_PARTY_VOTES,
        total_valid_votes=total_valid,
        total_votes_cast=total_cast,
        geographic_breakdown=geo_breakdown,
    )

    return {
        "electionId": election_id,
        "electionTitle": "2027 Presidential General Election (Demonstration)",
        "level": level,
        "filterValue": filter_value,
        **comparisons,
    }


@router.get("/anomalies")
async def get_statistical_anomalies(
    election_id: str = Query("elec-2027-pres"),
    rule_name: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
) -> Dict[str, Any]:
    sample_pus = [
        {
            "pollingUnitCode": "24-01-01-001",
            "pollingUnitName": "Olowogbowo Primary School",
            "stateCode": "LAGOS",
            "lgaCode": "LAGOS_ISLAND",
            "registeredVoters": 300,
            "accreditedVoters": 298,
            "totalVotesCast": 296,
            "validVotes": 290,
            "rejectedVotes": 6,
            "partyVotes": {"APC": 150, "PDP": 100, "LP": 40},
        },
        {
            "pollingUnitCode": "24-01-01-002",
            "pollingUnitName": "King Ado High School",
            "stateCode": "LAGOS",
            "lgaCode": "LAGOS_ISLAND",
            "registeredVoters": 850,
            "accreditedVoters": 350,
            "totalVotesCast": 340,
            "validVotes": 295,
            "rejectedVotes": 45,  # High rejected vote rate (13.2%)
            "partyVotes": {"APC": 140, "PDP": 90, "LP": 65},
        },
        {
            "pollingUnitCode": "24-02-01-003",
            "pollingUnitName": "Ikeja High School I",
            "stateCode": "LAGOS",
            "lgaCode": "IKEJA",
            "registeredVoters": 700,
            "accreditedVoters": 220,
            "totalVotesCast": 215,
            "validVotes": 210,
            "rejectedVotes": 5,
            "partyVotes": {"APC": 120, "PDP": 60, "LP": 30},
        },
        {
            "pollingUnitCode": "24-02-01-004",
            "pollingUnitName": "Ikeja High School II",
            "stateCode": "LAGOS",
            "lgaCode": "IKEJA",
            "registeredVoters": 680,
            "accreditedVoters": 220,
            "totalVotesCast": 215,
            "validVotes": 210,
            "rejectedVotes": 5,
            "partyVotes": {"APC": 120, "PDP": 60, "LP": 30},  # Identical sequence
        },
    ]

    detected = engine.detect_anomalies(sample_pus, election_id=election_id)
    if rule_name:
        detected = [d for d in detected if d.rule_name == rule_name]
    if severity:
        detected = [d for d in detected if d.severity == severity]

    return {
        "electionId": election_id,
        "total": len(detected),
        "data": [d.to_dict() for d in detected],
        "disclaimer": (
            "Statistical anomalies are investigative leads, not proof of fraud or misconduct. "
            "Do not automatically accuse candidates, parties, officials, or polling units."
        ),
    }


@router.get("/alerts")
async def get_alerts(
    election_id: Optional[str] = Query("elec-2027-pres"),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
) -> Dict[str, Any]:
    _ensure_seeded()
    alerts = engine.get_all_alerts(election_id=election_id, severity=severity, status=status)
    return {
        "total": len(alerts),
        "data": alerts,
        "statusSummary": {
            "new": len([a for a in alerts if a["status"] == "NEW"]),
            "acknowledged": len([a for a in alerts if a["status"] == "ACKNOWLEDGED"]),
            "underInvestigation": len([a for a in alerts if a["status"] == "UNDER_INVESTIGATION"]),
            "resolved": len([a for a in alerts if a["status"] == "RESOLVED"]),
        },
    }


@router.patch("/alerts/{alert_id}")
async def update_alert(
    alert_id: str,
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    _ensure_seeded()
    new_status = payload.get("status")
    assigned_to = payload.get("assignedTo")
    review_notes = payload.get("reviewNotes")
    reviewer_name = payload.get("reviewerName", "Monitoring Coordinator")

    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    updated = engine.update_alert_status(
        alert_id=alert_id,
        new_status=new_status,
        assigned_to=assigned_to,
        resolution_notes=review_notes,
        actor=reviewer_name,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"message": "Alert updated successfully", "data": updated.to_dict()}


@router.get("/source-changes")
async def get_source_document_changes(
    election_id: str = Query("elec-2027-pres"),
    polling_unit_code: Optional[str] = Query(None),
) -> Dict[str, Any]:
    sample_change = engine.track_source_change(
        polling_unit_code="24-08-01-004",
        election_id=election_id,
        prior_hash="a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
        current_hash="f0e1d2c3b4a567890123456789abcdef0123456789abcdef0123456789abcdef1",
        prior_version=1,
        current_version=2,
        source_url="https://inecelectionresults.ng/scans/24-08-01-004_v2.pdf",
        is_verified_prior=True,
    )
    changes = [sample_change] if sample_change else []
    if polling_unit_code:
        changes = [c for c in changes if c["pollingUnitCode"] == polling_unit_code]

    return {
        "electionId": election_id,
        "total": len(changes),
        "data": changes,
    }


@router.get("/reports/export")
async def export_analytics_report(
    election_id: str = Query("elec-2027-pres"),
    state: Optional[str] = Query(None),
) -> Response:
    sample_rows = [
        {
            "pollingUnitCode": "24-01-01-001",
            "pollingUnitName": "Olowogbowo Primary School",
            "stateCode": "LAGOS",
            "lgaCode": "LAGOS_ISLAND",
            "registeredVoters": 300,
            "accreditedVoters": 298,
            "validVotes": 290,
            "rejectedVotes": 6,
            "totalVotesCast": 296,
            "uploadStatus": "UPLOADED",
            "verificationStatus": "VERIFIED",
            "leadingParty": "APC",
            "fileHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "lastUpdated": "2027-02-27T18:00:00Z",
        },
        {
            "pollingUnitCode": "24-01-01-002",
            "pollingUnitName": "King Ado High School",
            "stateCode": "LAGOS",
            "lgaCode": "LAGOS_ISLAND",
            "registeredVoters": 850,
            "accreditedVoters": 350,
            "validVotes": 295,
            "rejectedVotes": 45,
            "totalVotesCast": 340,
            "uploadStatus": "UPLOADED",
            "verificationStatus": "DISCREPANCY_FLAGGED",
            "leadingParty": "APC",
            "fileHash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
            "lastUpdated": "2027-02-27T18:15:00Z",
        },
    ]

    csv_content = engine.generate_csv_report(
        pu_rows=sample_rows,
        election_title="2027 Presidential General Election (Demonstration)",
        scope_description=f"State: {state}" if state else "National Aggregate",
        total_expected=176846,
        total_received=2,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="analytics_report_{election_id}_{int(datetime.now(timezone.utc).timestamp())}.csv"'},
    )
