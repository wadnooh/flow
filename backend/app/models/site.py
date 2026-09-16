from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=150.0)  # نصف القطر المسموح به بالأمتار
    shift_start = Column(String(10), default="07:00")  # وقت بداية الدوام
    shift_end = Column(String(10), default="16:00")    # وقت نهاية الدوام
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="site")
    teams = relationship("Team", back_populates="site")
    attendances = relationship("AttendanceRecord", back_populates="site")
    electrical_readings = relationship("ElectricalReading", back_populates="site")
    fault_reports = relationship("FaultReport", back_populates="site")
