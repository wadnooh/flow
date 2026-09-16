from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SiteBase(BaseModel):
    name: str
    code: str
    latitude: float
    longitude: float
    radius_meters: float = 150.0
    shift_start: str = "07:00"
    shift_end: str = "16:00"
    description: Optional[str] = None
    is_active: bool = True

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_meters: Optional[float] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SiteOut(SiteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
