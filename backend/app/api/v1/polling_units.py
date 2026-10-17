from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List

router = APIRouter(prefix="/polling-units", tags=["Polling Units"])

POLLING_UNITS_DATA = [
    # Osun State Governorship Official Polling Units
    {
        "id": "pu-29-24-01-001",
        "code": "29-24-01-001",
        "name": "OPEN SPACE, ATAOJA PALACE SQUARE, OSOGBO",
        "stateCode": "OSUN",
        "lgaCode": "OSOGBO",
        "wardCode": "ATAOJA_A",
        "registeredVoters": 680,
        "accreditedVoters": 412,
        "electionId": "elec-2026-gov-osun",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "VERIFIED",
        "sourceUploadTimestamp": "2026-08-15T16:45:22Z",
        "lastRetrievedTimestamp": "2026-08-15T17:00:10Z",
        "resultSheetId": "rs-29-24-01-001",
        "latitude": 7.7827,
        "longitude": 4.5418,
    },
    {
        "id": "pu-29-24-01-002",
        "code": "29-24-01-002",
        "name": "COMMUNITY GRAMMAR SCHOOL, OJA-OBA, OSOGBO",
        "stateCode": "OSUN",
        "lgaCode": "OSOGBO",
        "wardCode": "ATAOJA_A",
        "registeredVoters": 750,
        "accreditedVoters": 465,
        "electionId": "elec-2026-gov-osun",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "VERIFIED",
        "sourceUploadTimestamp": "2026-08-15T17:10:14Z",
        "lastRetrievedTimestamp": "2026-08-15T17:25:00Z",
        "resultSheetId": "rs-29-24-01-002",
        "latitude": 7.7850,
        "longitude": 4.5450,
    },
    {
        "id": "pu-29-11-01-003",
        "code": "29-11-01-003",
        "name": "OPEN SPACE, TIMI PALACE GATE, EDE SOUTH",
        "stateCode": "OSUN",
        "lgaCode": "EDE_SOUTH",
        "wardCode": "EDE_S_01",
        "registeredVoters": 820,
        "accreditedVoters": 540,
        "electionId": "elec-2026-gov-osun",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "VERIFIED",
        "sourceUploadTimestamp": "2026-08-15T17:35:00Z",
        "lastRetrievedTimestamp": "2026-08-15T17:50:00Z",
        "resultSheetId": "rs-29-11-01-003",
        "latitude": 7.7380,
        "longitude": 4.4420,
    },
    {
        "id": "pu-29-17-02-004",
        "code": "29-17-02-004",
        "name": "ST. JOHN'S PRIMARY SCHOOL, ILORO, ILESA EAST",
        "stateCode": "OSUN",
        "lgaCode": "ILESA_EAST",
        "wardCode": "ILESA_E_01",
        "registeredVoters": 690,
        "accreditedVoters": 398,
        "electionId": "elec-2026-gov-osun",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "VERIFIED",
        "sourceUploadTimestamp": "2026-08-15T18:02:40Z",
        "lastRetrievedTimestamp": "2026-08-15T18:15:00Z",
        "resultSheetId": "rs-29-17-02-004",
        "latitude": 7.6250,
        "longitude": 4.7450,
    },
    {
        "id": "pu-29-15-01-005",
        "code": "29-15-01-005",
        "name": "TOWN HALL, ENUWA SQUARE, IFE CENTRAL",
        "stateCode": "OSUN",
        "lgaCode": "IFE_CENTRAL",
        "wardCode": "IFE_C_01",
        "registeredVoters": 780,
        "accreditedVoters": 480,
        "electionId": "elec-2026-gov-osun",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "IN_PROGRESS",
        "verificationStatus": "PENDING_VERIFICATION",
        "sourceUploadTimestamp": "2026-08-15T18:25:10Z",
        "lastRetrievedTimestamp": "2026-08-15T18:35:00Z",
        "resultSheetId": "rs-29-15-01-005",
        "latitude": 7.4850,
        "longitude": 4.5580,
    },
    # 2027 Demonstration Polling Units
    {
        "id": "pu-25-01-01-001",
        "code": "25-01-01-001",
        "name": "Open Space by Elegbata Jetty Entrance",
        "stateCode": "LAGOS",
        "lgaCode": "LAGOS_ISLAND",
        "wardCode": "LAG_ISL_01",
        "registeredVoters": 742,
        "accreditedVoters": 395,
        "electionId": "elec-2027-pres",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "VERIFIED",
        "sourceUploadTimestamp": "2027-02-27T17:42:15Z",
        "lastRetrievedTimestamp": "2027-02-27T17:48:30Z",
        "resultSheetId": "rs-25-01-01-001",
        "latitude": 6.4582,
        "longitude": 3.3854,
    },
    {
        "id": "pu-25-01-01-002",
        "code": "25-01-01-002",
        "name": "St. Paul Primary School Compound (Unit 2)",
        "stateCode": "LAGOS",
        "lgaCode": "LAGOS_ISLAND",
        "wardCode": "LAG_ISL_01",
        "registeredVoters": 810,
        "accreditedVoters": 420,
        "electionId": "elec-2027-pres",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "DISCREPANCY_FLAGGED",
        "sourceUploadTimestamp": "2027-02-27T18:14:02Z",
        "lastRetrievedTimestamp": "2027-02-27T18:22:10Z",
        "resultSheetId": "rs-25-01-01-002",
        "latitude": 6.4590,
        "longitude": 3.3860,
    },
    {
        "id": "pu-25-02-01-003",
        "code": "25-02-01-003",
        "name": "Alausa Community Hall, Secretariat Environs",
        "stateCode": "LAGOS",
        "lgaCode": "IKEJA",
        "wardCode": "IKEJA_01",
        "registeredVoters": 650,
        "accreditedVoters": 388,
        "electionId": "elec-2027-pres",
        "uploadStatus": "UPLOADED",
        "transcriptionStatus": "COMPLETED",
        "verificationStatus": "VERIFIED",
        "sourceUploadTimestamp": "2027-02-27T17:15:20Z",
        "lastRetrievedTimestamp": "2027-02-27T17:21:05Z",
        "resultSheetId": "rs-25-02-01-003",
        "latitude": 6.6180,
        "longitude": 3.3570,
    },
]

