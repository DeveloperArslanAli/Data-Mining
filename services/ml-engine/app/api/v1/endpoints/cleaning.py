"""
ML Engine Service - Cleaning Endpoints
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import structlog
import time

from app.ml.data_processor import data_processor
from app.core.cache import cache_manager

logger = structlog.get_logger(__name__)

router = APIRouter()


class CleaningRequest(BaseModel):
    """Request model for cleaning operations"""
    file_path: str
    operation_type: str
    parameters: Optional[Dict[str, Any]] = None
    target_columns: Optional[List[str]] = None


class CleaningResponse(BaseModel):
    """Response model for cleaning operations"""
    operation_id: str
    status: str
    results: Dict[str, Any]
    processing_time: float
    quality_improvement: Optional[float] = None


@router.post("/process", response_model=CleaningResponse)
async def process_cleaning_operation(request: CleaningRequest):
    """Process a cleaning operation using actual ML algorithms"""
    start_time = time.time()
    
    try:
        # Load dataset
        logger.info("Loading dataset for cleaning", file_path=request.file_path)
        df = data_processor.load_dataset(request.file_path)
        
        # Get initial quality score
        initial_quality = data_processor.assess_data_quality(df)
        initial_score = initial_quality["quality_score"]
        
        # Process based on operation type
        if request.operation_type == "remove_duplicates":
            subset = request.parameters.get("subset") if request.parameters else None
            keep = request.parameters.get("keep", "first") if request.parameters else "first"
            
            df_cleaned, results = data_processor.remove_duplicates(df, subset=subset, keep=keep)
            
        elif request.operation_type == "handle_missing_values":
            strategy = request.parameters.get("strategy", "auto") if request.parameters else "auto"
            columns = request.target_columns
            
            df_cleaned, results = data_processor.handle_missing_values(df, strategy=strategy, columns=columns)
            
        elif request.operation_type == "remove_outliers":
            method = request.parameters.get("method", "iqr") if request.parameters else "iqr"
            columns = request.target_columns
            
            df_cleaned, results = data_processor.remove_outliers(df, method=method, columns=columns)
            
        elif request.operation_type == "normalization":
            method = request.parameters.get("method", "standard") if request.parameters else "standard"
            columns = request.target_columns
            
            df_cleaned, results = data_processor.normalize_data(df, method=method, columns=columns)
            
        elif request.operation_type == "encoding":
            method = request.parameters.get("method", "label") if request.parameters else "label"
            columns = request.target_columns
            
            df_cleaned, results = data_processor.encode_categorical(df, method=method, columns=columns)
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported operation type: {request.operation_type}"
            )
        
        # Get final quality score
        final_quality = data_processor.assess_data_quality(df_cleaned)
        final_score = final_quality["quality_score"]
        
        # Calculate quality improvement
        quality_improvement = final_score - initial_score if initial_score > 0 else 0
        
        # Save cleaned dataset
        import os
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        cleaned_file_path = f"{request.file_path}_cleaned_{timestamp}.csv"
        df_cleaned.to_csv(cleaned_file_path, index=False)
        
        processing_time = time.time() - start_time
        
        # Cache results
        cache_key = f"cleaning_result_{hash(request.file_path + request.operation_type)}"
        cache_manager.set(cache_key, {
            "cleaned_file_path": cleaned_file_path,
            "results": results,
            "quality_improvement": quality_improvement
        }, ttl=3600)
        
        response = CleaningResponse(
            operation_id=f"clean_{timestamp}",
            status="completed",
            results={
                **results,
                "cleaned_file_path": cleaned_file_path,
                "initial_quality_score": initial_score,
                "final_quality_score": final_score
            },
            processing_time=processing_time,
            quality_improvement=quality_improvement
        )
        
        logger.info("Cleaning operation completed successfully",
                   operation_type=request.operation_type,
                   processing_time=processing_time,
                   quality_improvement=quality_improvement)
        
        return response
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error("Cleaning operation failed",
                    operation_type=request.operation_type,
                    error=str(e),
                    processing_time=processing_time)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleaning operation failed: {str(e)}"
        )


@router.get("/quality/{file_path}")
async def get_data_quality(file_path: str):
    """Get comprehensive data quality assessment"""
    try:
        # Check cache first
        cache_key = f"quality_assessment_{hash(file_path)}"
        cached_result = cache_manager.get(cache_key)
        
        if cached_result:
            logger.info("Quality assessment retrieved from cache", file_path=file_path)
            return cached_result
        
        # Load dataset and assess quality
        logger.info("Assessing data quality", file_path=file_path)
        df = data_processor.load_dataset(file_path)
        quality_report = data_processor.assess_data_quality(df)
        
        # Cache result
        cache_manager.set(cache_key, quality_report, ttl=1800)  # 30 minutes
        
        return quality_report
        
    except Exception as e:
        logger.error("Failed to assess data quality", file_path=file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assess data quality: {str(e)}"
        )


@router.get("/operations")
async def get_supported_operations():
    """Get list of supported cleaning operations"""
    return {
        "operations": [
            {
                "type": "remove_duplicates",
                "name": "Remove Duplicates",
                "description": "Remove duplicate rows from the dataset",
                "parameters": {
                    "subset": "List of column names to consider for duplicates",
                    "keep": "Which duplicates to keep ('first', 'last', False)"
                }
            },
            {
                "type": "handle_missing_values",
                "name": "Handle Missing Values",
                "description": "Fill or remove missing values in the dataset",
                "parameters": {
                    "strategy": "Imputation strategy ('auto', 'mean', 'median', 'mode', 'drop')"
                }
            },
            {
                "type": "remove_outliers",
                "name": "Remove Outliers",
                "description": "Remove statistical outliers from numeric columns",
                "parameters": {
                    "method": "Outlier detection method ('iqr', 'zscore', 'isolation_forest')"
                }
            },
            {
                "type": "normalization",
                "name": "Normalization",
                "description": "Normalize numeric columns",
                "parameters": {
                    "method": "Normalization method ('standard', 'minmax')"
                }
            },
            {
                "type": "encoding",
                "name": "Encoding",
                "description": "Encode categorical variables",
                "parameters": {
                    "method": "Encoding method ('label', 'onehot')"
                }
            }
        ]
    }
