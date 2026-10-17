from typing import Optional, List
from pydantic import BaseModel


class StateBase(BaseModel):
    code: str
    name: str
    zone: str
    total_lgas: int
    total_pus: int
    registered_voters: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class StateOut(StateBase):
    id: str

    class Config:
        from_attributes = True


class LGABase(BaseModel):
    state_id: str
    code: str
    name: str
    total_wards: int = 0
    total_pus: int = 0


class LGAOut(LGABase):
    id: str

    class Config:
        from_attributes = True


class WardBase(BaseModel):
    lga_id: str
    code: str
    name: str
    total_pus: int = 0


class WardOut(WardBase):
    id: str

    class Config:
        from_attributes = True


class PollingUnitBase(BaseModel):
    code: str  # Preserved zero-padded string e.g. "25-01-01-001"
    name: str
    ward_id: str
    election_id: str
    registered_voters: int = 0
    accredited_voters: int = 0
    upload_status: str = "NOT_YET_UPLOADED"
    transcription_status: str = "NOT_APPLICABLE"
    verification_status: str = "NOT_APPLICABLE"


class PollingUnitOut(PollingUnitBase):
    id: str
    source_upload_timestamp: Optional[str] = None
    last_retrieved_timestamp: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True
