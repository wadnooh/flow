from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.geofence import check_geofence, calculate_haversine_distance
from app.models.site import Site
from app.models.user import User
from app.models.attendance import AttendanceRecord, GeofenceDeparture
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, LocationPingRequest,
    AttendanceOut, GeofenceDepartureOut, GeofenceCheckResponse
)
from app.api.deps import get_current_user, get_current_admin_or_supervisor

router = APIRouter(prefix="/attendance", tags=["الحضور والانصراف والنطاق الجغرافي"])

def format_attendance_out(att: AttendanceRecord) -> dict:
    departures_list = []
    for dep in att.departures:
        departures_list.append({
            "id": dep.id,
            "attendance_id": dep.attendance_id,
            "user_id": dep.user_id,
            "user_name": dep.user.name if dep.user else None,
            "site_id": dep.site_id,
            "site_name": dep.attendance.site.name if dep.attendance and dep.attendance.site else None,
            "departure_time": dep.departure_time,
            "departure_lat": dep.departure_lat,
            "departure_lon": dep.departure_lon,
            "departure_distance": dep.departure_distance,
            "return_time": dep.return_time,
            "return_lat": dep.return_lat,
            "return_lon": dep.return_lon,
            "outside_minutes": dep.outside_minutes,
            "is_ongoing": dep.is_ongoing,
            "notes": dep.notes
        })

    return {
        "id": att.id,
        "user_id": att.user_id,
        "user_name": att.user.name if att.user else None,
        "site_id": att.site_id,
        "site_name": att.site.name if att.site else None,
        "date": att.date,
        "check_in_time": att.check_in_time,
        "check_in_lat": att.check_in_lat,
        "check_in_lon": att.check_in_lon,
        "check_in_distance": att.check_in_distance,
        "check_out_time": att.check_out_time,
        "check_out_lat": att.check_out_lat,
        "check_out_lon": att.check_out_lon,
        "check_out_distance": att.check_out_distance,
        "status": att.status,
        "total_work_minutes": att.total_work_minutes,
        "departures": departures_list
    }

