import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    
    # Database configuration - PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/leapfrog"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    RATELIMIT_DEFAULT = os.getenv("RATE_LIMITS", "5 per second")

class DevelopmentConfig(BaseConfig):
    DEBUG = True

class ProductionConfig(BaseConfig):
    DEBUG = False


def get_config(name: str | None = None):
    env = name or os.getenv("FLASK_ENV", "development")
    return DevelopmentConfig if env == "development" else ProductionConfig
