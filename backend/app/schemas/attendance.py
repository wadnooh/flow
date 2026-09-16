from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class CheckInRequest(BaseModel):
    latitude: float
    longitude: float
    site_id: Optional[int] = None

class CheckOutRequest(BaseModel):
    latitude: float
    longitude: float

class LocationPingRequest(BaseModel):
    latitude: float
    longitude: float

class GeofenceDepartureOut(BaseModel):
    id: int
    attendance_id: int
    user_id: int
    user_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    departure_time: datetime
    departure_lat: Optional[float] = None
    departure_lon: Optional[float] = None
    departure_distance: Optional[float] = None
    return_time: Optional[datetime] = None
    return_lat: Optional[float] = None
    return_lon: Optional[float] = None
    outside_minutes: int
    is_ongoing: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    date: date
    check_in_time: Optional[datetime] = None
    check_in_lat: Optional[float] = None
    check_in_lon: Optional[float] = None
    check_in_distance: Optional[float] = None
    check_out_time: Optional[datetime] = None
    check_out_lat: Optional[float] = None
    check_out_lon: Optional[float] = None
    check_out_distance: Optional[float] = None
    status: str
    total_work_minutes: int
    departures: List[GeofenceDepartureOut] = []

    class Config:
        from_attributes = True

class GeofenceCheckResponse(BaseModel):
    is_inside: bool
    distance_meters: float
    allowed_radius: float
    distance_difference: float
    status_message: str
    site_name: str
