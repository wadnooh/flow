from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.team import Team
from app.models.user import User
from app.models.site import Site
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut
from app.api.deps import get_current_user, get_current_admin_or_supervisor

router = APIRouter(prefix="/teams", tags=["إدارة وتفريق الفرق الميدانية"])

def format_team_out(team: Team) -> dict:
    members = []
    for m in team.members:
        members.append({
            "id": m.id,
            "name": m.name,
            "username": m.username,
            "job_title": m.job_title,
            "phone": m.phone
        })

    return {
        "id": team.id,
        "name": team.name,
        "code": team.code,
        "specialty": team.specialty,
        "color": team.color,
        "description": team.description,
        "site_id": team.site_id,
        "site_name": team.site.name if team.site else None,
        "leader_id": team.leader_id,
        "leader_name": team.leader.name if team.leader else None,
        "members_count": len(members),
        "members": members,
        "is_active": team.is_active,
        "created_at": team.created_at
    }

@router.get("/")
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teams = db.query(Team).filter(Team.is_active == True).all()
    return [format_team_out(t) for t in teams]

@router.post("/")
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    existing = db.query(Team).filter(Team.code == team_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="كود الفريق مسجل مسبقاً")

    team = Team(**team_in.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return format_team_out(team)

@router.put("/{team_id}")
def update_team(
    team_id: int,
    team_in: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="الفريق الميداني غير موجود")

    for field, value in team_in.model_dump(exclude_unset=True).items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)
    return format_team_out(team)

@router.post("/{team_id}/assign-member")
def assign_member_to_team(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="الفريق الميداني غير موجود")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم / الفني غير موجود")

    user.team_id = team.id
    if team.site_id:
        user.site_id = team.site_id

    db.commit()
    return {"message": f"تم إسناد الفني {user.name} إلى فريق {team.name} بنجاح"}
