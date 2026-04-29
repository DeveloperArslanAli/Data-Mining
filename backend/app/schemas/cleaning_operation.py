"""
Cleaning operation schemas
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.cleaning_operation import CleaningOperationType, CleaningOperationStatus


class CleaningOperationBase(BaseModel):
    """Base cleaning operation schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    operation_type: CleaningOperationType
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    target_columns: Optional[List[str]] = Field(default_factory=list)


class CleaningOperationCreate(CleaningOperationBase):
    """Schema for creating a cleaning operation"""
    dataset_id: int = Field(..., gt=0)


class CleaningOperationUpdate(BaseModel):
    """Schema for updating a cleaning operation"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    parameters: Optional[Dict[str, Any]] = None
    target_columns: Optional[List[str]] = None


class CleaningOperationResponse(CleaningOperationBase):
    """Schema for cleaning operation response"""
    id: int
    status: CleaningOperationStatus
    progress: int = Field(..., ge=0, le=100)
    error_message: Optional[str] = None
    
    # Results
    rows_affected: Optional[int] = None
    rows_removed: Optional[int] = None
    rows_modified: Optional[int] = None
    quality_improvement: Optional[Dict[str, Any]] = None
    
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


class CleaningSuggestion(BaseModel):
    """Schema for cleaning suggestion"""
    type: str
    operation: CleaningOperationType
    description: str
    columns: Optional[List[str]] = None
    priority: str  # high, medium, low
    estimated_impact: str  # high, medium, low


class CleaningSuggestionsResponse(BaseModel):
    """Schema for cleaning suggestions response"""
    dataset_id: int
    suggestions: List[CleaningSuggestion]
    total_suggestions: int
    generated_at: datetime


class AutoCleanResponse(BaseModel):
    """Schema for auto-clean response"""
    message: str
    operations: List[int]
    started_processing: bool


class CleaningOperationTypeInfo(BaseModel):
    """Schema for cleaning operation type information"""
    value: str
    label: str
    description: str
    category: str


class CleaningOperationTypesResponse(BaseModel):
    """Schema for cleaning operation types response"""
    operation_types: List[CleaningOperationTypeInfo]
