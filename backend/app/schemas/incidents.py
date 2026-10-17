from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class IncidentCreate(BaseModel):
    category: str
    state_name: str
    lga_name: str
    polling_unit_code: Optional[str] = None
    description: str
    severity: str = "MEDIUM"


class IncidentOut(BaseModel):
    id: str
    election_id: str
    category: str
    state_name: str
    lga_name: str
    ward_name: Optional[str] = None
    polling_unit_code: Optional[str] = None
    reported_at: str
    description: str
    status: str
    severity: str
    is_published: bool
    evidence_count: int
    observer_badge: str
