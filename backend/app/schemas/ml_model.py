"""
Pydantic schemas for ML model management
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum

from app.models.ml_model import ModelStatus, ModelType, ModelFramework


class ModelStatusEnum(str, Enum):
    """Model status enum for API"""
    TRAINING = "training"
    TRAINED = "trained"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    ERROR = "error"


class ModelTypeEnum(str, Enum):
    """Model type enum for API"""
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    ANOMALY_DETECTION = "anomaly_detection"
    TIME_SERIES = "time_series"
    NLP = "nlp"
    COMPUTER_VISION = "computer_vision"


class ModelFrameworkEnum(str, Enum):
    """Model framework enum for API"""
    SCIKIT_LEARN = "scikit-learn"
    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    SPACY = "spacy"
    TRANSFORMERS = "transformers"


# Base schemas
class ModelBase(BaseModel):
    """Base model schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Model name")
    description: Optional[str] = Field(None, description="Model description")
    model_type: ModelTypeEnum = Field(..., description="Type of ML model")
    framework: ModelFrameworkEnum = Field(..., description="ML framework used")
    algorithm: str = Field(..., min_length=1, max_length=100, description="ML algorithm name")
    target_column: Optional[str] = Field(None, description="Target column name for supervised learning")


class ModelCreate(ModelBase):
    """Schema for creating a new model"""
    training_dataset_id: int = Field(..., description="ID of training dataset")
    validation_dataset_id: Optional[int] = Field(None, description="ID of validation dataset")
    training_params: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Training hyperparameters")
    auto_deploy: bool = Field(False, description="Automatically deploy model after training")


