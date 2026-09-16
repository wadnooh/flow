from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class AttendanceRecord(Base):
    """
    سجل الحضور والانصراف اليومي للموظف
    """
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)

    # Check-in
    check_in_time = Column(DateTime, nullable=True)
    check_in_lat = Column(Float, nullable=True)
    check_in_lon = Column(Float, nullable=True)
    check_in_distance = Column(Float, nullable=True)

    # Check-out
    check_out_time = Column(DateTime, nullable=True)
    check_out_lat = Column(Float, nullable=True)
    check_out_lon = Column(Float, nullable=True)
    check_out_distance = Column(Float, nullable=True)

    # Status: present (حاضر), late (متأخر), left_early (انصراف مبكر), on_shift (في الدوام)
    status = Column(String(30), default="on_shift")
    total_work_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="attendances")
    site = relationship("Site", back_populates="attendances")
    departures = relationship("GeofenceDeparture", back_populates="attendance", cascade="all, delete-orphan")


class GeofenceDeparture(Base):
    """
    سجل خروج الموظف من نطاق الموقع أثناء فترة الدوام
    يرصد: وقت الخروج، مدة البقاء خارج الموقع، ووقت العودة
    """
    __tablename__ = "geofence_departures"

    id = Column(Integer, primary_key=True, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance_records.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)

    # وقت وإحداثيات الخروج
    departure_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    departure_lat = Column(Float, nullable=True)
    departure_lon = Column(Float, nullable=True)
    departure_distance = Column(Float, nullable=True)

    # وقت وإحداثيات العودة
    return_time = Column(DateTime, nullable=True)
    return_lat = Column(Float, nullable=True)
    return_lon = Column(Float, nullable=True)
    
    # المدة بالدقائق التي قضاها خارج الموقع
    outside_minutes = Column(Integer, default=0)
    is_ongoing = Column(Boolean, default=True)  # True إذا لم يعد بعد
    notes = Column(String(255), nullable=True)

    # Relationships
    attendance = relationship("AttendanceRecord", back_populates="departures")
    user = relationship("User", back_populates="departures")
