from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

router = APIRouter(prefix="/elections", tags=["Elections"])

DEMO_ELECTIONS = [
    {
        "id": "elec-2026-gov-osun",
        "title": "Governorship election - 2026-08-15 - OSUN",
        "electionType": "GOVERNORSHIP",
        "date": "2026-08-15",
        "status": "CONCLUDED",
        "sourceReference": "INEC Official Portal Reference: https://inecelectionresults.ng",
        "isDemonstration": False,
        "stateCode": "OSUN",
    },
    {
        "id": "elec-2027-pres",
        "title": "2027 Presidential General Election (Demonstration)",
        "electionType": "PRESIDENTIAL",
        "date": "2027-02-27",
        "status": "ACTIVE_MONITORING",
        "sourceReference": "INEC Official Portal Reference: EC8A Series",
        "isDemonstration": True,
        "stateCode": None,
    },
    {
        "id": "elec-2027-gov-lag",
        "title": "2027 Lagos State Governorship Election (Demonstration)",
        "electionType": "GOVERNORSHIP",
        "date": "2027-03-13",
        "status": "ACTIVE_MONITORING",
        "sourceReference": "INEC Official Portal Reference: EC8A (Gov)",
        "isDemonstration": True,
        "stateCode": "LAGOS",
    },
]


@router.get("")
async def list_elections() -> Dict[str, Any]:
    return {"data": DEMO_ELECTIONS, "total": len(DEMO_ELECTIONS)}


@router.get("/{election_id}/summary")
async def get_election_summary(
    election_id: str,
    state: Optional[str] = Query(None),
    lga: Optional[str] = Query(None),
) -> Dict[str, Any]:
    if election_id == "elec-2026-gov-osun":
        return {
            "data": {
                "electionId": "elec-2026-gov-osun",
                "electionTitle": "Governorship election - 2026-08-15 - OSUN",
                "scope": f"LGA: {lga}" if lga else "State: Osun (30 LGAs)",
                "statesCoveredCount": 1,
                "totalExpectedPus": 3763,
                "samplePusCount": 5,
                "pusUploaded": 5,
                "pusNotUploaded": 0,
                "pusUnavailable": 0,
                "uploadCompletionPercentage": 100.0,
                "awaitingTranscription": 0,
                "awaitingVerification": 1,
                "verifiedCount": 4,
                "discrepancyCount": 0,
                "totalValidVotes": 955882,
                "totalRejectedVotes": 18674,
                "totalVotesCast": 974556,
                "candidateRankings": [
                    {
                        "candidateId": "cand-osun-1",
                        "candidateName": "Ademola Adeleke",
                        "partyCode": "ACCORD",
                        "partyName": "Accord Party",
                        "color": "#ea580c",
                        "votes": 511067,
                        "percentage": 53.46,
                    },
                    {
                        "candidateId": "cand-osun-2",
                        "candidateName": "Bola Oyebamiji",
                        "partyCode": "APC",
                        "partyName": "All Progressives Congress",
                        "color": "#16a34a",
                        "votes": 444815,
                        "percentage": 46.54,
                    },
                ],
                "partyVotes": {"ACCORD": 511067, "APC": 444815},
                "lastSourceDataRetrieval": "2026-08-16T10:30:00Z",
                "lastDatabaseUpdate": datetime.now(timezone.utc).isoformat(),
                "dataSourceMode": "OFFICIAL_SOURCE",
            }
        }

    # Default: 2027 presidential simulation
    return {
        "data": {
            "electionId": election_id,
            "electionTitle": "2027 Presidential General Election (Demonstration)",
            "scope": f"State: {state}" if state else "National",
            "statesCoveredCount": 1 if state else 37,
            "totalExpectedPus": 176846,
            "samplePusCount": 10,
            "pusUploaded": 8,
            "pusNotUploaded": 1,
            "pusUnavailable": 1,
            "uploadCompletionPercentage": 80.0,
            "awaitingTranscription": 1,
            "awaitingVerification": 1,
            "verifiedCount": 6,
            "discrepancyCount": 2,
            "totalValidVotes": 2623,
            "totalRejectedVotes": 54,
            "totalVotesCast": 2677,
            "candidateRankings": [
                {
                    "candidateId": "cand-1",
                    "candidateName": "Fictional Candidate A",
                    "partyCode": "APC",
                    "partyName": "All Progressives Congress",
                    "color": "#16a34a",
                    "votes": 914,
                    "percentage": 34.85,
                },
                {
                    "candidateId": "cand-3",
                    "candidateName": "Fictional Candidate C",
                    "partyCode": "LP",
                    "partyName": "Labour Party",
                    "color": "#ea580c",
                    "votes": 744,
                    "percentage": 28.36,
                },
                {
                    "candidateId": "cand-2",
                    "candidateName": "Fictional Candidate B",
                    "partyCode": "PDP",
                    "partyName": "Peoples Democratic Party",
                    "color": "#dc2626",
                    "votes": 678,
                    "percentage": 25.85,
                },
                {
                    "candidateId": "cand-4",
                    "candidateName": "Fictional Candidate D",
                    "partyCode": "NNPP",
                    "partyName": "New Nigeria Peoples Party",
                    "color": "#2563eb",
                    "votes": 287,
                    "percentage": 10.94,
                },
            ],
            "partyVotes": {"APC": 914, "LP": 744, "PDP": 678, "NNPP": 287},
            "lastSourceDataRetrieval": "2027-02-27T19:12:00Z",
            "lastDatabaseUpdate": datetime.now(timezone.utc).isoformat(),
            "dataSourceMode": "DEVELOPMENT",
        }
    }


@router.get("/{election_id}/upload-progress")
async def get_upload_progress(election_id: str, state: Optional[str] = Query(None)) -> Dict[str, Any]:
    if election_id == "elec-2026-gov-osun":
        return {
            "data": {
                "total": 5,
                "uploaded": 5,
                "pending": 0,
                "unavailable": 0,
                "uploadPercentage": 100.0,
                "timeline": [
                    {"hour": "15:00 WAT", "uploaded": 1, "rate": 20.0},
                    {"hour": "16:00 WAT", "uploaded": 2, "rate": 40.0},
                    {"hour": "17:00 WAT", "uploaded": 3, "rate": 60.0},
                    {"hour": "18:00 WAT", "uploaded": 4, "rate": 80.0},
                    {"hour": "19:00 WAT", "uploaded": 5, "rate": 100.0},
                ],
            }
        }

    return {
        "data": {
            "total": 10,
            "uploaded": 8,
            "pending": 1,
            "unavailable": 1,
            "uploadPercentage": 80.0,
            "timeline": [
                {"hour": "14:00 WAT", "uploaded": 1, "rate": 10.0},
                {"hour": "15:00 WAT", "uploaded": 2, "rate": 20.0},
                {"hour": "16:00 WAT", "uploaded": 3, "rate": 30.0},
                {"hour": "17:00 WAT", "uploaded": 5, "rate": 50.0},
                {"hour": "18:00 WAT", "uploaded": 7, "rate": 70.0},
                {"hour": "19:00 WAT", "uploaded": 8, "rate": 80.0},
            ],
        }
    }
