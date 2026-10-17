from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def dict(self, *args, **kwargs):
            return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

    def Field(*args, **kwargs):
        return None


class UserBase(BaseModel):
    email: str
    full_name: str
    role: str
    is_active: bool = True
    assigned_state_code: Optional[str] = None
    assigned_lga_code: Optional[str] = None
    assigned_ward_code: Optional[str] = None
    assigned_pus: List[str] = []
    badge: Optional[str] = None


class UserCreate(UserBase):
    initial_password: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_state_code: Optional[str] = None
    assigned_lga_code: Optional[str] = None
    assigned_ward_code: Optional[str] = None
    assigned_pus: Optional[List[str]] = None
    badge: Optional[str] = None


class UserResponse(UserBase):
    id: str
    created_at: str
    updated_at: str
    last_login: Optional[str] = None


class AccessResetResponse(BaseModel):
    user_id: str
    email: str
    reset_token: str
    temporary_password: str
    expires_at: str
    message: str


class CommandCenterMetricsResponse(BaseModel):
    total_users: int
    active_users: int
    users_by_role: Dict[str, int]
    configured_elections_count: int
    configured_states_count: int
    configured_lgas_count: int
    configured_pus_count: int
    results_expected: int
    results_received: int
    results_verified: int
    results_pending_verification: int
    results_disputed: int
    unresolved_discrepancies: int
    unresolved_incidents: int
    ocr_queue_status: Dict[str, Any]
    ingestion_status: Dict[str, Any]
    inec_connectivity: Dict[str, Any]
    system_health: Dict[str, Any]


class AuditLogFilter(BaseModel):
    actor: Optional[str] = None
    action: Optional[str] = None
    target: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: int = 50
    offset: int = 0
