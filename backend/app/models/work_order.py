from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class WorkOrder(Base):
    """
    نموذج أوامر العمل والتكليفات الميدانية للفرق
    """
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)

    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    assigned_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    priority = Column(String(30), default="normal") # urgent (عاجل), high (مرتفع), normal (عادي)
    status = Column(String(30), default="pending")   # pending (قيد الانتظار), in_progress (قيد التنفيذ), completed (مكتمل)

    due_date = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    site = relationship("Site")
    assigned_team = relationship("Team")
    created_by = relationship("User")
