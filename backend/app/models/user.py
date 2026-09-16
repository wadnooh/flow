from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="electrician")  # admin, supervisor, electrician
    phone = Column(String(20), nullable=True)
    job_title = Column(String(100), default="فني كهرباء ميداني")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Linked site and team
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site = relationship("Site", back_populates="users")

    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])

    # Relationships
    attendances = relationship("AttendanceRecord", back_populates="user")
    departures = relationship("GeofenceDeparture", back_populates="user")
    electrical_readings = relationship("ElectricalReading", back_populates="recorded_by")
    fault_reports = relationship("FaultReport", back_populates="reported_by")
