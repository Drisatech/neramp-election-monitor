from fastapi import APIRouter, Query
from typing import Optional, Dict, Any, List

router = APIRouter(tags=["Geography"])

STATES = [
    {"code": "OSUN", "name": "Osun", "zone": "South West", "totalLgas": 30, "totalPus": 3763, "registeredVoters": 1954800, "latitude": 7.5629, "longitude": 4.5200},
    {"code": "ABIA", "name": "Abia", "zone": "South East", "totalLgas": 17, "totalPus": 4062, "registeredVoters": 2120808, "latitude": 5.4527, "longitude": 7.5248},
    {"code": "ADAMAWA", "name": "Adamawa", "zone": "North East", "totalLgas": 21, "totalPus": 4104, "registeredVoters": 2196566, "latitude": 9.3265, "longitude": 12.4411},
    {"code": "ENUGU", "name": "Enugu", "zone": "South East", "totalLgas": 17, "totalPus": 4145, "registeredVoters": 2112793, "latitude": 6.5364, "longitude": 7.4383},
    {"code": "FCT", "name": "FCT Abuja", "zone": "North Central", "totalLgas": 6, "totalPus": 2822, "registeredVoters": 1570307, "latitude": 9.0765, "longitude": 7.3986},
    {"code": "KANO", "name": "Kano", "zone": "North West", "totalLgas": 44, "totalPus": 11222, "registeredVoters": 5921370, "latitude": 12.0022, "longitude": 8.5920},
    {"code": "LAGOS", "name": "Lagos", "zone": "South West", "totalLgas": 20, "totalPus": 13325, "registeredVoters": 7060198, "latitude": 6.5244, "longitude": 3.3792},
    {"code": "RIVERS", "name": "Rivers", "zone": "South South", "totalLgas": 23, "totalPus": 6866, "registeredVoters": 3537190, "latitude": 4.8156, "longitude": 7.0498},
]

LGAS = [
    {"code": "OSOGBO", "name": "Osogbo", "stateCode": "OSUN", "totalWards": 15, "totalPus": 240},
    {"code": "EDE_SOUTH", "name": "Ede South", "stateCode": "OSUN", "totalWards": 10, "totalPus": 125},
    {"code": "ILESA_EAST", "name": "Ilesa East", "stateCode": "OSUN", "totalWards": 11, "totalPus": 142},
    {"code": "IFE_CENTRAL", "name": "Ife Central", "stateCode": "OSUN", "totalWards": 11, "totalPus": 160},
    {"code": "LAGOS_ISLAND", "name": "Lagos Island", "stateCode": "LAGOS", "totalWards": 19, "totalPus": 512},
    {"code": "IKEJA", "name": "Ikeja", "stateCode": "LAGOS", "totalWards": 10, "totalPus": 468},
    {"code": "KANO_MUNICIPAL", "name": "Kano Municipal", "stateCode": "KANO", "totalWards": 13, "totalPus": 620},
    {"code": "PORT_HARCOURT", "name": "Port Harcourt", "stateCode": "RIVERS", "totalWards": 20, "totalPus": 780},
    {"code": "ABUJA_MUNICIPAL", "name": "Abuja Municipal (AMAC)", "stateCode": "FCT", "totalWards": 12, "totalPus": 940},
    {"code": "ENUGU_NORTH", "name": "Enugu North", "stateCode": "ENUGU", "totalWards": 13, "totalPus": 380},
]


@router.get("/states")
async def list_states() -> Dict[str, Any]:
    return {"data": STATES, "total": len(STATES)}


@router.get("/lgas")
async def list_lgas(state: Optional[str] = Query(None)) -> Dict[str, Any]:
    filtered = [l for l in LGAS if l["stateCode"] == state] if state else LGAS
    return {"data": filtered, "total": len(filtered)}
