from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ElectricalReading(Base):
    """
    سجل قراءات الكهرباء والأحمال للموقع
    """
    __tablename__ = "electrical_readings"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # مصدر التغذية (شبكة عامة، مولد ديزل، طاقة شمسية، نظام هجين)
    source_type = Column(String(50), default="شبكة عامة")
    
    # الجهد (Volts)
    voltage_l1 = Column(Float, default=220.0)
    voltage_l2 = Column(Float, default=220.0)
    voltage_l3 = Column(Float, default=220.0)

    # التيار (Amperes)
    current_l1 = Column(Float, default=0.0)
    current_l2 = Column(Float, default=0.0)
    current_l3 = Column(Float, default=0.0)

    # التردد ومعامل القدرة
    frequency = Column(Float, default=60.0)  # Hz
    power_factor = Column(Float, default=0.92)

    # بيانات المولد (إن وجد)
    generator_status = Column(String(30), default="متوقف")  # يعمل، متوقف، تحت الصيانة
    fuel_level_percent = Column(Float, nullable=True)      # نسبة الوقود 0 - 100%
    running_hours = Column(Float, nullable=True)          # ساعات التشغيل التراكمية
    oil_pressure_bar = Column(Float, nullable=True)       # ضغط الزيت
    coolant_temp_c = Column(Float, nullable=True)         # حرارة سائل التبريد

    notes = Column(Text, nullable=True)

    # Relationships
    site = relationship("Site", back_populates="electrical_readings")
    recorded_by = relationship("User", back_populates="electrical_readings")


class FaultReport(Base):
    """
    بلاغات الأعطال الكهربائية الميدانية
    """
    __tablename__ = "fault_reports"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(30), default="medium")  # low, medium, high, critical
    status = Column(String(30), default="open")      # open, in_progress, resolved
    
    image_url = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    site = relationship("Site", back_populates="fault_reports")
    reported_by = relationship("User", back_populates="fault_reports")
    assigned_team = relationship("Team", back_populates="assigned_faults")
