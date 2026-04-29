"""
CleaningOperation model for tracking data cleaning operations and results
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class CleaningOperationType(str, enum.Enum):
    """Types of cleaning operations"""
    REMOVE_DUPLICATES = "remove_duplicates"
    HANDLE_MISSING_VALUES = "handle_missing_values"
    REMOVE_OUTLIERS = "remove_outliers"
    DATA_TYPE_CONVERSION = "data_type_conversion"
    STRING_CLEANING = "string_cleaning"
    NORMALIZATION = "normalization"
    ENCODING = "encoding"
    CUSTOM_TRANSFORMATION = "custom_transformation"


class CleaningOperationStatus(str, enum.Enum):
    """Status of cleaning operations"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CleaningOperation(Base):
    """CleaningOperation model for tracking data cleaning operations and results"""
    
    __tablename__ = "cleaning_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Operation details
    operation_type = Column(Enum(CleaningOperationType), nullable=False)
    parameters = Column(JSON, nullable=True)  # Operation-specific parameters
    target_columns = Column(JSON, nullable=True)  # Columns to apply operation to
    
    # Status and progress
    status = Column(Enum(CleaningOperationStatus), default=CleaningOperationStatus.PENDING, nullable=False)
    progress = Column(Integer, default=0, nullable=False)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Results
    rows_affected = Column(Integer, nullable=True)
    rows_removed = Column(Integer, nullable=True)
    rows_modified = Column(Integer, nullable=True)
    quality_improvement = Column(JSON, nullable=True)  # Quality metrics before/after
    
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
    dataset = relationship("Dataset", back_populates="cleaning_operations")
    user = relationship("User", back_populates="cleaning_operations")
    
    def __repr__(self):
        return f"<CleaningOperation(id={self.id}, name='{self.name}', type='{self.operation_type}', status='{self.status}')>"
    
    @property
    def is_completed(self) -> bool:
        """Check if operation is completed"""
        return self.status == CleaningOperationStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if operation failed"""
        return self.status == CleaningOperationStatus.FAILED
    
    @property
    def is_in_progress(self) -> bool:
        """Check if operation is in progress"""
        return self.status == CleaningOperationStatus.PROCESSING
    
    def get_quality_improvement_score(self) -> float:
        """Calculate quality improvement score"""
        if not self.quality_improvement:
            return 0.0
        
        before_score = self.quality_improvement.get("before", 0.0)
        after_score = self.quality_improvement.get("after", 0.0)
        
        if before_score == 0:
            return 0.0
        
        return ((after_score - before_score) / before_score) * 100
    
    def get_processing_time_minutes(self) -> float:
        """Get processing time in minutes"""
        if not self.processing_time:
            return 0.0
        return self.processing_time / 60.0
