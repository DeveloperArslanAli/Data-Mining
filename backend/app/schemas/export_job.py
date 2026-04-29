"""
Export job schemas
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.export_job import ExportFormat, ExportJobStatus


class ExportJobBase(BaseModel):
    """Base export job schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    export_format: ExportFormat
    
    # Export options
    include_headers: Optional[List[str]] = Field(default_factory=list)
    exclude_headers: Optional[List[str]] = Field(default_factory=list)
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    sorting: Optional[Dict[str, Any]] = Field(default_factory=dict)
    limit_rows: Optional[int] = Field(None, ge=1)


class ExportJobCreate(ExportJobBase):
    """Schema for creating an export job"""
    dataset_id: int = Field(..., gt=0)
    
    # SQL export specific
    table_name: Optional[str] = Field(None, min_length=1, max_length=255)


class ExportJobUpdate(BaseModel):
    """Schema for updating an export job"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    include_headers: Optional[List[str]] = None
    exclude_headers: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None
    sorting: Optional[Dict[str, Any]] = None
    limit_rows: Optional[int] = Field(None, ge=1)
    table_name: Optional[str] = Field(None, min_length=1, max_length=255)


class ExportJobResponse(ExportJobBase):
    """Schema for export job response"""
    id: int
    status: ExportJobStatus
    progress: int = Field(..., ge=0, le=100)
    error_message: Optional[str] = None
    
    # File details
    file_path: Optional[str] = None
    file_size: Optional[int] = None  # Size in bytes
    
    # SQL export specific
    database_schema: Optional[str] = None
    table_name: Optional[str] = None
    
    # Results
    rows_exported: Optional[int] = None
    columns_exported: Optional[int] = None
    
    # Performance metrics
    processing_time: Optional[int] = None  # Time in seconds
    memory_usage: Optional[int] = None  # Memory usage in MB
    
    # Timestamps
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Foreign keys
    dataset_id: int
    user_id: int
    
    class Config:
        from_attributes = True
    
    @property
    def is_completed(self) -> bool:
        """Check if export job is completed"""
        return self.status == ExportJobStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if export job failed"""
        return self.status == ExportJobStatus.FAILED
    
    @property
    def is_in_progress(self) -> bool:
        """Check if export job is in progress"""
        return self.status == ExportJobStatus.PROCESSING
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in MB"""
        if not self.file_size:
            return 0.0
        return self.file_size / (1024 * 1024)
    
    def get_processing_time_minutes(self) -> float:
        """Get processing time in minutes"""
        if not self.processing_time:
            return 0.0
        return self.processing_time / 60.0
    
    def get_export_summary(self) -> Dict[str, Any]:
        """Get export job summary"""
        return {
            "id": self.id,
            "name": self.name,
            "format": self.export_format,
            "status": self.status,
            "progress": self.progress,
            "rows_exported": self.rows_exported,
            "columns_exported": self.columns_exported,
            "file_size_mb": self.file_size_mb,
            "processing_time_minutes": self.get_processing_time_minutes(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class ExportFormatInfo(BaseModel):
    """Schema for export format information"""
    value: str
    label: str
    description: str


class ExportFormatsResponse(BaseModel):
    """Schema for export formats response"""
    formats: List[ExportFormatInfo]


class ExportDownloadInfo(BaseModel):
    """Schema for export download information"""
    job_id: int
    file_path: str
    file_size: int
    format: ExportFormat
    download_url: str


class QuickExportRequest(BaseModel):
    """Schema for quick export request"""
    dataset_id: int = Field(..., gt=0)
    format: ExportFormat
