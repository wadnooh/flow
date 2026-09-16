from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    code: str
    specialty: str
    color: str = "#0284c7"
    description: Optional[str] = None
    site_id: Optional[int] = None
    leader_id: Optional[int] = None
    is_active: bool = True

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    specialty: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    site_id: Optional[int] = None
    leader_id: Optional[int] = None
    is_active: Optional[bool] = None

class TeamMemberOut(BaseModel):
    id: int
    name: str
    username: str
    job_title: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class TeamOut(TeamBase):
    id: int
    site_name: Optional[str] = None
    leader_name: Optional[str] = None
    members_count: int = 0
    members: List[TeamMemberOut] = []
    created_at: datetime

    class Config:
        from_attributes = True
