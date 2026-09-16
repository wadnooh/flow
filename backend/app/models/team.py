from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Team(Base):
    """
    نموذج الفرق الميدانية وتصنيفاتها وتخصصاتها الكهربائية
    """
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # مثال: فريق طوارئ الشبكات
    code = Column(String(50), unique=True, index=True) # مثال: TEAM-EMERG-01
    specialty = Column(String(100), nullable=False) # طوارئ شبكات، صيانة مولدات، تمديدات، محطات تحويل
    color = Column(String(20), default="#0284c7") # لون تمييز الفريق على الخريطة واللوحة
    description = Column(String(255), nullable=True)

    # موقع العمل الرئيسي للفريق
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site = relationship("Site", back_populates="teams")

    # قائد الفريق
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    leader = relationship("User", foreign_keys=[leader_id])

    # أعضاء الفريق
    members = relationship("User", back_populates="team", foreign_keys="User.team_id")

    # البلاغات والمهام الموجهة للفريق
    assigned_faults = relationship("FaultReport", back_populates="assigned_team")

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
