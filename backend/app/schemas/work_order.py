from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WorkOrderBase(BaseModel):
    title: str
    description: str
    site_id: int
    assigned_team_id: int
    priority: str = "normal"
    due_date: Optional[datetime] = None

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    completion_notes: Optional[str] = None

class WorkOrderOut(WorkOrderBase):
    id: int
    created_by_id: int
    created_by_name: Optional[str] = None
    site_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    status: str
    completion_notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
