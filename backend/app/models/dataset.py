"""
Dataset model for storing dataset metadata and processing information
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DatasetStatus(str, enum.Enum):
    """Dataset processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    CLEANED = "cleaned"
    ERROR = "error"
    EXPORTED = "exported"


class DatasetFormat(str, enum.Enum):
    """Supported dataset formats"""
    CSV = "csv"
    JSON = "json"
    XML = "xml"
    XLSX = "xlsx"
    PARQUET = "parquet"


class Dataset(Base):
    """Dataset model for storing dataset metadata and processing information"""
    
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    format = Column(Enum(DatasetFormat), nullable=False)
    
    # Dataset metadata
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    column_names = Column(JSON, nullable=True)  # List of column names
    data_types = Column(JSON, nullable=True)  # Column data types mapping
    sample_data = Column(JSON, nullable=True)  # First few rows for preview
    
    # Processing status
    status = Column(Enum(DatasetStatus), default=DatasetStatus.UPLOADED, nullable=False)
    processing_progress = Column(Integer, default=0, nullable=False)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Quality metrics
    missing_values_count = Column(JSON, nullable=True)  # Column-wise missing values
    duplicate_rows_count = Column(Integer, nullable=True)
    outlier_count = Column(JSON, nullable=True)  # Column-wise outliers
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="datasets")
    cleaning_operations = relationship("CleaningOperation", back_populates="dataset", cascade="all, delete-orphan")
    export_jobs = relationship("ExportJob", back_populates="dataset", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Dataset(id={self.id}, name='{self.name}', status='{self.status}')>"
    
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
