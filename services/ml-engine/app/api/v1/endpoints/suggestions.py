"""
ML Engine Service - ML Suggestions Endpoints
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import structlog
import pandas as pd
import numpy as np
from sklearn.feature_selection import SelectKBest, f_regression, f_classif, mutual_info_regression, mutual_info_classif
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy import stats

from app.ml.data_processor import data_processor
from app.core.cache import cache_manager

logger = structlog.get_logger(__name__)

router = APIRouter()


class SuggestionRequest(BaseModel):
    """Request model for ML suggestions"""
    file_path: str
    target_column: Optional[str] = None
    task_type: Optional[str] = None  # 'regression', 'classification', 'clustering'
    max_suggestions: int = 10


class MLSuggestion(BaseModel):
    """ML suggestion model"""
    type: str
    title: str
    description: str
    confidence: float
    priority: str  # 'high', 'medium', 'low'
    parameters: Dict[str, Any]
    expected_impact: str  # 'high', 'medium', 'low'


class SuggestionsResponse(BaseModel):
    """Response model for ML suggestions"""
    file_path: str
    suggestions: List[MLSuggestion]
    total_suggestions: int
    data_insights: Dict[str, Any]


@router.post("/generate", response_model=SuggestionsResponse)
async def generate_ml_suggestions(request: SuggestionRequest):
    """Generate ML-powered suggestions for data analysis and modeling"""
    try:
        # Load dataset
        df = data_processor.load_dataset(request.file_path)
        
        # Get quality assessment
        quality_report = data_processor.assess_data_quality(df)
        
        # Generate suggestions
        suggestions = []
        
        # Data quality suggestions
        suggestions.extend(_generate_quality_suggestions(quality_report))
        
        # Feature engineering suggestions
        suggestions.extend(_generate_feature_engineering_suggestions(df, quality_report))
        
        # Data transformation suggestions
        suggestions.extend(_generate_transformation_suggestions(df, quality_report))
        
        # Model-specific suggestions
        if request.target_column and request.task_type:
            suggestions.extend(_generate_model_suggestions(df, request.target_column, request.task_type))
        
        # Sort by priority and confidence
        suggestions.sort(key=lambda x: (_priority_score(x.priority), x.confidence), reverse=True)
        
        # Limit suggestions
        suggestions = suggestions[:request.max_suggestions]
        
        # Generate data insights
        data_insights = _generate_data_insights(df, quality_report)
        
        response = SuggestionsResponse(
            file_path=request.file_path,
            suggestions=suggestions,
            total_suggestions=len(suggestions),
            data_insights=data_insights
        )
        
        logger.info("ML suggestions generated successfully",
                   file_path=request.file_path,
                   total_suggestions=len(suggestions))
        
        return response
        
    except Exception as e:
        logger.error("Failed to generate ML suggestions", file_path=request.file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ML suggestions: {str(e)}"
        )


def _generate_quality_suggestions(quality_report: Dict[str, Any]) -> List[MLSuggestion]:
    """Generate data quality improvement suggestions"""
    suggestions = []
    
    # Missing values suggestions
    missing_percentage = quality_report["missing_values"]["missing_percentage"]
    if missing_percentage > 5:
        suggestions.append(MLSuggestion(
            type="data_quality",
            title="Handle Missing Values",
            description=f"Dataset has {missing_percentage:.1f}% missing values that should be addressed",
            confidence=0.9,
            priority="high" if missing_percentage > 20 else "medium",
            parameters={
                "operation": "handle_missing_values",
                "strategy": "auto",
                "columns": list(quality_report["missing_values"]["columns_with_missing"].keys())
            },
            expected_impact="high"
        ))
    
    # Duplicate suggestions
    duplicate_percentage = quality_report["duplicates"]["duplicate_percentage"]
    if duplicate_percentage > 1:
        suggestions.append(MLSuggestion(
            type="data_quality",
            title="Remove Duplicates",
            description=f"Dataset contains {duplicate_percentage:.1f}% duplicate rows",
            confidence=0.95,
            priority="medium",
            parameters={
                "operation": "remove_duplicates",
                "keep": "first"
            },
            expected_impact="medium"
        ))
    
    # Outlier suggestions
    high_outlier_cols = []
    for col, info in quality_report["outliers"].items():
        if info["percentage"] > 5:
            high_outlier_cols.append(col)
    
    if high_outlier_cols:
        suggestions.append(MLSuggestion(
            type="data_quality",
            title="Handle Outliers",
            description=f"High outlier percentage detected in {len(high_outlier_cols)} columns",
            confidence=0.8,
            priority="medium",
            parameters={
                "operation": "remove_outliers",
                "method": "iqr",
                "columns": high_outlier_cols
            },
            expected_impact="medium"
        ))
    
    return suggestions


def _generate_feature_engineering_suggestions(df: pd.DataFrame, quality_report: Dict[str, Any]) -> List[MLSuggestion]:
    """Generate feature engineering suggestions"""
    suggestions = []
    
    # Data type conversion suggestions
    for col, info in quality_report["data_types"].items():
        if info["current_type"] != info["suggested_type"]:
            suggestions.append(MLSuggestion(
                type="feature_engineering",
                title=f"Convert {col} Data Type",
                description=f"Convert column '{col}' from {info['current_type']} to {info['suggested_type']}",
                confidence=0.7,
                priority="low",
                parameters={
                    "operation": "data_type_conversion",
                    "column": col,
                    "target_type": info["suggested_type"]
                },
                expected_impact="low"
            ))
    
    # Normalization suggestions for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) > 1:
        # Check if normalization is needed
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(df[numeric_cols].dropna())
        original_std = df[numeric_cols].std()
        scaled_std = np.std(scaled_data, axis=0)
        
        if np.any(original_std > 10 * scaled_std):
            suggestions.append(MLSuggestion(
                type="feature_engineering",
                title="Normalize Numeric Features",
                description="Large scale differences detected in numeric columns",
                confidence=0.6,
                priority="low",
                parameters={
                    "operation": "normalization",
                    "method": "standard",
                    "columns": numeric_cols
                },
                expected_impact="medium"
            ))
    
    # Encoding suggestions for categorical columns
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    if categorical_cols:
        suggestions.append(MLSuggestion(
            type="feature_engineering",
            title="Encode Categorical Variables",
            description=f"Encode {len(categorical_cols)} categorical columns for ML compatibility",
            confidence=0.8,
            priority="medium",
            parameters={
                "operation": "encoding",
                "method": "label",
                "columns": categorical_cols
            },
            expected_impact="high"
        ))
    
    return suggestions


def _generate_transformation_suggestions(df: pd.DataFrame, quality_report: Dict[str, Any]) -> List[MLSuggestion]:
    """Generate data transformation suggestions"""
    suggestions = []
    
    # Log transformation for skewed numeric data
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        if df[col].notna().sum() > 0:
            # Check for skewness
            skewness = stats.skew(df[col].dropna())
            if abs(skewness) > 1:
                suggestions.append(MLSuggestion(
                    type="transformation",
                    title=f"Log Transform {col}",
                    description=f"Column '{col}' shows high skewness ({skewness:.2f})",
                    confidence=0.7,
                    priority="low",
                    parameters={
                        "operation": "log_transform",
                        "column": col,
                        "skewness": skewness
                    },
                    expected_impact="medium"
                ))
    
    # PCA suggestion for high-dimensional data
    if len(numeric_cols) > 10:
        suggestions.append(MLSuggestion(
            type="transformation",
            title="Apply Dimensionality Reduction",
            description=f"Dataset has {len(numeric_cols)} numeric features, consider PCA",
            confidence=0.6,
            priority="low",
            parameters={
                "operation": "pca",
                "n_components": min(10, len(numeric_cols) // 2)
            },
            expected_impact="medium"
        ))
    
    return suggestions


def _generate_model_suggestions(df: pd.DataFrame, target_column: str, task_type: str) -> List[MLSuggestion]:
    """Generate model-specific suggestions"""
    suggestions = []
    
    if target_column not in df.columns:
        return suggestions
    
    # Feature selection suggestions
    numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
    if target_column in numeric_features:
        numeric_features.remove(target_column)
    
    if len(numeric_features) > 5:
        if task_type == "regression":
            # Use mutual information for regression
            mi_scores = mutual_info_regression(df[numeric_features].fillna(0), df[target_column].fillna(0))
            top_features = [numeric_features[i] for i in np.argsort(mi_scores)[-5:]]
            
            suggestions.append(MLSuggestion(
                type="modeling",
                title="Feature Selection for Regression",
                description=f"Top 5 most informative features: {', '.join(top_features)}",
                confidence=0.7,
                priority="medium",
                parameters={
                    "operation": "feature_selection",
                    "method": "mutual_info",
                    "n_features": 5,
                    "top_features": top_features
                },
                expected_impact="high"
            ))
        
        elif task_type == "classification":
            # Use mutual information for classification
            mi_scores = mutual_info_classif(df[numeric_features].fillna(0), df[target_column].fillna(0))
            top_features = [numeric_features[i] for i in np.argsort(mi_scores)[-5:]]
            
            suggestions.append(MLSuggestion(
                type="modeling",
                title="Feature Selection for Classification",
                description=f"Top 5 most informative features: {', '.join(top_features)}",
                confidence=0.7,
                priority="medium",
                parameters={
                    "operation": "feature_selection",
                    "method": "mutual_info",
                    "n_features": 5,
                    "top_features": top_features
                },
                expected_impact="high"
            ))
    
    # Class imbalance check for classification
    if task_type == "classification":
        class_counts = df[target_column].value_counts()
        if len(class_counts) > 1:
            imbalance_ratio = class_counts.min() / class_counts.max()
            if imbalance_ratio < 0.3:
                suggestions.append(MLSuggestion(
                    type="modeling",
                    title="Handle Class Imbalance",
                    description=f"Severe class imbalance detected (ratio: {imbalance_ratio:.2f})",
                    confidence=0.8,
                    priority="high",
                    parameters={
                        "operation": "handle_imbalance",
                        "method": "smote",
                        "imbalance_ratio": imbalance_ratio
                    },
                    expected_impact="high"
                ))
    
    return suggestions


def _generate_data_insights(df: pd.DataFrame, quality_report: Dict[str, Any]) -> Dict[str, Any]:
    """Generate data insights for the dataset"""
    insights = {
        "dataset_size": f"{quality_report['basic_info']['rows']:,} rows × {quality_report['basic_info']['columns']} columns",
        "memory_usage": f"{quality_report['basic_info']['memory_usage_mb']:.1f} MB",
        "quality_score": f"{quality_report['quality_score']:.1f}/100",
        "data_types": {
            "numeric": len(df.select_dtypes(include=[np.number]).columns),
            "categorical": len(df.select_dtypes(include=['object']).columns),
            "datetime": len(df.select_dtypes(include=['datetime']).columns)
        },
        "quality_issues": {
            "missing_values": quality_report["missing_values"]["missing_percentage"] > 0,
            "duplicates": quality_report["duplicates"]["duplicate_percentage"] > 0,
            "outliers": len(quality_report["outliers"]) > 0
        }
    }
    
    return insights


def _priority_score(priority: str) -> int:
    """Convert priority string to numeric score for sorting"""
    priority_map = {"high": 3, "medium": 2, "low": 1}
    return priority_map.get(priority, 0)
