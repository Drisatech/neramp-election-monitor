from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# Election Schemas
class ElectionTypeBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None


class ElectionTypeOut(ElectionTypeBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ElectionBase(BaseModel):
    title: str
    election_type_id: str
    election_date: datetime
    status: str = "ACTIVE_MONITORING"
    is_demonstration: bool = True
    source_reference: Optional[str] = None


class ElectionOut(ElectionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ElectionSummaryOut(BaseModel):
    election_id: str
    election_title: str
    scope: str
    states_covered_count: int
    total_expected_pus: int
    sample_pus_count: int
    pus_uploaded: number_uploaded = Field(..., alias="pus_uploaded")
    pus_not_uploaded: int
    pus_unavailable: int
    upload_completion_percentage: float
    awaiting_transcription: int
    awaiting_verification: int
    verified_count: int
    discrepancy_count: int
    total_valid_votes: int
    total_rejected_votes: int
    total_votes_cast: int
    candidate_rankings: List[Dict[str, Any]]
    party_votes: Dict[str, int]
    last_source_data_retrieval: Optional[str] = None
    last_database_update: str
    data_source_mode: str
