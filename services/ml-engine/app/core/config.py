"""
ML Engine Service Configuration
"""

from typing import List, Optional
from pydantic import BaseSettings, validator
import os


class Settings(BaseSettings):
    """ML Engine Service settings"""
    
    # =============================================================================
    # SERVICE CONFIGURATION
    # =============================================================================
    BACKEND_HOST: str = "0.0.0.0"
    ML_ENGINE_PORT: int = 8001
    
    # =============================================================================
    # FILE STORAGE CONFIGURATION
    # =============================================================================
    STORAGE_PATH: str = "./storage"
    TEMP_PATH: str = "./storage/temp"
    MODEL_PATH: str = "./storage/models"
    CACHE_PATH: str = "./storage/cache"
    
    # =============================================================================
    # ML CONFIGURATION
    # =============================================================================
    MAX_DATASET_SIZE: int = 1073741824  # 1GB
    MAX_MEMORY_USAGE: int = 8589934592  # 8GB
    PROCESSING_TIMEOUT: int = 300  # 5 minutes
    
    # ML Algorithm Parameters
    OUTLIER_DETECTION_METHOD: str = "iqr"  # iqr, zscore, isolation_forest
    MISSING_VALUE_STRATEGY: str = "auto"  # auto, drop, fill
    DUPLICATE_DETECTION_THRESHOLD: float = 0.95
    CORRELATION_THRESHOLD: float = 0.8
    
    # =============================================================================
    # AI/ML CONFIGURATION
    # =============================================================================
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MODEL_NAME: str = "llama2"
    
    # =============================================================================
    # CACHE CONFIGURATION
    # =============================================================================
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000
    
    # =============================================================================
    # MONITORING CONFIGURATION
    # =============================================================================
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9091
    
    # =============================================================================
    # CORS CONFIGURATION
    # =============================================================================
    CORS_ORIGINS: str = "http://localhost:3050,http://127.0.0.1:3050,http://localhost:8090"
    CORS_ALLOW_CREDENTIALS: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # =============================================================================
    # VALIDATORS
    # =============================================================================
    @validator("OUTLIER_DETECTION_METHOD")
    def validate_outlier_method(cls, v):
        allowed_methods = ["iqr", "zscore", "isolation_forest", "local_outlier_factor"]
        if v not in allowed_methods:
            raise ValueError(f"Outlier detection method must be one of: {allowed_methods}")
        return v
    
    @validator("MISSING_VALUE_STRATEGY")
    def validate_missing_strategy(cls, v):
        allowed_strategies = ["auto", "drop", "fill", "interpolate"]
        if v not in allowed_strategies:
            raise ValueError(f"Missing value strategy must be one of: {allowed_strategies}")
        return v
    
    @validator("DUPLICATE_DETECTION_THRESHOLD")
    def validate_duplicate_threshold(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Duplicate detection threshold must be between 0.0 and 1.0")
        return v
    
    @validator("CORRELATION_THRESHOLD")
    def validate_correlation_threshold(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Correlation threshold must be between 0.0 and 1.0")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