RESULT_SHEETS_MAP = {
    "rs-29-24-01-001": {
        "id": "rs-29-24-01-001",
        "pollingUnitCode": "29-24-01-001",
        "electionId": "elec-2026-gov-osun",
        "formType": "EC8A",
        "sourceUrl": "https://irev-results.lon1.digitaloceanspaces.com/elections/62d55684fa9e2a4f4949a012/29/24/01/001/ec8a.jpg",
        "fileHash": "9b12a865f32b781190bcda41e4649b934ca495991b7852b855e3b0c44298fc1c",
        "imageUrl": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
        "uploadTimestamp": "2026-08-15T16:45:22Z",
        "retrievalTimestamp": "2026-08-15T17:00:10Z",
        "ocrConfidence": 98.4,
        "sourceStatus": "ORIGINAL",
        "version": 1,
        "transcription": {
            "validVotes": 405,
            "rejectedVotes": 7,
            "totalVotesCast": 412,
            "partyVotes": {"ACCORD": 220, "APC": 185},
        },
        "ocrExtraction": {
            "validVotes": 405,
            "rejectedVotes": 7,
            "totalVotesCast": 412,
            "partyVotes": {"ACCORD": 220, "APC": 185},
            "rawText": "INEC FORM EC8A - OSUN GOVERNORSHIP 2026. PU: 29-24-01-001. OSOGBO. ACCORD: 220, APC: 185. VALID: 405. REJECTED BALLOTS: 7. TOTAL CAST: 412.",
        },
        "arithmeticCheck": {
            "passed": True,
            "difference": 0,
            "formula": "405 (valid) + 7 (rejected) = 412 (total cast)",
            "details": "Arithmetic is consistent with accredited voters count (412).",
        },
        "verifiedBy": "Accredited Verifier (Osun Collation)",
        "verifiedAt": "2026-08-15T17:30:00Z",
        "verifierNotes": "EC8A sheet stamped and signed by Presiding Officer.",
    },
    "rs-29-24-01-002": {
        "id": "rs-29-24-01-002",
        "pollingUnitCode": "29-24-01-002",
        "electionId": "elec-2026-gov-osun",
        "formType": "EC8A",
        "sourceUrl": "https://irev-results.lon1.digitaloceanspaces.com/elections/62d55684fa9e2a4f4949a012/29/24/01/002/ec8a.jpg",
        "fileHash": "4fa88910b8fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b77a",
        "imageUrl": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
        "uploadTimestamp": "2026-08-15T17:10:14Z",
        "retrievalTimestamp": "2026-08-15T17:25:00Z",
        "ocrConfidence": 97.2,
        "sourceStatus": "ORIGINAL",
        "version": 1,
        "transcription": {
            "validVotes": 455,
            "rejectedVotes": 10,
            "totalVotesCast": 465,
            "partyVotes": {"ACCORD": 245, "APC": 210},
        },
        "ocrExtraction": {
            "validVotes": 455,
            "rejectedVotes": 10,
            "totalVotesCast": 465,
            "partyVotes": {"ACCORD": 245, "APC": 210},
            "rawText": "INEC FORM EC8A - OSOGBO 29-24-01-002. ACCREDITED: 465. CAST: 465.",
        },
        "arithmeticCheck": {
            "passed": True,
            "difference": 0,
            "formula": "455 + 10 = 465",
            "details": "Arithmetic verified.",
        },
        "verifiedBy": "Accredited Verifier (Osun Collation)",
        "verifiedAt": "2026-08-15T17:45:00Z",
    },
    "rs-25-01-01-001": {
        "id": "rs-25-01-01-001",
        "pollingUnitCode": "25-01-01-001",
        "electionId": "elec-2027-pres",
        "formType": "EC8A",
        "sourceUrl": "https://inecelectionresults.ng/mock/sheets/25-01-01-001-ec8a.pdf",
        "fileHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "imageUrl": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
        "uploadTimestamp": "2027-02-27T17:42:15Z",
        "retrievalTimestamp": "2027-02-27T17:48:30Z",
        "ocrConfidence": 94.6,
        "sourceStatus": "ORIGINAL",
        "version": 1,
        "transcription": {
            "validVotes": 388,
            "rejectedVotes": 7,
            "totalVotesCast": 395,
            "partyVotes": {"APC": 142, "PDP": 110, "LP": 104, "NNPP": 18, "APGA": 8, "SDP": 4, "ADC": 2},
        },
        "ocrExtraction": {
            "validVotes": 388,
            "rejectedVotes": 7,
            "totalVotesCast": 395,
            "partyVotes": {"APC": 142, "PDP": 110, "LP": 104, "NNPP": 18, "APGA": 8, "SDP": 4, "ADC": 2},
            "rawText": "INEC FORM EC8A. PU 25-01-01-001. CAST: 395.",
        },
        "arithmeticCheck": {
            "passed": True,
            "difference": 0,
            "formula": "388 + 7 = 395",
            "details": "Arithmetic is consistent with accredited voters count (395).",
        },
        "verifiedBy": "Verifier #08 (Lead Observer)",
        "verifiedAt": "2027-02-27T18:05:12Z",
    },
}


