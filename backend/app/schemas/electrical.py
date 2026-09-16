from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ElectricalReadingBase(BaseModel):
    site_id: int
    source_type: str = "شبكة عامة"
    voltage_l1: float = 220.0
    voltage_l2: float = 220.0
    voltage_l3: float = 220.0
    current_l1: float = 0.0
    current_l2: float = 0.0
    current_l3: float = 0.0
    frequency: float = 60.0
    power_factor: float = 0.92
    generator_status: Optional[str] = "متوقف"
    fuel_level_percent: Optional[float] = None
    running_hours: Optional[float] = None
    oil_pressure_bar: Optional[float] = None
    coolant_temp_c: Optional[float] = None
    notes: Optional[str] = None

class ElectricalReadingCreate(ElectricalReadingBase):
    pass

class ElectricalReadingOut(ElectricalReadingBase):
    id: int
    recorded_by_id: int
    recorded_by_name: Optional[str] = None
    site_name: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

class FaultReportBase(BaseModel):
    site_id: int
    title: str
    description: str
    severity: str = "medium"
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class FaultReportCreate(FaultReportBase):
    pass

class FaultReportUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None

class FaultReportOut(FaultReportBase):
    id: int
    reported_by_id: int
    reported_by_name: Optional[str] = None
    site_name: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    class Config:
        from_attributes = True