@router.post("/check-geofence", response_model=GeofenceCheckResponse)
def verify_geofence_status(
    latitude: float,
    longitude: float,
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_site_id = site_id or current_user.site_id
    if not target_site_id:
        raise HTTPException(status_code=400, detail="لم يتم تحديد موقع العمل للمستخدم")

    site = db.query(Site).filter(Site.id == target_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")

    result = check_geofence(
        user_lat=latitude,
        user_lon=longitude,
        site_lat=site.latitude,
        site_lon=site.longitude,
        radius_meters=site.radius_meters
    )
    result["site_name"] = site.name
    return result

@router.post("/check-in")
def check_in(
    data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_site_id = data.site_id or current_user.site_id
    if not target_site_id:
        raise HTTPException(status_code=400, detail="المستخدم غير مرتبط بأي موقع عمل")

    site = db.query(Site).filter(Site.id == target_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")

    today = date.today()
    # التحقق من وجود تسجيل حضور سابق لنفس اليوم
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.date == today
    ).first()

    if existing_record and existing_record.check_in_time:
        if existing_record.check_out_time:
            raise HTTPException(status_code=400, detail="تم تسجيل الحضور والانصراف لهذا اليوم مسبقاً")
        return {
            "message": "أنت مسجل حضور بالفعل لهذا اليوم",
            "attendance": format_attendance_out(existing_record)
        }

    # التحقق الصارم من النطاق الجغرافي
    geofence_result = check_geofence(
        user_lat=data.latitude,
        user_lon=data.longitude,
        site_lat=site.latitude,
        site_lon=site.longitude,
        radius_meters=site.radius_meters
    )

    if not geofence_result["is_inside"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=geofence_result["status_message"]
        )

    # إنشاء سجل الحضور
    now = datetime.utcnow()
    att_record = AttendanceRecord(
        user_id=current_user.id,
        site_id=site.id,
        date=today,
        check_in_time=now,
        check_in_lat=data.latitude,
        check_in_lon=data.longitude,
        check_in_distance=geofence_result["distance_meters"],
        status="on_shift"
    )
    db.add(att_record)
    db.commit()
    db.refresh(att_record)

    return {
        "success": True,
        "message": f"تم تسجيل الحضور بنجاح في موقع: {site.name}",
        "attendance": format_attendance_out(att_record)
    }

@router.post("/check-out")
def check_out(
    data: CheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    att_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.date == today
    ).first()

    if not att_record or not att_record.check_in_time:
        raise HTTPException(status_code=400, detail="لم يتم تسجيل الحضور اليوم لتتمكن من الانصراف")

    if att_record.check_out_time:
        raise HTTPException(status_code=400, detail="تم تسجيل الانصراف مسبقاً لهذا اليوم")

    site = db.query(Site).filter(Site.id == att_record.site_id).first()
    distance = calculate_haversine_distance(data.latitude, data.longitude, site.latitude, site.longitude)

    # إن كان الموظف خارج النطاق، يسمح بالانصراف لكن يسجل تنبيه والمسافة
    now = datetime.utcnow()
    work_delta = now - att_record.check_in_time
    total_minutes = int(work_delta.total_seconds() / 60)

    # إذا كان هناك خروج مستمر، يتم إغلاقه
    active_departure = db.query(GeofenceDeparture).filter(
        GeofenceDeparture.attendance_id == att_record.id,
        GeofenceDeparture.is_ongoing == True
    ).first()
    if active_departure:
        active_departure.return_time = now
        active_departure.outside_minutes = int((now - active_departure.departure_time).total_seconds() / 60)
        active_departure.is_ongoing = False

    att_record.check_out_time = now
    att_record.check_out_lat = data.latitude
    att_record.check_out_lon = data.longitude
    att_record.check_out_distance = distance
    att_record.total_work_minutes = total_minutes
    att_record.status = "present"

    db.commit()
    db.refresh(att_record)

    return {
        "success": True,
        "message": f"تم تسجيل الانصراف بنجاح. إجمالي وقت العمل: {total_minutes // 60} ساعة و {total_minutes % 60} دقيقة",
        "attendance": format_attendance_out(att_record)
    }

@router.post("/ping-location")
def ping_location(
    data: LocationPingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إرسال إحداثيات الموظف الدورية أثناء وقت الدوام لرصد الخروج من النطاق والمدة
    """
    today = date.today()
    att_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.date == today,
        AttendanceRecord.check_out_time.is_(None)
    ).first()

    if not att_record:
        return {"status": "inactive", "message": "لا يوجد دوام نشط حالياً"}

    site = db.query(Site).filter(Site.id == att_record.site_id).first()
    geofence = check_geofence(
        user_lat=data.latitude,
        user_lon=data.longitude,
        site_lat=site.latitude,
        site_lon=site.longitude,
        radius_meters=site.radius_meters
    )

    now = datetime.utcnow()
    active_departure = db.query(GeofenceDeparture).filter(
        GeofenceDeparture.attendance_id == att_record.id,
        GeofenceDeparture.is_ongoing == True
    ).first()

    status_code_note = "inside"

    if not geofence["is_inside"]:
        # الموظف خارج النطاق!
        status_code_note = "outside"
        if not active_departure:
            # لم يكن مسجلاً كخارج الموقع، نسجل حدث خروج جديد
            new_departure = GeofenceDeparture(
                attendance_id=att_record.id,
                user_id=current_user.id,
                site_id=site.id,
                departure_time=now,
                departure_lat=data.latitude,
                departure_lon=data.longitude,
                departure_distance=geofence["distance_meters"],
                is_ongoing=True,
                notes=f"تم رصد خروج عن الموقع بمسافة {geofence['distance_meters']:.0f}م"
            )
            db.add(new_departure)
            db.commit()
    else:
        # الموظف داخل النطاق
        if active_departure:
            # كان بالخارج وعاد الآن، نغلق فترة الخروج ونحسب المدة
            minutes_outside = max(1, int((now - active_departure.departure_time).total_seconds() / 60))
            active_departure.return_time = now
            active_departure.return_lat = data.latitude
            active_departure.return_lon = data.longitude
            active_departure.outside_minutes = minutes_outside
            active_departure.is_ongoing = False
            db.commit()
            status_code_note = "returned"

    return {
        "status": status_code_note,
        "is_inside": geofence["is_inside"],
        "distance_meters": geofence["distance_meters"],
        "allowed_radius": site.radius_meters,
        "has_active_departure": not geofence["is_inside"]
    }

@router.get("/today")
def get_today_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.date == today
    ).first()

    site = current_user.site
    site_info = None
    if site:
        site_info = {
            "id": site.id,
            "name": site.name,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "radius_meters": site.radius_meters,
            "shift_start": site.shift_start,
            "shift_end": site.shift_end
        }

    return {
        "site": site_info,
        "attendance": format_attendance_out(record) if record else None
    }

@router.get("/records")
def get_attendance_records(
    site_id: Optional[int] = None,
    user_id: Optional[int] = None,
    filter_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    query = db.query(AttendanceRecord)
    if site_id:
        query = query.filter(AttendanceRecord.site_id == site_id)
    if user_id:
        query = query.filter(AttendanceRecord.user_id == user_id)
    if filter_date:
        query = query.filter(AttendanceRecord.date == filter_date)

    records = query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.id.desc()).limit(100).all()
    return [format_attendance_out(r) for r in records]

@router.get("/departures")
def get_departures(
    site_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    query = db.query(GeofenceDeparture)
    if site_id:
        query = query.filter(GeofenceDeparture.site_id == site_id)
    if user_id:
        query = query.filter(GeofenceDeparture.user_id == user_id)

    deps = query.order_by(GeofenceDeparture.departure_time.desc()).limit(100).all()
    result = []
    for d in deps:
        result.append({
            "id": d.id,
            "attendance_id": d.attendance_id,
            "user_id": d.user_id,
            "user_name": d.user.name if d.user else None,
            "site_id": d.site_id,
            "site_name": d.attendance.site.name if d.attendance and d.attendance.site else None,
            "departure_time": d.departure_time,
            "departure_lat": d.departure_lat,
            "departure_lon": d.departure_lon,
            "departure_distance": d.departure_distance,
            "return_time": d.return_time,
            "return_lat": d.return_lat,
            "return_lon": d.return_lon,
            "outside_minutes": d.outside_minutes,
            "is_ongoing": d.is_ongoing,
            "notes": d.notes
        })
    return result