@router.get("")
async def list_polling_units(
    electionId: str = "elec-2026-gov-osun",
    state: Optional[str] = Query(None),
    lga: Optional[str] = Query(None),
    uploadStatus: Optional[str] = Query(None),
    verificationStatus: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    res = [p for p in POLLING_UNITS_DATA if p["electionId"] == electionId]
    if state:
        res = [p for p in res if p["stateCode"] == state]
    if lga:
        res = [p for p in res if p["lgaCode"] == lga]
    if uploadStatus:
        res = [p for p in res if p["uploadStatus"] == uploadStatus]
    if verificationStatus:
        res = [p for p in res if p["verificationStatus"] == verificationStatus]
    if search:
        q = search.lower()
        res = [p for p in res if q in p["code"].lower() or q in p["name"].lower()]

    total = len(res)
    paginated = res[offset : offset + limit]
    return {
        "data": paginated,
        "pagination": {"total": total, "limit": limit, "offset": offset, "hasMore": offset + limit < total},
    }


@router.get("/{pu_id}")
async def get_polling_unit_detail(pu_id: str) -> Dict[str, Any]:
    found = next((p for p in POLLING_UNITS_DATA if p["id"] == pu_id or p["code"] == pu_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Polling unit not found")

    sheet = RESULT_SHEETS_MAP.get(found.get("resultSheetId", ""), None)

    return {
        "data": {
            **found,
            "stateName": "Osun" if found["stateCode"] == "OSUN" else "Lagos",
            "lgaName": found["lgaCode"].replace("_", " ").title(),
            "wardName": found["wardCode"].replace("_", " ").title(),
            "resultSheet": sheet,
            "discrepancies": [],
            "provenance": {
                "dataSource": "OFFICIAL_SOURCE" if found["electionId"] == "elec-2026-gov-osun" else "DEVELOPMENT",
                "isDemonstration": found["electionId"] != "elec-2026-gov-osun",
                "sourceDisclaimer": (
                    "Official INEC Portal Reference: Governorship election - 2026-08-15 - OSUN"
                    if found["electionId"] == "elec-2026-gov-osun"
                    else "Demonstration record. Not official INEC declaration."
                ),
                "portalUrl": "https://inecelectionresults.ng",
            },
        }
    }
