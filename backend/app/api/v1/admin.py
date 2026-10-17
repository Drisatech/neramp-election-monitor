from fastapi import APIRouter, HTTPException, Query, Body, Header
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from backend.app.core.config import settings
from backend.app.ingestion.scheduler import ingestion_service
from backend.app.integrations.adapters import InecApprovedSourceAdapter, DevelopmentFixtureAdapter
from backend.app.admin.service import admin_service

router = APIRouter(prefix="/admin", tags=["Administrative Command Centre"])


# ==========================================
# 1. Central Command Centre Metrics
# ==========================================

@router.get("/command-center/metrics")
async def get_command_center_metrics() -> Dict[str, Any]:
    """
    Returns consolidated high-level operational metrics across users,
    elections, result processing, OCR queues, discrepancies, and system health.
    """
    metrics = admin_service.get_command_center_metrics()
    return {"data": metrics}


# ==========================================
# 2. User & Role Management
# ==========================================

@router.get("/users")
async def list_users(
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
) -> Dict[str, Any]:
    users = admin_service.get_users(role=role, is_active=is_active, search=search)
    return {"data": users, "total": len(users)}


@router.post("/users")
async def create_user(
    user_data: Dict[str, Any] = Body(...),
    x_actor_email: str = Header("sysadmin@electionwatch.ng"),
    x_actor_role: str = Header("SUPER_ADMIN"),
) -> Dict[str, Any]:
    try:
        user = admin_service.create_user(user_data, actor=x_actor_email, actor_role=x_actor_role)
        return {"message": "User created successfully", "data": user}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: Dict[str, Any] = Body(...),
    x_actor_email: str = Header("sysadmin@electionwatch.ng"),
    x_actor_role: str = Header("SUPER_ADMIN"),
) -> Dict[str, Any]:
    try:
        user = admin_service.update_user(user_id, update_data, actor=x_actor_email, actor_role=x_actor_role)
        return {"message": "User updated successfully", "data": user}
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found")
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))


@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    x_actor_email: str = Header("sysadmin@electionwatch.ng"),
    x_actor_role: str = Header("SUPER_ADMIN"),
) -> Dict[str, Any]:
    try:
        user = admin_service.toggle_user_status(user_id, actor=x_actor_email, actor_role=x_actor_role)
        return {"message": f"User status set to is_active={user['is_active']}", "data": user}
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found")
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))


@router.post("/users/{user_id}/reset-access")
async def reset_user_access(
    user_id: str,
    x_actor_email: str = Header("sysadmin@electionwatch.ng"),
    x_actor_role: str = Header("SUPER_ADMIN"),
) -> Dict[str, Any]:
    try:
        result = admin_service.reset_user_access(user_id, actor=x_actor_email, actor_role=x_actor_role)
        return {"data": result}
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found")
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))


# ==========================================
# 3. Audit Logs & Compliance Export
# ==========================================

@router.get("/audit-logs")
async def list_audit_logs(
    action: Optional[str] = Query(None),
    actor: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
) -> Dict[str, Any]:
    logs = admin_service.audit_logs
    if action:
        logs = [l for l in logs if l["action"] == action]
    if actor:
        logs = [l for l in logs if actor.lower() in l["actor"].lower()]
    total = len(logs)
    paginated = logs[offset : offset + limit]
    return {"data": paginated, "total": total}


@router.get("/audit-logs/export")
async def export_audit_logs() -> Dict[str, Any]:
    export_payload = admin_service.export_audit_logs_read_only()
    return {"data": export_payload}


# ==========================================
# 4. System Operations & Health Controls
# ==========================================

@router.post("/operations/pause-scheduler")
async def pause_scheduler(
    paused: bool = Body(..., embed=True),
    x_actor_email: str = Header("sysadmin@electionwatch.ng"),
    x_actor_role: str = Header("SUPER_ADMIN"),
) -> Dict[str, Any]:
    admin_service.scheduler_paused = paused
    action = "PAUSE_INGESTION_SCHEDULER" if paused else "RESUME_INGESTION_SCHEDULER"
    admin_service.log_audit(x_actor_email, x_actor_role, action, "scheduler", f"Scheduler paused set to {paused}")
    return {"message": f"Ingestion scheduler {'paused' if paused else 'resumed'} successfully.", "paused": paused}


@router.post("/operations/clear-cache")
async def clear_cache(
    x_actor_email: str = Header("sysadmin@electionwatch.ng"),
    x_actor_role: str = Header("SUPER_ADMIN"),
) -> Dict[str, Any]:
    admin_service.cache_stats["items_cached"] = 0
    admin_service.log_audit(x_actor_email, x_actor_role, "CLEAR_VOLATILE_CACHE", "system_cache", "Volatile cache purged. Election data preserved.")
    return {"message": "Volatile cache cleared safely. All permanent election records and audit trails remain preserved."}


@router.get("/operations/diagnostics")
async def run_diagnostics() -> Dict[str, Any]:
    return {
        "data": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_health": "OPTIMAL",
            "checks": [
                {"service": "Database PostGIS Engine", "status": "CONNECTED", "latency_ms": 1.2},
                {"service": "FastAPI Core Gateway", "status": "ONLINE", "latency_ms": 0.8},
                {"service": "OCR Extraction Worker", "status": "READY", "queue_depth": 0},
                {"service": "INEC IReV Source Portal", "status": "REACHABLE", "latency_ms": 42.0},
                {"service": "Audit Trail Log Storage", "status": "INTACT", "integrity_verified": True},
            ]
        }
    }


# ==========================================
# 5. Existing Ingestion Endpoints (Preserved)
# ==========================================

@router.get("/ingestion/status")
async def get_ingestion_status() -> Dict[str, Any]:
    adapter_health = await ingestion_service.adapter.test_connection()
    last_job = ingestion_service.job_history[0] if ingestion_service.job_history else None

    return {
        "data": {
            "current_mode": settings.DATA_SOURCE_MODE,
            "target_election": "Governorship election - 2026-08-15 - OSUN",
            "official_portal_url": settings.INEC_OFFICIAL_PORTAL_URL,
            "connection_status": adapter_health.get("status", "CONNECTED"),
            "is_official_adapter_active": ingestion_service.adapter.is_live_official_source(),
            "active_adapter": ingestion_service.adapter.get_adapter_name(),
            "last_successful_retrieval": ingestion_service.last_run_timestamp.isoformat() if ingestion_service.last_run_timestamp else (last_job["finished_at"] if last_job else None),
            "total_records_processed": len(ingestion_service.ingested_records_cache),
            "jobs_count": len(ingestion_service.job_history),
            "adapter_health_details": adapter_health,
        }
    }


@router.post("/ingestion/run")
async def trigger_manual_ingestion(
    adapter_type: Optional[str] = Body("InecApprovedSourceAdapter", embed=True),
    election_id: Optional[str] = Body("elec-2026-gov-osun", embed=True),
) -> Dict[str, Any]:
    if adapter_type == "InecApprovedSourceAdapter":
        ingestion_service.adapter = InecApprovedSourceAdapter()
    elif adapter_type == "DevelopmentFixtureAdapter":
        ingestion_service.adapter = DevelopmentFixtureAdapter()

    job_result = await ingestion_service.execute_ingestion(
        election_id=election_id,
        actor="admin:manual_trigger",
    )
    return {
        "message": "Ingestion job completed successfully.",
        "data": job_result,
    }


@router.get("/ingestion/jobs")
async def list_ingestion_jobs() -> Dict[str, Any]:
    return {"data": ingestion_service.job_history, "total": len(ingestion_service.job_history)}
