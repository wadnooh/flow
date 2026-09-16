from app.schemas.site import SiteBase, SiteCreate, SiteUpdate, SiteOut
from app.schemas.user import UserBase, UserCreate, UserLogin, UserOut, Token
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, LocationPingRequest,
    AttendanceOut, GeofenceDepartureOut, GeofenceCheckResponse
)
from app.schemas.electrical import (
    ElectricalReadingBase, ElectricalReadingCreate, ElectricalReadingOut,
    FaultReportBase, FaultReportCreate, FaultReportUpdate, FaultReportOut
)

__all__ = [
    "SiteBase", "SiteCreate", "SiteUpdate", "SiteOut",
    "UserBase", "UserCreate", "UserLogin", "UserOut", "Token",
    "CheckInRequest", "CheckOutRequest", "LocationPingRequest",
    "AttendanceOut", "GeofenceDepartureOut", "GeofenceCheckResponse",
    "ElectricalReadingBase", "ElectricalReadingCreate", "ElectricalReadingOut",
    "FaultReportBase", "FaultReportCreate", "FaultReportUpdate", "FaultReportOut"
]
