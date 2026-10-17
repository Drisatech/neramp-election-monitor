import hashlib
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta


def utcnow_str() -> str:
    return datetime.now(timezone.utc).isoformat()


# Role hierarchy and permissions definition
ROLE_HIERARCHY = {
    "SUPER_ADMIN": 100,
    "PROJECT_ADMIN": 80,
    "MONITORING_COORDINATOR": 60,
    "STATE_COORDINATOR": 50,
    "LGA_COORDINATOR": 40,
    "RESULT_VERIFIER": 30,
    "ELECTION_ANALYST": 30,
    "REGISTERED_OBSERVER": 20,
    "PUBLIC_USER": 10,
}


class AdminService:
    def __init__(self):
        # Initial seeded administrative users
        self.users: Dict[str, Dict[str, Any]] = {
            "usr-admin-01": {
                "id": "usr-admin-01",
                "email": "sysadmin@electionwatch.ng",
                "full_name": "Dr. Babatunde Adeleke",
                "role": "SUPER_ADMIN",
                "is_active": True,
                "assigned_state_code": None,
                "assigned_lga_code": None,
                "assigned_ward_code": None,
                "assigned_pus": [],
                "badge": "ADM-HQ-001",
                "last_login": "2027-02-27T19:30:00Z",
                "created_at": "2026-06-01T08:00:00Z",
                "updated_at": "2027-02-27T19:30:00Z",
            },
            "usr-proj-01": {
                "id": "usr-proj-01",
                "email": "project.lead@electionwatch.ng",
                "full_name": "Ngozi Eze",
                "role": "PROJECT_ADMIN",
                "is_active": True,
                "assigned_state_code": None,
                "assigned_lga_code": None,
                "assigned_ward_code": None,
                "assigned_pus": [],
                "badge": "ADM-HQ-002",
                "last_login": "2027-02-27T18:45:00Z",
                "created_at": "2026-06-15T09:00:00Z",
                "updated_at": "2027-02-27T18:45:00Z",
            },
            "usr-coord-lagos": {
                "id": "usr-coord-lagos",
                "email": "coord.lagos@electionwatch.ng",
                "full_name": "Amina Bello",
                "role": "STATE_COORDINATOR",
                "is_active": True,
                "assigned_state_code": "LAGOS",
                "assigned_lga_code": None,
                "assigned_ward_code": None,
                "assigned_pus": [],
                "badge": "COORD-LAG-01",
                "last_login": "2027-02-27T19:15:00Z",
                "created_at": "2026-09-01T10:00:00Z",
                "updated_at": "2027-02-27T19:15:00Z",
            },
            "usr-verif-01": {
                "id": "usr-verif-01",
                "email": "lead.verifier@electionwatch.ng",
                "full_name": "Chinedu Okonkwo",
                "role": "RESULT_VERIFIER",
                "is_active": True,
                "assigned_state_code": "LAGOS",
                "assigned_lga_code": "LAGOS_ISLAND",
                "assigned_ward_code": None,
                "assigned_pus": ["25-01-01-001", "25-01-01-002"],
                "badge": "VER-SW-008",
                "last_login": "2027-02-27T19:22:00Z",
                "created_at": "2026-10-01T11:00:00Z",
                "updated_at": "2027-02-27T19:22:00Z",
            },
            "usr-obs-01": {
                "id": "usr-obs-01",
                "email": "lead.observer@electionwatch.ng",
                "full_name": "Lead Field Observer",
                "role": "REGISTERED_OBSERVER",
                "is_active": True,
                "assigned_state_code": "LAGOS",
                "assigned_lga_code": "LAGOS_ISLAND",
                "assigned_ward_code": "LAG_ISL_01",
                "assigned_pus": ["25-01-01-001"],
                "badge": "OBS-SW-042",
                "last_login": "2027-02-27T18:10:00Z",
                "created_at": "2026-11-01T12:00:00Z",
                "updated_at": "2027-02-27T18:10:00Z",
            },
            "usr-analyst-01": {
                "id": "usr-analyst-01",
                "email": "analyst@electionwatch.ng",
                "full_name": "Farouk Danjuma",
                "role": "ELECTION_ANALYST",
                "is_active": True,
                "assigned_state_code": None,
                "assigned_lga_code": None,
                "assigned_ward_code": None,
                "assigned_pus": [],
                "badge": "ANA-HQ-003",
                "last_login": "2027-02-27T17:50:00Z",
                "created_at": "2026-12-01T14:00:00Z",
                "updated_at": "2027-02-27T17:50:00Z",
            },
        }

        # Audit logs memory store
        self.audit_logs: List[Dict[str, Any]] = [
            {
                "id": "audit-cmd-001",
                "timestamp": "2027-02-27T19:30:00Z",
                "actor": "sysadmin@electionwatch.ng",
                "role": "SUPER_ADMIN",
                "ip_address": "197.210.65.12",
                "action": "ACCESS_COMMAND_CENTER",
                "target": "admin_command_centre",
                "details": "Command Center dashboard viewed. System metrics checked.",
            },
            {
                "id": "audit-cmd-002",
                "timestamp": "2027-02-27T19:15:00Z",
                "actor": "sysadmin@electionwatch.ng",
                "role": "SUPER_ADMIN",
                "ip_address": "197.210.65.12",
                "action": "VERIFY_OBSERVER_CREDENTIALS",
                "target": "usr-obs-01",
                "details": "Observer credential and accreditation badge OBS-SW-042 verified.",
            },
        ]

        # Operational queues and health status
        self.scheduler_paused = False
        self.cache_stats = {"hits": 45120, "misses": 3410, "items_cached": 128}

    def can_manage_role(self, actor_role: str, target_role: str) -> bool:
        """Enforces least-privilege role management rules."""
        actor_weight = ROLE_HIERARCHY.get(actor_role, 0)
        target_weight = ROLE_HIERARCHY.get(target_role, 0)
        return actor_weight >= target_weight

    def log_audit(self, actor: str, role: str, action: str, target: str, details: str, ip: str = "127.0.0.1") -> Dict[str, Any]:
        entry = {
            "id": f"audit-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            "timestamp": utcnow_str(),
            "actor": actor,
            "role": role,
            "ip_address": ip,
            "action": action,
            "target": target,
            "details": details,
        }
        self.audit_logs.insert(0, entry)
        return entry

    def get_users(self, role: Optional[str] = None, is_active: Optional[bool] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        users = list(self.users.values())
        if role:
            users = [u for u in users if u["role"] == role]
        if is_active is not None:
            users = [u for u in users if u["is_active"] == is_active]
        if search:
            q = search.lower()
            users = [u for u in users if q in u["full_name"].lower() or q in u["email"].lower() or (u["badge"] and q in u["badge"].lower())]
        return users

    def create_user(self, data: Dict[str, Any], actor: str = "sysadmin@electionwatch.ng", actor_role: str = "SUPER_ADMIN") -> Dict[str, Any]:
        target_role = data.get("role", "REGISTERED_OBSERVER")
        if not self.can_manage_role(actor_role, target_role):
            raise PermissionError(f"Role {actor_role} cannot create user with role {target_role}")

        user_id = f"usr-{uuid.uuid4().hex[:8]}"
        now = utcnow_str()
        new_user = {
            "id": user_id,
            "email": data["email"],
            "full_name": data["full_name"],
            "role": target_role,
            "is_active": data.get("is_active", True),
            "assigned_state_code": data.get("assigned_state_code"),
            "assigned_lga_code": data.get("assigned_lga_code"),
            "assigned_ward_code": data.get("assigned_ward_code"),
            "assigned_pus": data.get("assigned_pus", []),
            "badge": data.get("badge") or f"USR-{uuid.uuid4().hex[:6].upper()}",
            "last_login": None,
            "created_at": now,
            "updated_at": now,
        }
        self.users[user_id] = new_user
        self.log_audit(actor, actor_role, "CREATE_USER", user_id, f"Created user {new_user['email']} with role {target_role}.")
        return new_user

    def update_user(self, user_id: str, data: Dict[str, Any], actor: str = "sysadmin@electionwatch.ng", actor_role: str = "SUPER_ADMIN") -> Dict[str, Any]:
        if user_id not in self.users:
            raise KeyError("User not found")

        current = self.users[user_id]
        if not self.can_manage_role(actor_role, current["role"]):
            raise PermissionError(f"Role {actor_role} cannot modify user with role {current['role']}")

        new_role = data.get("role")
        if new_role and not self.can_manage_role(actor_role, new_role):
            raise PermissionError(f"Role {actor_role} cannot assign higher role {new_role}")

        for k in ["full_name", "role", "is_active", "assigned_state_code", "assigned_lga_code", "assigned_ward_code", "assigned_pus", "badge"]:
            if k in data and data[k] is not None:
                current[k] = data[k]
        current["updated_at"] = utcnow_str()
        self.log_audit(actor, actor_role, "UPDATE_USER", user_id, f"Updated attributes for user {current['email']}.")
        return current

    def toggle_user_status(self, user_id: str, actor: str = "sysadmin@electionwatch.ng", actor_role: str = "SUPER_ADMIN") -> Dict[str, Any]:
        if user_id not in self.users:
            raise KeyError("User not found")
        current = self.users[user_id]
        if not self.can_manage_role(actor_role, current["role"]):
            raise PermissionError("Cannot modify account with equal or higher role")

        current["is_active"] = not current["is_active"]
        current["updated_at"] = utcnow_str()
        action = "ACTIVATE_USER" if current["is_active"] else "DEACTIVATE_USER"
        self.log_audit(actor, actor_role, action, user_id, f"Account {current['email']} status toggled to is_active={current['is_active']}.")
        return current

    def reset_user_access(self, user_id: str, actor: str = "sysadmin@electionwatch.ng", actor_role: str = "SUPER_ADMIN") -> Dict[str, Any]:
        if user_id not in self.users:
            raise KeyError("User not found")
        user = self.users[user_id]

        reset_token = f"rst-{uuid.uuid4().hex}"
        temp_pwd = f"Sec2027!{uuid.uuid4().hex[:6]}"
        expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

        self.log_audit(actor, actor_role, "RESET_USER_ACCESS", user_id, f"One-time access reset token generated for {user['email']}.")
        return {
            "user_id": user_id,
            "email": user["email"],
            "reset_token": reset_token,
            "temporary_password": temp_pwd,
            "expires_at": expires,
            "message": "Secure access reset generated successfully. Valid for 24 hours.",
        }

    def get_command_center_metrics(self) -> Dict[str, Any]:
        all_users = list(self.users.values())
        role_counts: Dict[str, int] = {}
        for u in all_users:
            r = u["role"]
            role_counts[r] = role_counts.get(r, 0) + 1

        return {
            "total_users": len(all_users),
            "active_users": sum(1 for u in all_users if u["is_active"]),
            "users_by_role": role_counts,
            "configured_elections_count": 2,  # 2027 Presidential General & 2026 Osun Governorship
            "configured_states_count": 37,
            "configured_lgas_count": 774,
            "configured_pus_count": 176846,
            "results_expected": 176846,
            "results_received": 10,
            "results_verified": 8,
            "results_pending_verification": 2,
            "results_disputed": 1,
            "unresolved_discrepancies": 1,
            "unresolved_incidents": 2,
            "ocr_queue_status": {
                "pending": 0,
                "in_progress": 0,
                "completed": 10,
                "failed": 0,
                "average_latency_seconds": 1.4,
                "active_workers": 4,
            },
            "ingestion_status": {
                "scheduler_paused": self.scheduler_paused,
                "interval_minutes": 5,
                "last_run": "2027-02-27T19:12:00Z",
                "next_run": "2027-02-27T19:17:00Z",
                "active_adapter": "DevelopmentFixtureAdapter",
            },
            "inec_connectivity": {
                "status": "OPERATIONAL_SIMULATED",
                "portal_url": "https://inecelectionresults.ng",
                "latency_ms": 42,
                "rate_limit_quota": "60 req/min (0 used)",
                "auth_configured": False,
            },
            "system_health": {
                "api_status": "HEALTHY",
                "database_status": "CONNECTED",
                "connection_pool": {"active": 4, "idle": 16, "max": 20},
                "cache_status": "OPTIMAL",
                "memory_usage_mb": 142.5,
                "storage_capacity_gb": {"used": 14.2, "available": 85.8, "total": 100.0},
            },
        }

    def export_audit_logs_read_only(self) -> Dict[str, Any]:
        """Exports audit logs with a tamper-evident cryptographic checksum."""
        raw_repr = str(self.audit_logs).encode("utf-8")
        checksum = hashlib.sha256(raw_repr).hexdigest()
        return {
            "exported_at": utcnow_str(),
            "record_count": len(self.audit_logs),
            "integrity_sha256": checksum,
            "legal_notice": "Independent Election Watch Audit Trail. Read-only compliance export.",
            "logs": self.audit_logs,
        }


# Global singleton instance
admin_service = AdminService()
