"""
ML Model management models for storing model metadata and lifecycle information
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class ModelStatus(str, enum.Enum):
    """ML Model status"""
    TRAINING = "training"
    TRAINED = "trained"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    ERROR = "error"


class ModelType(str, enum.Enum):
    """ML Model types"""
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    ANOMALY_DETECTION = "anomaly_detection"
    TIME_SERIES = "time_series"
    NLP = "nlp"
    COMPUTER_VISION = "computer_vision"


class ModelFramework(str, enum.Enum):
    """ML Model frameworks"""
    SCIKIT_LEARN = "scikit-learn"
    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    SPACY = "spacy"
    TRANSFORMERS = "transformers"


class MLModel(Base):
    """ML Model for storing model metadata and lifecycle information"""
    
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String, nullable=False, default="1.0.0")
    
    # Model metadata
    model_type = Column(Enum(ModelType), nullable=False)
    framework = Column(Enum(ModelFramework), nullable=False)
    algorithm = Column(String, nullable=False)  # e.g., "RandomForest", "BERT", "LSTM"
    
    # Model files and artifacts
    model_path = Column(String, nullable=True)  # Path to saved model file
    preprocessor_path = Column(String, nullable=True)  # Path to preprocessor
    feature_names = Column(JSON, nullable=True)  # List of feature names
    target_column = Column(String, nullable=True)  # Target column name
    
    # Performance metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)  # For regression
    mae = Column(Float, nullable=True)   # For regression
    custom_metrics = Column(JSON, nullable=True)  # Custom metrics
    
    # Training information
    training_dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    training_params = Column(JSON, nullable=True)  # Hyperparameters used
    training_duration = Column(Float, nullable=True)  # Training time in seconds
    training_samples = Column(Integer, nullable=True)  # Number of training samples
    
    # Model status and lifecycle
    status = Column(Enum(ModelStatus), default=ModelStatus.TRAINING, nullable=False)
    is_production = Column(Boolean, default=False, nullable=False)
    is_auto_retrain = Column(Boolean, default=False, nullable=False)
    
    # Deployment information
    deployment_url = Column(String, nullable=True)  # API endpoint for deployed model
    deployment_config = Column(JSON, nullable=True)  # Deployment configuration
    
    # Model validation
    validation_score = Column(Float, nullable=True)
    validation_dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    cross_validation_scores = Column(JSON, nullable=True)  # CV scores
    
    # Model monitoring
    prediction_count = Column(Integer, default=0, nullable=False)
    last_prediction_at = Column(DateTime(timezone=True), nullable=True)
    model_drift_score = Column(Float, nullable=True)  # Drift detection score
    performance_drop_threshold = Column(Float, default=0.05, nullable=False)  # 5% drop threshold
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    trained_at = Column(DateTime(timezone=True), nullable=True)
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="ml_models")
    training_dataset = relationship("Dataset", foreign_keys=[training_dataset_id])
    validation_dataset = relationship("Dataset", foreign_keys=[validation_dataset_id])
    model_predictions = relationship("ModelPrediction", back_populates="model", cascade="all, delete-orphan")
    model_versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MLModel(id={self.id}, name='{self.name}', version='{self.version}', status='{self.status}')>"
    
    @property
    def is_deployed(self) -> bool:
        """Check if model is deployed"""
        return self.status == ModelStatus.DEPLOYED and self.deployment_url is not None
    
    @property
    def is_ready_for_deployment(self) -> bool:
        """Check if model is ready for deployment"""
        return (self.status == ModelStatus.TRAINED and 
                self.model_path is not None and 
                self.validation_score is not None)
    
    @property
    def performance_summary(self) -> dict:
        """Get performance metrics summary"""
        metrics = {}
        
        if self.model_type in [ModelType.CLASSIFICATION]:
            if self.accuracy is not None:
                metrics['accuracy'] = self.accuracy
            if self.precision is not None:
                metrics['precision'] = self.precision
            if self.recall is not None:
                metrics['recall'] = self.recall
            if self.f1_score is not None:
                metrics['f1_score'] = self.f1_score
                
        elif self.model_type in [ModelType.REGRESSION]:
            if self.rmse is not None:
                metrics['rmse'] = self.rmse
            if self.mae is not None:
                metrics['mae'] = self.mae
                
        if self.validation_score is not None:
            metrics['validation_score'] = self.validation_score
            
        if self.custom_metrics:
            metrics.update(self.custom_metrics)
            
        return metrics
    
    def get_model_info(self) -> dict:
        """Get comprehensive model information"""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "model_type": self.model_type.value,
            "framework": self.framework.value,
            "algorithm": self.algorithm,
            "status": self.status.value,
            "is_production": self.is_production,
            "performance": self.performance_summary,
            "training_info": {
                "training_samples": self.training_samples,
                "training_duration": self.training_duration,
                "training_params": self.training_params
            },
            "deployment_info": {
                "is_deployed": self.is_deployed,
                "deployment_url": self.deployment_url,
                "deployed_at": self.deployed_at.isoformat() if self.deployed_at else None
            },
            "monitoring": {
                "prediction_count": self.prediction_count,
                "last_prediction_at": self.last_prediction_at.isoformat() if self.last_prediction_at else None,
                "model_drift_score": self.model_drift_score
            },
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class ModelVersion(Base):
    """Model versioning for tracking model changes"""
    
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=False)
    version = Column(String, nullable=False)
    
    # Version metadata
    description = Column(Text, nullable=True)
    changelog = Column(Text, nullable=True)
    
    # Model artifacts
    model_path = Column(String, nullable=False)
    preprocessor_path = Column(String, nullable=True)
    
    # Performance comparison
    performance_improvement = Column(Float, nullable=True)  # Improvement over previous version
    is_best_version = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    model = relationship("MLModel", back_populates="model_versions")
    
    def __repr__(self):
        return f"<ModelVersion(id={self.id}, model_id={self.model_id}, version='{self.version}')>"


class ModelPrediction(Base):
    """Model prediction tracking for monitoring and analysis"""
    
    __tablename__ = "model_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=False)
    
    # Prediction data
    input_data = Column(JSON, nullable=False)  # Input features
    prediction = Column(JSON, nullable=False)  # Model prediction
    confidence = Column(Float, nullable=True)  # Prediction confidence
    actual_value = Column(JSON, nullable=True)  # Actual value (for evaluation)
    
    # Prediction metadata
    prediction_time = Column(Float, nullable=True)  # Time taken for prediction
    request_id = Column(String, nullable=True)  # Unique request identifier
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    model = relationship("MLModel", back_populates="model_predictions")
    
    def __repr__(self):
        return f"<ModelPrediction(id={self.id}, model_id={self.model_id}, created_at='{self.created_at}')>"


class ModelTrainingJob(Base):
    """Model training job tracking"""
    
    __tablename__ = "model_training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=True)
    
    # Job metadata
    job_name = Column(String, nullable=False)
    job_type = Column(String, nullable=False)  # "training", "hyperparameter_tuning", "auto_ml"
    
    # Training configuration
    training_dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    validation_dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    training_config = Column(JSON, nullable=False)  # Training parameters
    
    # Job status
    status = Column(String, default="pending", nullable=False)  # pending, running, completed, failed
    progress = Column(Float, default=0.0, nullable=False)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Results
    result_model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=True)
    training_metrics = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User")
    training_dataset = relationship("Dataset", foreign_keys=[training_dataset_id])
    validation_dataset = relationship("Dataset", foreign_keys=[validation_dataset_id])
    result_model = relationship("MLModel", foreign_keys=[result_model_id])
    
    def __repr__(self):
        return f"<ModelTrainingJob(id={self.id}, job_name='{self.job_name}', status='{self.status}')>"
