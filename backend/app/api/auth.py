from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.site import Site
from app.schemas.user import UserCreate, UserOut, Token, UserLogin
from app.api.deps import get_current_user, get_current_admin_or_supervisor

router = APIRouter(prefix="/auth", tags=["التوثيق والمستخدمين"])

def format_user_out(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "role": user.role,
        "phone": user.phone,
        "job_title": user.job_title,
        "site_id": user.site_id,
        "site_name": user.site.name if user.site else None,
        "is_active": user.is_active,
        "created_at": user.created_at
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="هذا الحساب معطل")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.username, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_out(user)
    }

@router.post("/login/json", response_model=Token)
def login_json(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="هذا الحساب معطل")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.username, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_out(user)
    }

@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return format_user_out(current_user)

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_supervisor)):
    users = db.query(User).all()
    return [format_user_out(u) for u in users]

@router.post("/users")
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_supervisor)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم مسجل مسبقاً")

    db_user = User(
        name=user_in.name,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone,
        job_title=user_in.job_title,
        site_id=user_in.site_id,
        is_active=user_in.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return format_user_out(db_user)
