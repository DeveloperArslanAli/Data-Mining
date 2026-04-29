"""
ML Engine Service - Data Processing Core
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_regression, f_classif
from scipy import stats
import structlog
import time
import os

from app.core.config import settings
from app.core.cache import cache_manager

logger = structlog.get_logger(__name__)


class DataProcessor:
    """Core data processing class with ML algorithms"""
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.imputers = {}
    
    def load_dataset(self, file_path: str) -> pd.DataFrame:
        """Load dataset from file"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.csv':
                df = pd.read_csv(file_path)
            elif file_extension == '.json':
                df = pd.read_json(file_path)
            elif file_extension == '.xlsx':
                df = pd.read_excel(file_path)
            elif file_extension == '.parquet':
                df = pd.read_parquet(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            logger.info("Dataset loaded successfully", 
                       file_path=file_path, 
                       shape=df.shape,
                       memory_usage=df.memory_usage(deep=True).sum())
            
            return df
            
        except Exception as e:
            logger.error("Failed to load dataset", file_path=file_path, error=str(e))
            raise
    
    def assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data quality assessment"""
        start_time = time.time()
        
        try:
            quality_report = {
                "basic_info": self._get_basic_info(df),
                "missing_values": self._analyze_missing_values(df),
                "duplicates": self._analyze_duplicates(df),
                "outliers": self._analyze_outliers(df),
                "data_types": self._analyze_data_types(df),
                "statistical_summary": self._get_statistical_summary(df),
                "quality_score": 0.0,
                "recommendations": []
            }
            
            # Calculate overall quality score
            quality_report["quality_score"] = self._calculate_quality_score(quality_report)
            
            # Generate recommendations
            quality_report["recommendations"] = self._generate_recommendations(quality_report)
            
            processing_time = time.time() - start_time
            logger.info("Data quality assessment completed", 
                       processing_time=processing_time,
                       quality_score=quality_report["quality_score"])
            
            return quality_report
            
        except Exception as e:
            logger.error("Failed to assess data quality", error=str(e))
            raise
    
    def _get_basic_info(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic dataset information"""
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "memory_usage_mb": df.memory_usage(deep=True).sum() / (1024 * 1024),
            "column_names": df.columns.tolist(),
            "sample_data": df.head(5).to_dict('records')
        }
    
    def _analyze_missing_values(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze missing values in the dataset"""
        missing_counts = df.isnull().sum()
        missing_percentages = (missing_counts / len(df)) * 100
        
        return {
            "total_missing": missing_counts.sum(),
            "missing_percentage": (missing_counts.sum() / (len(df) * len(df.columns))) * 100,
            "columns_with_missing": missing_counts[missing_counts > 0].to_dict(),
            "missing_percentages": missing_percentages[missing_percentages > 0].to_dict()
        }
    
    def _analyze_duplicates(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze duplicate rows"""
        duplicate_count = df.duplicated().sum()
        
        return {
            "duplicate_rows": duplicate_count,
            "duplicate_percentage": (duplicate_count / len(df)) * 100 if len(df) > 0 else 0
        }
    
    def _analyze_outliers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze outliers in numeric columns"""
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        outlier_info = {}
        
        for col in numeric_columns:
            if df[col].notna().sum() > 0:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
                outlier_count = len(outliers)
                
                outlier_info[col] = {
                    "count": outlier_count,
                    "percentage": (outlier_count / len(df)) * 100,
                    "lower_bound": lower_bound,
                    "upper_bound": upper_bound
                }
        
        return outlier_info
    
    def _analyze_data_types(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze data types and provide conversion suggestions"""
        type_info = {}
        
        for col in df.columns:
            dtype = str(df[col].dtype)
            unique_count = df[col].nunique()
            null_count = df[col].isnull().sum()
            
            type_info[col] = {
                "current_type": dtype,
                "unique_values": unique_count,
                "null_count": null_count,
                "suggested_type": self._suggest_data_type(df[col])
            }
        
        return type_info
    
    def _suggest_data_type(self, series: pd.Series) -> str:
        """Suggest optimal data type for a column"""
        if series.dtype == 'object':
            # Check if it's actually numeric
            try:
                pd.to_numeric(series.dropna())
                return 'numeric'
            except:
                # Check if it's datetime
                try:
                    pd.to_datetime(series.dropna())
                    return 'datetime'
                except:
                    # Check if it's categorical
                    if series.nunique() / len(series) < 0.5:
                        return 'categorical'
                    else:
                        return 'string'
        elif pd.api.types.is_datetime64_any_dtype(series):
            return 'datetime'
        elif pd.api.types.is_numeric_dtype(series):
            return 'numeric'
        else:
            return str(series.dtype)
    
    def _get_statistical_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get statistical summary of numeric columns"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {}
        
        return {
            "descriptive_stats": numeric_df.describe().to_dict(),
            "correlation_matrix": numeric_df.corr().to_dict() if len(numeric_df.columns) > 1 else {}
        }
    
    def _calculate_quality_score(self, quality_report: Dict[str, Any]) -> float:
        """Calculate overall data quality score (0-100)"""
        score = 100.0
        
        # Deduct points for missing values
        missing_percentage = quality_report["missing_values"]["missing_percentage"]
        score -= missing_percentage * 0.5
        
        # Deduct points for duplicates
        duplicate_percentage = quality_report["duplicates"]["duplicate_percentage"]
        score -= duplicate_percentage * 0.3
        
        # Deduct points for outliers (weighted by percentage)
        total_outlier_percentage = 0
        for col_info in quality_report["outliers"].values():
            total_outlier_percentage += col_info["percentage"]
        score -= total_outlier_percentage * 0.1
        
        return max(0.0, score)
    
    def _generate_recommendations(self, quality_report: Dict[str, Any]) -> List[str]:
        """Generate data quality improvement recommendations"""
        recommendations = []
        
        # Missing values recommendations
        missing_percentage = quality_report["missing_values"]["missing_percentage"]
        if missing_percentage > 5:
            recommendations.append(f"High missing value rate ({missing_percentage:.1f}%). Consider imputation or removal.")
        
        # Duplicate recommendations
        duplicate_percentage = quality_report["duplicates"]["duplicate_percentage"]
        if duplicate_percentage > 1:
            recommendations.append(f"Duplicate rows detected ({duplicate_percentage:.1f}%). Consider removing duplicates.")
        
        # Outlier recommendations
        high_outlier_cols = []
        for col, info in quality_report["outliers"].items():
            if info["percentage"] > 5:
                high_outlier_cols.append(col)
        
        if high_outlier_cols:
            recommendations.append(f"High outlier percentage in columns: {', '.join(high_outlier_cols)}")
        
        # Data type recommendations
        for col, info in quality_report["data_types"].items():
            if info["current_type"] != info["suggested_type"]:
                recommendations.append(f"Consider converting column '{col}' from {info['current_type']} to {info['suggested_type']}")
        
        if not recommendations:
            recommendations.append("Data quality looks good! No major issues detected.")
        
        return recommendations
    
    def remove_duplicates(self, df: pd.DataFrame, subset: Optional[List[str]] = None, keep: str = 'first') -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Remove duplicate rows"""
        start_time = time.time()
        original_count = len(df)
        
        df_cleaned = df.drop_duplicates(subset=subset, keep=keep)
        removed_count = original_count - len(df_cleaned)
        
        processing_time = time.time() - start_time
        
        result = {
            "rows_removed": removed_count,
            "rows_remaining": len(df_cleaned),
            "processing_time": processing_time
        }
        
        logger.info("Duplicates removed", **result)
        return df_cleaned, result
    
    def handle_missing_values(self, df: pd.DataFrame, strategy: str = 'auto', columns: Optional[List[str]] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Handle missing values using various strategies"""
        start_time = time.time()
        original_missing = df.isnull().sum().sum()
        
        df_cleaned = df.copy()
        
        if columns is None:
            columns = df.columns.tolist()
        
        for col in columns:
            if col in df.columns and df[col].isnull().any():
                if strategy == 'auto':
                    # Auto-detect strategy based on data type
                    if pd.api.types.is_numeric_dtype(df[col]):
                        strategy = 'mean'
                    else:
                        strategy = 'mode'
                elif strategy == 'drop':
                    df_cleaned = df_cleaned.dropna(subset=[col])
                else:
                    # Use imputation
                    imputer = SimpleImputer(strategy=strategy)
                    df_cleaned[col] = imputer.fit_transform(df_cleaned[[col]])
        
        final_missing = df_cleaned.isnull().sum().sum()
        filled_count = original_missing - final_missing
        
        processing_time = time.time() - start_time
        
        result = {
            "missing_values_filled": filled_count,
            "remaining_missing": final_missing,
            "strategy_used": strategy,
            "processing_time": processing_time
        }
        
        logger.info("Missing values handled", **result)
        return df_cleaned, result
    
    def remove_outliers(self, df: pd.DataFrame, method: str = 'iqr', columns: Optional[List[str]] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Remove outliers using various methods"""
        start_time = time.time()
        original_count = len(df)
        
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        df_cleaned = df.copy()
        removed_by_column = {}
        
        for col in columns:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                if method == 'iqr':
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    mask = (df_cleaned[col] >= lower_bound) & (df_cleaned[col] <= upper_bound)
                    removed_count = (~mask).sum()
                    df_cleaned = df_cleaned[mask]
                    
                elif method == 'zscore':
                    z_scores = np.abs(stats.zscore(df_cleaned[col].dropna()))
                    mask = z_scores < 3
                    removed_count = (~mask).sum()
                    df_cleaned = df_cleaned[mask]
                    
                elif method == 'isolation_forest':
                    iso_forest = IsolationForest(contamination=0.1, random_state=42)
                    outliers = iso_forest.fit_predict(df_cleaned[[col]]) == -1
                    mask = ~outliers
                    removed_count = outliers.sum()
                    df_cleaned = df_cleaned[mask]
                
                removed_by_column[col] = removed_count
        
        total_removed = original_count - len(df_cleaned)
        processing_time = time.time() - start_time
        
        result = {
            "rows_removed": total_removed,
            "rows_remaining": len(df_cleaned),
            "removed_by_column": removed_by_column,
            "method_used": method,
            "processing_time": processing_time
        }
        
        logger.info("Outliers removed", **result)
        return df_cleaned, result
    
    def normalize_data(self, df: pd.DataFrame, method: str = 'standard', columns: Optional[List[str]] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Normalize numeric data"""
        start_time = time.time()
        
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        df_normalized = df.copy()
        scalers = {}
        
        for col in columns:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                if method == 'standard':
                    scaler = StandardScaler()
                elif method == 'minmax':
                    scaler = MinMaxScaler()
                else:
                    raise ValueError(f"Unknown normalization method: {method}")
                
                df_normalized[col] = scaler.fit_transform(df_normalized[[col]])
                scalers[col] = scaler
        
        processing_time = time.time() - start_time
        
        result = {
            "columns_normalized": list(scalers.keys()),
            "method_used": method,
            "processing_time": processing_time
        }
        
        logger.info("Data normalized", **result)
        return df_normalized, result
    
    def encode_categorical(self, df: pd.DataFrame, columns: Optional[List[str]] = None, method: str = 'label') -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Encode categorical variables"""
        start_time = time.time()
        
        if columns is None:
            columns = df.select_dtypes(include=['object']).columns.tolist()
        
        df_encoded = df.copy()
        encoders = {}
        
        for col in columns:
            if col in df.columns and df[col].dtype == 'object':
                if method == 'label':
                    encoder = LabelEncoder()
                    df_encoded[col] = encoder.fit_transform(df_encoded[col].astype(str))
                elif method == 'onehot':
                    df_encoded = pd.get_dummies(df_encoded, columns=[col], prefix=col)
                
                encoders[col] = encoder if method == 'label' else 'onehot'
        
        processing_time = time.time() - start_time
        
        result = {
            "columns_encoded": list(encoders.keys()),
            "method_used": method,
            "processing_time": processing_time
        }
        
        logger.info("Categorical data encoded", **result)
        return df_encoded, result


# Global data processor instance
data_processor = DataProcessor()
