"""
Dataset-related Pydantic schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator

from app.models.dataset import DatasetStatus, DatasetFormat


class DatasetBase(BaseModel):
    """Base dataset schema"""
    name: str
    description: Optional[str] = None


class DatasetCreate(DatasetBase):
    """Schema for creating a new dataset"""
    filename: str
    file_path: str
    file_size: int
    format: DatasetFormat
    
    @field_validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Dataset name cannot be empty')
        return v.strip()
    
    @field_validator('file_size')
    def validate_file_size(cls, v):
        if v <= 0:
            raise ValueError('File size must be positive')
        return v


class DatasetUpdate(BaseModel):
    """Schema for updating dataset information"""
    name: Optional[str] = None
    description: Optional[str] = None
    
    @field_validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 1:
            raise ValueError('Dataset name cannot be empty')
        return v.strip() if v is not None else v


class DatasetResponse(DatasetBase):
    """Schema for dataset response"""
    id: int
    filename: str
    file_path: str
    file_size: int
    format: DatasetFormat
    
    # Dataset metadata
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    column_names: Optional[List[str]] = None
    data_types: Optional[Dict[str, str]] = None
    sample_data: Optional[List[Dict[str, Any]]] = None
    
    # Processing status
    status: DatasetStatus
    processing_progress: int
    error_message: Optional[str] = None
    
    # Quality metrics
    missing_values_count: Optional[Dict[str, int]] = None
    duplicate_rows_count: Optional[int] = None
    outlier_count: Optional[Dict[str, int]] = None
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    
    # Owner information
    owner_id: int
    
    class Config:
        from_attributes = True
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in MB"""
        return self.file_size / (1024 * 1024)
    
    @property
    def is_processed(self) -> bool:
        """Check if dataset has been processed"""
        return self.status in [DatasetStatus.CLEANED, DatasetStatus.EXPORTED]
    
    @property
    def has_quality_issues(self) -> bool:
        """Check if dataset has quality issues"""
        if not self.missing_values_count and not self.duplicate_rows_count:
            return False
        
        total_missing = sum(self.missing_values_count.values()) if self.missing_values_count else 0
        total_duplicates = self.duplicate_rows_count or 0
        
        return total_missing > 0 or total_duplicates > 0
    
    def get_quality_score(self) -> float:
        """Calculate dataset quality score (0-100)"""
        if not self.row_count:
            return 0.0
        
        score = 100.0
        
        # Deduct points for missing values
        if self.missing_values_count:
            total_missing = sum(self.missing_values_count.values())
            missing_percentage = (total_missing / (self.row_count * self.column_count)) * 100
            score -= missing_percentage * 0.5  # 0.5 points per percentage
        
        # Deduct points for duplicates
        if self.duplicate_rows_count:
            duplicate_percentage = (self.duplicate_rows_count / self.row_count) * 100
            score -= duplicate_percentage * 0.3  # 0.3 points per percentage
        
        return max(0.0, score)


class DatasetList(BaseModel):
    """Schema for dataset list response"""
    datasets: List[DatasetResponse]
    total: int
    page: int
    size: int
    pages: int


class DatasetPreview(BaseModel):
    """Schema for dataset preview"""
    id: int
    name: str
    format: DatasetFormat
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    column_names: Optional[List[str]] = None
    sample_data: Optional[List[Dict[str, Any]]] = None
    status: DatasetStatus
    quality_score: Optional[float] = None


class DatasetQualityReport(BaseModel):
    """Schema for dataset quality report"""
    dataset_id: int
    total_rows: int
    total_columns: int
    missing_values: Dict[str, int]
    duplicate_rows: int
    outliers: Dict[str, int]
    quality_score: float
    recommendations: List[str]
    generated_at: datetime


class DatasetUploadResponse(BaseModel):
    """Schema for dataset upload response"""
    dataset: DatasetResponse
    message: str
    processing_started: bool