class ModelUpdate(BaseModel):
    """Schema for updating a model"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_production: Optional[bool] = None
    is_auto_retrain: Optional[bool] = None
    performance_drop_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)


class ModelResponse(ModelBase):
    """Schema for model response"""
    id: int
    version: str
    status: ModelStatusEnum
    is_production: bool
    is_auto_retrain: bool
    
    # Performance metrics
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    validation_score: Optional[float] = None
    custom_metrics: Optional[Dict[str, Any]] = None
    
    # Training information
    training_samples: Optional[int] = None
    training_duration: Optional[float] = None
    training_params: Optional[Dict[str, Any]] = None
    
    # Deployment information
    deployment_url: Optional[str] = None
    deployed_at: Optional[datetime] = None
    
    # Monitoring
    prediction_count: int
    last_prediction_at: Optional[datetime] = None
    model_drift_score: Optional[float] = None
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    trained_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ModelList(BaseModel):
    """Schema for model list response"""
    models: List[ModelResponse]
    total: int
    page: int
    size: int
    pages: int


class ModelVersionBase(BaseModel):
    """Base model version schema"""
    version: str = Field(..., min_length=1, max_length=50, description="Version number")
    description: Optional[str] = Field(None, description="Version description")
    changelog: Optional[str] = Field(None, description="Version changelog")


class ModelVersionCreate(ModelVersionBase):
    """Schema for creating a model version"""
    model_path: str = Field(..., description="Path to model file")
    preprocessor_path: Optional[str] = Field(None, description="Path to preprocessor file")


class ModelVersionResponse(ModelVersionBase):
    """Schema for model version response"""
    id: int
    model_id: int
    model_path: str
    preprocessor_path: Optional[str] = None
    performance_improvement: Optional[float] = None
    is_best_version: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModelPredictionBase(BaseModel):
    """Base model prediction schema"""
    input_data: Dict[str, Any] = Field(..., description="Input features for prediction")
    request_id: Optional[str] = Field(None, description="Unique request identifier")


class ModelPredictionCreate(ModelPredictionBase):
    """Schema for creating a model prediction"""
    actual_value: Optional[Union[str, int, float, List[Any]]] = Field(None, description="Actual value for evaluation")


class ModelPredictionResponse(ModelPredictionBase):
    """Schema for model prediction response"""
    id: int
    model_id: int
    prediction: Dict[str, Any]
    confidence: Optional[float] = None
    actual_value: Optional[Dict[str, Any]] = None
    prediction_time: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModelTrainingJobBase(BaseModel):
    """Base model training job schema"""
    job_name: str = Field(..., min_length=1, max_length=255, description="Training job name")
    job_type: str = Field(..., description="Type of training job")
    training_dataset_id: int = Field(..., description="ID of training dataset")
    validation_dataset_id: Optional[int] = Field(None, description="ID of validation dataset")
    training_config: Dict[str, Any] = Field(..., description="Training configuration")


class ModelTrainingJobCreate(ModelTrainingJobBase):
    """Schema for creating a training job"""
    pass


class ModelTrainingJobResponse(ModelTrainingJobBase):
    """Schema for training job response"""
    id: int
    model_id: Optional[int] = None
    status: str
    progress: float
    error_message: Optional[str] = None
    result_model_id: Optional[int] = None
    training_metrics: Optional[Dict[str, Any]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ModelDeploymentConfig(BaseModel):
    """Schema for model deployment configuration"""
    deployment_name: str = Field(..., min_length=1, max_length=255)
    deployment_type: str = Field(default="api", description="Deployment type: api, batch, streaming")
    scaling_config: Optional[Dict[str, Any]] = Field(None, description="Auto-scaling configuration")
    health_check_config: Optional[Dict[str, Any]] = Field(None, description="Health check configuration")
    monitoring_config: Optional[Dict[str, Any]] = Field(None, description="Monitoring configuration")


class ModelDeploymentResponse(BaseModel):
    """Schema for model deployment response"""
    deployment_id: str
    deployment_url: str
    status: str
    deployed_at: datetime
    health_status: str
    scaling_info: Optional[Dict[str, Any]] = None


class ModelPerformanceMetrics(BaseModel):
    """Schema for model performance metrics"""
    model_id: int
    metrics: Dict[str, float]
    evaluation_dataset_id: Optional[int] = None
    evaluation_date: datetime
    notes: Optional[str] = None


class ModelDriftDetection(BaseModel):
    """Schema for model drift detection"""
    model_id: int
    drift_score: float = Field(..., ge=0.0, le=1.0, description="Drift score (0=no drift, 1=complete drift)")
    drift_type: str = Field(..., description="Type of drift detected")
    affected_features: List[str] = Field(default_factory=list, description="Features affected by drift")
    detection_date: datetime
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for handling drift")


class AutoMLConfig(BaseModel):
    """Schema for AutoML configuration"""
    target_column: str = Field(..., description="Target column name")
    problem_type: str = Field(..., description="Problem type: classification, regression, clustering")
    algorithms: Optional[List[str]] = Field(None, description="Specific algorithms to try")
    max_training_time: int = Field(default=3600, ge=60, description="Maximum training time in seconds")
    cross_validation_folds: int = Field(default=5, ge=2, le=10, description="Number of CV folds")
    optimization_metric: str = Field(default="auto", description="Metric to optimize")
    feature_engineering: bool = Field(default=True, description="Enable automatic feature engineering")
    hyperparameter_tuning: bool = Field(default=True, description="Enable hyperparameter tuning")


class AutoMLResponse(BaseModel):
    """Schema for AutoML response"""
    job_id: int
    best_model_id: Optional[int] = None
    best_score: Optional[float] = None
    best_algorithm: Optional[str] = None
    training_results: List[Dict[str, Any]] = Field(default_factory=list)
    feature_importance: Optional[Dict[str, float]] = None
    training_time: float
    status: str


class ModelComparison(BaseModel):
    """Schema for model comparison"""
    model_ids: List[int] = Field(..., min_items=2, description="List of model IDs to compare")
    comparison_metrics: List[str] = Field(default_factory=list, description="Metrics to compare")
    test_dataset_id: Optional[int] = Field(None, description="Test dataset for comparison")


class ModelComparisonResponse(BaseModel):
    """Schema for model comparison response"""
    comparison_id: str
    models: List[Dict[str, Any]]
    metrics_comparison: Dict[str, Dict[str, float]]
    best_model_id: int
    comparison_date: datetime
    recommendations: List[str] = Field(default_factory=list)


# Validation schemas
class ModelValidation(BaseModel):
    """Schema for model validation"""
    model_id: int
    validation_dataset_id: int
    validation_metrics: List[str] = Field(default_factory=list, description="Metrics to compute")
    cross_validation: bool = Field(default=False, description="Perform cross-validation")
    validation_folds: int = Field(default=5, ge=2, le=10, description="Number of CV folds")


class ModelValidationResponse(BaseModel):
    """Schema for model validation response"""
    validation_id: str
    model_id: int
    validation_metrics: Dict[str, float]
    cross_validation_scores: Optional[List[float]] = None
    validation_date: datetime
    is_model_acceptable: bool
    recommendations: List[str] = Field(default_factory=list)
