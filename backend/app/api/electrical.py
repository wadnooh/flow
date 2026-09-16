from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.electrical import ElectricalReading, FaultReport
from app.models.user import User
from app.models.site import Site
from app.schemas.electrical import (
    ElectricalReadingCreate, ElectricalReadingOut,
    FaultReportCreate, FaultReportUpdate, FaultReportOut
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/electrical", tags=["متابعة الأعمال الكهربائية والمولدات"])

def format_reading_out(r: ElectricalReading) -> dict:
    return {
        "id": r.id,
        "site_id": r.site_id,
        "site_name": r.site.name if r.site else None,
        "recorded_by_id": r.recorded_by_id,
        "recorded_by_name": r.recorded_by.name if r.recorded_by else None,
        "recorded_at": r.recorded_at,
        "source_type": r.source_type,
        "voltage_l1": r.voltage_l1,
        "voltage_l2": r.voltage_l2,
        "voltage_l3": r.voltage_l3,
        "current_l1": r.current_l1,
        "current_l2": r.current_l2,
        "current_l3": r.current_l3,
        "frequency": r.frequency,
        "power_factor": r.power_factor,
        "generator_status": r.generator_status,
        "fuel_level_percent": r.fuel_level_percent,
        "running_hours": r.running_hours,
        "oil_pressure_bar": r.oil_pressure_bar,
        "coolant_temp_c": r.coolant_temp_c,
        "notes": r.notes
    }

def format_fault_out(f: FaultReport) -> dict:
    return {
        "id": f.id,
        "site_id": f.site_id,
        "site_name": f.site.name if f.site else None,
        "reported_by_id": f.reported_by_id,
        "reported_by_name": f.reported_by.name if f.reported_by else None,
        "title": f.title,
        "description": f.description,
        "severity": f.severity,
        "status": f.status,
        "image_url": f.image_url,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "created_at": f.created_at,
        "resolved_at": f.resolved_at,
        "resolution_notes": f.resolution_notes
    }

@router.get("/readings")
def get_readings(
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ElectricalReading)
    if site_id:
        query = query.filter(ElectricalReading.site_id == site_id)
    readings = query.order_by(ElectricalReading.recorded_at.desc()).limit(100).all()
    return [format_reading_out(r) for r in readings]

@router.post("/readings")
def add_reading(
    reading_in: ElectricalReadingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).filter(Site.id == reading_in.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")

    reading = ElectricalReading(
        **reading_in.model_dump(),
        recorded_by_id=current_user.id,
        recorded_at=datetime.utcnow()
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return format_reading_out(reading)

@router.get("/faults")
def get_faults(
    site_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FaultReport)
    if site_id:
        query = query.filter(FaultReport.site_id == site_id)
    if status_filter:
        query = query.filter(FaultReport.status == status_filter)
    faults = query.order_by(FaultReport.created_at.desc()).limit(100).all()
    return [format_fault_out(f) for f in faults]

@router.post("/faults")
def report_fault(
    fault_in: FaultReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).filter(Site.id == fault_in.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")

    fault = FaultReport(
        **fault_in.model_dump(),
        reported_by_id=current_user.id,
        status="open",
        created_at=datetime.utcnow()
    )
    db.add(fault)
    db.commit()
    db.refresh(fault)
    return format_fault_out(fault)

@router.put("/faults/{fault_id}")
def update_fault(
    fault_id: int,
    fault_update: FaultReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fault = db.query(FaultReport).filter(FaultReport.id == fault_id).first()
    if not fault:
        raise HTTPException(status_code=404, detail="بلاغ العطل غير موجود")

    if fault_update.status:
        fault.status = fault_update.status
        if fault_update.status == "resolved" and not fault.resolved_at:
            fault.resolved_at = datetime.utcnow()
    if fault_update.resolution_notes:
        fault.resolution_notes = fault_update.resolution_notes

    db.commit()
    db.refresh(fault)
    return format_fault_out(fault)
