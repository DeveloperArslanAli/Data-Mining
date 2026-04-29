"""
Configuration settings for the Data Mining Platform
"""

from typing import List, Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # =============================================================================
    # ENVIRONMENT CONFIGURATION
    # =============================================================================
    ENVIRONMENT: str = "development"
    DEBUG: bool = Field(False, env="DEBUG")
    LOG_LEVEL: str = "INFO"
    
    # =============================================================================
    # DATABASE CONFIGURATION
    # =============================================================================
    # Use a sensible default for local dev; can be overridden via env DATABASE_URL
    DATABASE_URL: str = Field("sqlite:///./dev.db", env="DATABASE_URL")
    REDIS_URL: str = "redis://localhost:6379"
    
    @field_validator("DATABASE_URL")
    def validate_database_url(cls, v):
        if not v:
            raise ValueError("DATABASE_URL is required")
        return v
    
    # =============================================================================
    # SECURITY CONFIGURATION
    # =============================================================================
    JWT_SECRET: str | None = Field(None, env="SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 hour
    JWT_REFRESH_EXPIRATION: int = 604800  # 7 days
    
    @model_validator(mode="after")
    def ensure_jwt_secret(self):
        # Provide a safe dev fallback secret if not provided
        if not self.JWT_SECRET:
            if self.ENVIRONMENT == "development" or self.DEBUG:
                self.JWT_SECRET = "dev-secret-key-change-me-please-1234567890abcd"
            else:
                raise ValueError("JWT_SECRET/SECRET_KEY is required in non-development environments")
        if len(self.JWT_SECRET) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long")
        return self
    
    # =============================================================================
    # SERVICE CONFIGURATION
    # =============================================================================
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8090
    BACKEND_URL: str = "http://localhost:8090"
    
    FRONTEND_URL: str = "http://localhost:3050"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8090"
    
    CRAWLING_SERVICE_URL: str = "http://localhost:3001"
    CRAWLING_SERVICE_PORT: int = 3001
    
    ML_ENGINE_URL: str = "http://localhost:8001"
    ML_ENGINE_PORT: int = 8001
    
    # ML Engine Configuration
    ML_ENGINE_TIMEOUT: int = 300  # 5 minutes
    ML_ENGINE_RETRY_ATTEMPTS: int = 3
    ML_ENGINE_RETRY_DELAY: int = 5  # seconds
    
    # =============================================================================
    # FILE STORAGE CONFIGURATION
    # =============================================================================
    STORAGE_PATH: str = "./storage"
    UPLOAD_PATH: str = "./storage/uploads"
    EXPORT_PATH: str = "./storage/exports"
    TEMP_PATH: str = "./storage/temp"
    MAX_FILE_SIZE: int = 1073741824  # 1GB
    ALLOWED_FILE_TYPES: str = "csv,json,xml,xlsx,parquet"
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_FILE_TYPES.split(",")]
    
    # =============================================================================
    # CRAWLING CONFIGURATION
    # =============================================================================
    CRAWL_DELAY: int = 1000  # milliseconds
    CRAWL_TIMEOUT: int = 30000  # milliseconds
    MAX_CONCURRENT_CRAWLS: int = 5
    USER_AGENT: str = "Mozilla/5.0 (compatible; DataMiningBot/1.0)"
    
    # =============================================================================
    # AI/ML CONFIGURATION
    # =============================================================================
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MODEL_NAME: str = "llama2"
    
    # =============================================================================
    # MONITORING CONFIGURATION
    # =============================================================================
    PROMETHEUS_PORT: int = 9090
    GRAFANA_PORT: int = 3001
    LOG_AGGREGATION_URL: Optional[str] = None
    
    # =============================================================================
    # EXTERNAL SERVICES
    # =============================================================================
    SENTRY_DSN: Optional[str] = None
    GOOGLE_ANALYTICS_ID: Optional[str] = None
    
    # =============================================================================
    # EMAIL CONFIGURATION
    # =============================================================================
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@datamining.com"
    
    # =============================================================================
    # CORS CONFIGURATION
    # =============================================================================
    CORS_ORIGINS: str = "http://localhost:3050,http://127.0.0.1:3050"
    CORS_ALLOW_CREDENTIALS: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # =============================================================================
    # RATE LIMITING
    # =============================================================================
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 900  # 15 minutes
    
    # =============================================================================
    # CACHE CONFIGURATION
    # =============================================================================
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000
    
    # =============================================================================
    # TESTING CONFIGURATION
    # =============================================================================
    TEST_DATABASE_URL: str = "postgresql://test_user:test_pass@localhost:5432/datamining_test"
    TEST_REDIS_URL: str = "redis://localhost:6379/1"
    
    # =============================================================================
    # DEVELOPMENT TOOLS
    # =============================================================================
    ENABLE_SWAGGER: bool = True
    ENABLE_DEBUG_TOOLBAR: bool = True
    ENABLE_PROFILING: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure storage directories exist
def ensure_storage_directories():
    """Ensure all storage directories exist"""
    directories = [
        settings.STORAGE_PATH,
        settings.UPLOAD_PATH,
        settings.EXPORT_PATH,
        settings.TEMP_PATH,
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)


# Initialize storage directories
ensure_storage_directories()
