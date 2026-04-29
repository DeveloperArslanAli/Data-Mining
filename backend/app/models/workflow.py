"""
Workflow automation models for custom pipelines and scheduled jobs
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class WorkflowStatus(str, enum.Enum):
    """Workflow execution status"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowTriggerType(str, enum.Enum):
    """Workflow trigger types"""
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    EVENT = "event"
    WEBHOOK = "webhook"
    API = "api"


class NodeType(str, enum.Enum):
    """Workflow node types"""
    DATA_INPUT = "data_input"
    DATA_PROCESSING = "data_processing"
    ML_TRAINING = "ml_training"
    ML_PREDICTION = "ml_prediction"
    DATA_CLEANING = "data_cleaning"
    DATA_EXPORT = "data_export"
    CONDITION = "condition"
    LOOP = "loop"
    PARALLEL = "parallel"
    MERGE = "merge"
    NOTIFICATION = "notification"
    WEBHOOK = "webhook"


class Workflow(Base):
    """Workflow definition model"""
    
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String, nullable=False, default="1.0.0")
    
    # Workflow definition
    workflow_definition = Column(JSON, nullable=False)  # Workflow structure and nodes
    trigger_config = Column(JSON, nullable=True)  # Trigger configuration
    variables = Column(JSON, nullable=True)  # Workflow variables
    
    # Status and execution
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    is_template = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    
    # Execution settings
    max_concurrent_executions = Column(Integer, default=1, nullable=False)
    timeout_seconds = Column(Integer, default=3600, nullable=False)  # 1 hour default
    retry_count = Column(Integer, default=3, nullable=False)
    retry_delay_seconds = Column(Integer, default=60, nullable=False)
    
    # Statistics
    execution_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failure_count = Column(Integer, default=0, nullable=False)
    average_execution_time = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")
    scheduled_jobs = relationship("ScheduledJob", back_populates="workflow", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Workflow(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    @property
    def success_rate(self) -> float:
        """Calculate workflow success rate"""
        if self.execution_count == 0:
            return 0.0
        return (self.success_count / self.execution_count) * 100
    
    @property
    def is_active(self) -> bool:
        """Check if workflow is active"""
        return self.status == WorkflowStatus.ACTIVE
    
    def get_workflow_definition(self) -> dict:
        """Get workflow definition as dictionary"""
        return self.workflow_definition or {}
    
    def update_execution_stats(self, execution_time: float, success: bool):
        """Update execution statistics"""
        self.execution_count += 1
        if success:
            self.success_count += 1
        else:
            self.failure_count += 1
        
        # Update average execution time
        if self.average_execution_time is None:
            self.average_execution_time = execution_time
        else:
            self.average_execution_time = (self.average_execution_time + execution_time) / 2
        
        self.last_executed_at = datetime.utcnow()


class WorkflowExecution(Base):
    """Workflow execution instance"""
    
    __tablename__ = "workflow_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    execution_id = Column(String, nullable=False, unique=True, index=True)  # UUID
    
    # Execution details
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    trigger_type = Column(Enum(WorkflowTriggerType), nullable=False)
    trigger_data = Column(JSON, nullable=True)  # Data that triggered execution
    
    # Execution context
    input_data = Column(JSON, nullable=True)  # Input data for workflow
    output_data = Column(JSON, nullable=True)  # Output data from workflow
    variables = Column(JSON, nullable=True)  # Execution variables
    
    # Execution tracking
    current_node = Column(String, nullable=True)  # Current executing node
    completed_nodes = Column(JSON, nullable=True)  # List of completed nodes
    failed_nodes = Column(JSON, nullable=True)  # List of failed nodes
    
    # Performance metrics
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    execution_time = Column(Float, nullable=True)  # Total execution time in seconds
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Foreign keys
    triggered_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    triggered_by_user = relationship("User")
    node_executions = relationship("NodeExecution", back_populates="workflow_execution", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<WorkflowExecution(id={self.id}, execution_id='{self.execution_id}', status='{self.status}')>"
    
    @property
    def is_running(self) -> bool:
        """Check if execution is currently running"""
        return self.status in [WorkflowStatus.ACTIVE]
    
    @property
    def is_completed(self) -> bool:
        """Check if execution is completed"""
        return self.status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED]
    
    def start_execution(self):
        """Start workflow execution"""
        self.status = WorkflowStatus.ACTIVE
        self.start_time = datetime.utcnow()
    
    def complete_execution(self, success: bool, output_data: dict = None, error_message: str = None):
        """Complete workflow execution"""
        self.end_time = datetime.utcnow()
        if self.start_time:
            self.execution_time = (self.end_time - self.start_time).total_seconds()
        
        if success:
            self.status = WorkflowStatus.COMPLETED
            self.output_data = output_data
        else:
            self.status = WorkflowStatus.FAILED
            self.error_message = error_message


class NodeExecution(Base):
    """Individual node execution tracking"""
    
    __tablename__ = "node_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_execution_id = Column(Integer, ForeignKey("workflow_executions.id"), nullable=False)
    node_id = Column(String, nullable=False)  # Node ID in workflow definition
    node_type = Column(Enum(NodeType), nullable=False)
    
    # Execution details
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    
    # Performance metrics
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    execution_time = Column(Float, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    workflow_execution = relationship("WorkflowExecution", back_populates="node_executions")
    
    def __repr__(self):
        return f"<NodeExecution(id={self.id}, node_id='{self.node_id}', status='{self.status}')>"
    
    def start_execution(self):
        """Start node execution"""
        self.status = WorkflowStatus.ACTIVE
        self.start_time = datetime.utcnow()
    
    def complete_execution(self, success: bool, output_data: dict = None, error_message: str = None):
        """Complete node execution"""
        self.end_time = datetime.utcnow()
        if self.start_time:
            self.execution_time = (self.end_time - self.start_time).total_seconds()
        
        if success:
            self.status = WorkflowStatus.COMPLETED
            self.output_data = output_data
        else:
            self.status = WorkflowStatus.FAILED
            self.error_message = error_message


class ScheduledJob(Base):
    """Scheduled job for workflow automation"""
    
    __tablename__ = "scheduled_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Schedule configuration
    cron_expression = Column(String, nullable=False)  # Cron expression for scheduling
    timezone = Column(String, default="UTC", nullable=False)
    
    # Job settings
    is_active = Column(Boolean, default=True, nullable=False)
    max_executions = Column(Integer, nullable=True)  # None for unlimited
    execution_count = Column(Integer, default=0, nullable=False)
    
    # Execution parameters
    input_data = Column(JSON, nullable=True)  # Default input data for workflow
    variables = Column(JSON, nullable=True)  # Default variables for workflow
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    next_execution_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workflow = relationship("Workflow", back_populates="scheduled_jobs")
    owner = relationship("User")
    
    def __repr__(self):
        return f"<ScheduledJob(id={self.id}, name='{self.name}', cron='{self.cron_expression}')>"
    
    @property
    def is_scheduled(self) -> bool:
        """Check if job is scheduled for execution"""
        return self.is_active and self.next_execution_at is not None
    
    def increment_execution_count(self):
        """Increment execution count"""
        self.execution_count += 1
        self.last_executed_at = datetime.utcnow()
    
    def is_max_executions_reached(self) -> bool:
        """Check if maximum executions reached"""
        if self.max_executions is None:
            return False
        return self.execution_count >= self.max_executions


class WorkflowTemplate(Base):
    """Pre-built workflow templates"""
    
    __tablename__ = "workflow_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # e.g., "data_processing", "ml_pipeline"
    
    # Template definition
    template_definition = Column(JSON, nullable=False)  # Template structure
    parameters = Column(JSON, nullable=True)  # Template parameters
    documentation = Column(Text, nullable=True)  # Usage documentation
    
    # Template metadata
    version = Column(String, nullable=False, default="1.0.0")
    is_public = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    # Usage statistics
    usage_count = Column(Integer, default=0, nullable=False)
    rating = Column(Float, nullable=True)  # Average rating
    rating_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Foreign keys
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")
    
    def __repr__(self):
        return f"<WorkflowTemplate(id={self.id}, name='{self.name}', category='{self.category}')>"
    
    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
    
    def update_rating(self, rating: float):
        """Update template rating"""
        if self.rating is None:
            self.rating = rating
        else:
            total_rating = self.rating * self.rating_count + rating
            self.rating_count += 1
            self.rating = total_rating / self.rating_count
