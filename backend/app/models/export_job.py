"""
ExportJob model for tracking data export operations and results
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ExportFormat(str, enum.Enum):
    """Supported export formats"""
    CSV = "csv"
    JSON = "json"
    XML = "xml"
    XLSX = "xlsx"
    PARQUET = "parquet"
    SQL = "sql"


class ExportJobStatus(str, enum.Enum):
    """Status of export jobs"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExportJob(Base):
    """ExportJob model for tracking data export operations and results"""
    
    __tablename__ = "export_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Export configuration
    export_format = Column(Enum(ExportFormat), nullable=False)
    file_path = Column(String, nullable=True)  # Path to exported file
    file_size = Column(Integer, nullable=True)  # Size in bytes
    
    # Export options
    include_headers = Column(JSON, nullable=True)  # Columns to include
    exclude_headers = Column(JSON, nullable=True)  # Columns to exclude
    filters = Column(JSON, nullable=True)  # Data filters
    sorting = Column(JSON, nullable=True)  # Sorting configuration
    limit_rows = Column(Integer, nullable=True)  # Row limit for export
    
    # SQL export specific
    database_schema = Column(Text, nullable=True)  # Generated SQL schema
    table_name = Column(String, nullable=True)  # Target table name
    
    # Status and progress
    status = Column(Enum(ExportJobStatus), default=ExportJobStatus.PENDING, nullable=False)
    progress = Column(Integer, default=0, nullable=False)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Results
    rows_exported = Column(Integer, nullable=True)
    columns_exported = Column(Integer, nullable=True)
    
    # Performance metrics
    processing_time = Column(Integer, nullable=True)  # Time in seconds
    memory_usage = Column(Integer, nullable=True)  # Memory usage in MB
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Foreign keys
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="export_jobs")
    user = relationship("User", back_populates="export_jobs")
    
    def __repr__(self):
        return f"<ExportJob(id={self.id}, name='{self.name}', format='{self.export_format}', status='{self.status}')>"
    
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
    
    def get_export_summary(self) -> dict:
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
