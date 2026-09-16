from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.site import Site
from app.models.user import User
from app.models.attendance import AttendanceRecord, GeofenceDeparture
from app.models.electrical import FaultReport, ElectricalReading
from app.api.deps import get_current_user

router = APIRouter(prefix="/stats", tags=["الإحصائيات ولوحة القيادة"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()

    total_sites = db.query(Site).filter(Site.is_active == True).count()
    total_technicians = db.query(User).filter(User.role == "electrician", User.is_active == True).count()

    # الحاضرون اليوم
    today_attendances = db.query(AttendanceRecord).filter(AttendanceRecord.date == today).all()
    checked_in_count = len([a for a in today_attendances if a.check_in_time is not None])
    
    # المتواجدون حالياً بالمواقع
    currently_on_shift = len([a for a in today_attendances if a.check_in_time is not None and a.check_out_time is None])

    # الخارجون عن النطاق حالياً أثناء الدوام
    active_departures = db.query(GeofenceDeparture).filter(GeofenceDeparture.is_ongoing == True).count()

    # الأعطال المفتوحة
    open_faults = db.query(FaultReport).filter(FaultReport.status == "open").count()
    critical_faults = db.query(FaultReport).filter(FaultReport.status == "open", FaultReport.severity == "critical").count()

    # آخر القراءات المسجلة
    latest_readings_count = db.query(ElectricalReading).count()

    return {
        "total_sites": total_sites,
        "total_technicians": total_technicians,
        "checked_in_today": checked_in_count,
        "currently_on_shift": currently_on_shift,
        "currently_outside_geofence": active_departures,
        "open_faults": open_faults,
        "critical_faults": critical_faults,
        "total_readings_count": latest_readings_count
    }
