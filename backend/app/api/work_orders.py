from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.work_order import WorkOrder
from app.models.team import Team
from app.models.site import Site
from app.models.user import User
from app.schemas.work_order import WorkOrderCreate, WorkOrderUpdate, WorkOrderOut
from app.api.deps import get_current_user, get_current_admin_or_supervisor

router = APIRouter(prefix="/work-orders", tags=["أوامر العمل والتكليفات الميدانية للفرق"])

def format_work_order_out(wo: WorkOrder) -> dict:
    return {
        "id": wo.id,
        "title": wo.title,
        "description": wo.description,
        "site_id": wo.site_id,
        "site_name": wo.site.name if wo.site else None,
        "assigned_team_id": wo.assigned_team_id,
        "assigned_team_name": wo.assigned_team.name if wo.assigned_team else None,
        "created_by_id": wo.created_by_id,
        "created_by_name": wo.created_by.name if wo.created_by else None,
        "priority": wo.priority,
        "status": wo.status,
        "due_date": wo.due_date,
        "completion_notes": wo.completion_notes,
        "created_at": wo.created_at,
        "completed_at": wo.completed_at
    }

@router.get("/")
def list_work_orders(
    site_id: Optional[int] = None,
    team_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WorkOrder)
    if site_id:
        query = query.filter(WorkOrder.site_id == site_id)
    if team_id:
        query = query.filter(WorkOrder.assigned_team_id == team_id)
    if status_filter:
        query = query.filter(WorkOrder.status == status_filter)

    orders = query.order_by(WorkOrder.created_at.desc()).all()
    return [format_work_order_out(wo) for wo in orders]

@router.post("/")
def create_work_order(
    order_in: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_supervisor)
):
    site = db.query(Site).filter(Site.id == order_in.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")

    team = db.query(Team).filter(Team.id == order_in.assigned_team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="الفريق الميداني غير موجود")

    wo = WorkOrder(
        **order_in.model_dump(),
        created_by_id=current_user.id,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return format_work_order_out(wo)

@router.put("/{order_id}")
def update_work_order(
    order_id: int,
    order_update: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="أمر العمل غير موجود")

    if order_update.status:
        wo.status = order_update.status
        if order_update.status == "completed" and not wo.completed_at:
            wo.completed_at = datetime.utcnow()
    if order_update.completion_notes:
        wo.completion_notes = order_update.completion_notes

    db.commit()
    db.refresh(wo)
    return format_work_order_out(wo)
