from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.attendance import AttendanceRecord
from app.schemas.site import SiteCreate, SiteUpdate, SiteOut
from app.api.deps import get_current_user, get_current_admin_or_supervisor

router = APIRouter(prefix="/sites", tags=["إدارة مواقع العمل والنطاق الجغرافي"])

@router.get("/")
def list_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sites = db.query(Site).filter(Site.is_active == True).all()
    today = date.today()
    result = []
    for s in sites:
        # عدد الفنيين المربوطين بالموقع
        assigned_technicians = len(s.users)
        # عدد المتواجدين حالياً في الموقع اليوم
        present_now = db.query(AttendanceRecord).filter(
            AttendanceRecord.site_id == s.id,
            AttendanceRecord.date == today,
            AttendanceRecord.check_out_time.is_(None)
        ).count()

        result.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "radius_meters": s.radius_meters,
            "shift_start": s.shift_start,
            "shift_end": s.shift_end,
            "description": s.description,
            "is_active": s.is_active,
            "assigned_technicians": assigned_technicians,
            "present_now": present_now,
            "created_at": s.created_at
        })
    return result

@router.post("/", response_model=SiteOut)
def create_site(
    site_in: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    existing = db.query(Site).filter(Site.code == site_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="كود الموقع مسجل مسبقاً")

    site = Site(**site_in.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
    return site

@router.put("/{site_id}", response_model=SiteOut)
def update_site(
    site_id: int,
    site_in: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")

    for field, value in site_in.model_dump(exclude_unset=True).items():
        setattr(site, field, value)

    db.commit()
    db.refresh(site)
    return site
