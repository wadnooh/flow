from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensures all models are registered

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="نظام متابعة الكهربائية والفرق الميدانية بمواقع العمل",
    description="نظام متكامل لتتبع فنيي الكهرباء بنظام الـ Geofencing والـ GPS ومتابعة الأعمال الكهربائية والمولدات",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api.auth import router as auth_router
from app.api.sites import router as sites_router
from app.api.teams import router as teams_router
from app.api.attendance import router as attendance_router
from app.api.electrical import router as electrical_router
from app.api.work_orders import router as work_orders_router
from app.api.stats import router as stats_router

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(sites_router, prefix=settings.API_V1_STR)
app.include_router(teams_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(electrical_router, prefix=settings.API_V1_STR)
app.include_router(work_orders_router, prefix=settings.API_V1_STR)
app.include_router(stats_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "نظام متابعة الكهربائية ومواقع العمل الميدانية",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
