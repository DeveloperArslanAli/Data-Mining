"""
ML Engine Service - Quality Assessment Endpoints
"""

from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import structlog

from app.ml.data_processor import data_processor
from app.core.cache import cache_manager

logger = structlog.get_logger(__name__)

router = APIRouter()


class QualityReport(BaseModel):
    """Quality assessment report model"""
    file_path: str
    basic_info: Dict[str, Any]
    missing_values: Dict[str, Any]
    duplicates: Dict[str, Any]
    outliers: Dict[str, Any]
    data_types: Dict[str, Any]
    statistical_summary: Dict[str, Any]
    quality_score: float
    recommendations: List[str]


@router.get("/assess/{file_path}", response_model=QualityReport)
async def assess_data_quality(file_path: str):
    """Comprehensive data quality assessment"""
    try:
        # Check cache first
        cache_key = f"quality_assessment_{hash(file_path)}"
        cached_result = cache_manager.get(cache_key)
        
        if cached_result:
            logger.info("Quality assessment retrieved from cache", file_path=file_path)
            return QualityReport(file_path=file_path, **cached_result)
        
        # Load dataset and assess quality
        logger.info("Assessing data quality", file_path=file_path)
        df = data_processor.load_dataset(file_path)
        quality_report = data_processor.assess_data_quality(df)
        
        # Cache result
        cache_manager.set(cache_key, quality_report, ttl=1800)  # 30 minutes
        
        return QualityReport(file_path=file_path, **quality_report)
        
    except Exception as e:
        logger.error("Failed to assess data quality", file_path=file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assess data quality: {str(e)}"
        )


@router.get("/summary/{file_path}")
async def get_quality_summary(file_path: str):
    """Get quick quality summary"""
    try:
        # Check cache first
        cache_key = f"quality_summary_{hash(file_path)}"
        cached_result = cache_manager.get(cache_key)
        
        if cached_result:
            return cached_result
        
        # Load dataset and get basic quality info
        df = data_processor.load_dataset(file_path)
        quality_report = data_processor.assess_data_quality(df)
        
        summary = {
            "file_path": file_path,
            "rows": quality_report["basic_info"]["rows"],
            "columns": quality_report["basic_info"]["columns"],
            "quality_score": quality_report["quality_score"],
            "missing_percentage": quality_report["missing_values"]["missing_percentage"],
            "duplicate_percentage": quality_report["duplicates"]["duplicate_percentage"],
            "has_outliers": len(quality_report["outliers"]) > 0,
            "top_recommendations": quality_report["recommendations"][:3]
        }
        
        # Cache result
        cache_manager.set(cache_key, summary, ttl=900)  # 15 minutes
        
        return summary
        
    except Exception as e:
        logger.error("Failed to get quality summary", file_path=file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get quality summary: {str(e)}"
        )


@router.get("/missing-values/{file_path}")
async def analyze_missing_values(file_path: str):
    """Detailed missing values analysis"""
    try:
        df = data_processor.load_dataset(file_path)
        quality_report = data_processor.assess_data_quality(df)
        
        return {
            "file_path": file_path,
            "missing_values": quality_report["missing_values"],
            "columns_with_missing": list(quality_report["missing_values"]["columns_with_missing"].keys()),
            "total_missing": quality_report["missing_values"]["total_missing"],
            "missing_percentage": quality_report["missing_values"]["missing_percentage"]
        }
        
    except Exception as e:
        logger.error("Failed to analyze missing values", file_path=file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze missing values: {str(e)}"
        )


@router.get("/outliers/{file_path}")
async def analyze_outliers(file_path: str):
    """Detailed outliers analysis"""
    try:
        df = data_processor.load_dataset(file_path)
        quality_report = data_processor.assess_data_quality(df)
        
        return {
            "file_path": file_path,
            "outliers": quality_report["outliers"],
            "columns_with_outliers": list(quality_report["outliers"].keys()),
            "total_outliers": sum(info["count"] for info in quality_report["outliers"].values())
        }
        
    except Exception as e:
        logger.error("Failed to analyze outliers", file_path=file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze outliers: {str(e)}"
        )


@router.get("/data-types/{file_path}")
async def analyze_data_types(file_path: str):
    """Data type analysis and conversion suggestions"""
    try:
        df = data_processor.load_dataset(file_path)
        quality_report = data_processor.assess_data_quality(df)
        
        return {
            "file_path": file_path,
            "data_types": quality_report["data_types"],
            "conversion_suggestions": [
                {
                    "column": col,
                    "current_type": info["current_type"],
                    "suggested_type": info["suggested_type"],
                    "reason": f"Column has {info['unique_values']} unique values and {info['null_count']} null values"
                }
                for col, info in quality_report["data_types"].items()
                if info["current_type"] != info["suggested_type"]
            ]
        }
        
    except Exception as e:
        logger.error("Failed to analyze data types", file_path=file_path, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze data types: {str(e)}"
        )
