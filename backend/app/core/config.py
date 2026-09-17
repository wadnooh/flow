import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "نظام متابعة الكهربائية والفرق الميدانية"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-electrical-tracker-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default database (zero-configuration, easy to deploy)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./electrical_field.db")
    
    # CORS: Allow Hostinger production domains (wadnooh.com, 2-aa.com) and local dev
    BACKEND_CORS_ORIGINS: list[str] = [
        "https://wadnooh.com",
        "https://www.wadnooh.com",
        "https://flow.wadnooh.com",
        "http://wadnooh.com",
        "http://www.wadnooh.com",
        "https://2-aa.com",
        "https://www.2-aa.com",
        "http://2-aa.com",
        "http://www.2-aa.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
