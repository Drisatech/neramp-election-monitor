from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel


class ResultSheetBase(BaseModel):
    polling_unit_id: str
    form_type: str = "EC8A"
    source_url: str
    file_hash: str
    image_url: Optional[str] = None
    source_status: str = "ORIGINAL"
    version: int = 1


class ResultSheetOut(ResultSheetBase):
    id: str
    upload_timestamp: Optional[datetime] = None
    retrieval_timestamp: datetime
    transcription: Dict[str, Any]
    ocr_extraction: Dict[str, Any]
    arithmetic_check: Dict[str, Any]
    ocr_confidence: float

    class Config:
        from_attributes = True


class TranscriptionCorrectionInput(BaseModel):
    valid_votes: int
    rejected_votes: int
    total_votes_cast: int
    party_votes: Dict[str, int]
    correction_reason: str
    verifier_name: Optional[str] = "Lead Verifier"


class VerificationReviewInput(BaseModel):
    decision: str  # APPROVED | DISCREPANCY_FLAGGED | RETURNED_FOR_REVIEW
    notes: Optional[str] = None
    verifier_name: Optional[str] = "Lead Verifier"
