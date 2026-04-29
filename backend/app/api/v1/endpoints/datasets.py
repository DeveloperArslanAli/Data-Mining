"""
Dataset management endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import structlog
import os
import shutil
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.models.dataset import Dataset, DatasetStatus, DatasetFormat
from app.schemas.dataset import DatasetResponse, DatasetList, DatasetUploadResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=DatasetList)
async def get_datasets(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's datasets"""
    try:
        # Get total count
        total = db.query(Dataset).filter(Dataset.owner_id == current_user.id).count()
        
        # Get datasets with pagination
        datasets = db.query(Dataset).filter(
            Dataset.owner_id == current_user.id
        ).offset(skip).limit(limit).all()
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        
        return DatasetList(
            datasets=datasets,
            total=total,
            page=page,
            size=limit,
            pages=pages
        )
    except Exception as e:
        logger.error("Failed to get datasets", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve datasets"
        )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dataset by ID"""
    try:
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        return dataset
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get dataset", dataset_id=dataset_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dataset"
        )


@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = None,
    description: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a new dataset"""
    try:
        # Validate file type
        file_extension = file.filename.split('.')[-1].lower()
        allowed_extensions = [fmt.value for fmt in DatasetFormat]
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024)} MB"
            )
        
        # Generate filename and path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{current_user.id}_{timestamp}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_PATH, safe_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create dataset record
        dataset = Dataset(
            name=name or file.filename,
            description=description,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            format=DatasetFormat(file_extension),
            owner_id=current_user.id,
            status=DatasetStatus.UPLOADED
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        logger.info("Dataset uploaded successfully", 
                   dataset_id=dataset.id, 
                   filename=file.filename,
                   user_id=current_user.id)
        
        return DatasetUploadResponse(
            dataset=dataset,
            message="Dataset uploaded successfully",
            processing_started=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to upload dataset", error=str(e))
        # Clean up file if it was created
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload dataset"
        )


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete dataset"""
    try:
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        # Delete file from storage
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        
        # Delete from database
        db.delete(dataset)
        db.commit()
        
        logger.info("Dataset deleted successfully", 
                   dataset_id=dataset_id,
                   user_id=current_user.id)
        
        return {"message": "Dataset deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete dataset", dataset_id=dataset_id, error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete dataset"
        )


@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: int,
    rows: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Preview dataset data"""
    try:
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        # For MVP, return basic info
        # TODO: Implement actual data preview based on file format
        preview_data = {
            "dataset_id": dataset.id,
            "name": dataset.name,
            "format": dataset.format,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
            "column_names": dataset.column_names,
            "sample_data": dataset.sample_data,
            "status": dataset.status,
            "quality_score": dataset.get_quality_score() if dataset.row_count else None
        }
        
        return preview_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to preview dataset", dataset_id=dataset_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to preview dataset"
        )


@router.get("/{dataset_id}/quality-report")
async def get_quality_report(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dataset quality report"""
    try:
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        if not dataset.is_processed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset not yet processed"
            )
        
        # Generate quality report
        report = {
            "dataset_id": dataset.id,
            "total_rows": dataset.row_count,
            "total_columns": dataset.column_count,
            "missing_values": dataset.missing_values_count or {},
            "duplicate_rows": dataset.duplicate_rows_count or 0,
            "outliers": dataset.outlier_count or {},
            "quality_score": dataset.get_quality_score(),
            "recommendations": [],
            "generated_at": datetime.utcnow()
        }
        
        # Generate recommendations based on quality issues
        if dataset.missing_values_count:
            missing_cols = [col for col, count in dataset.missing_values_count.items() if count > 0]
            if missing_cols:
                report["recommendations"].append(f"Consider handling missing values in columns: {', '.join(missing_cols)}")
        
        if dataset.duplicate_rows_count and dataset.duplicate_rows_count > 0:
            report["recommendations"].append(f"Remove {dataset.duplicate_rows_count} duplicate rows")
        
        if not report["recommendations"]:
            report["recommendations"].append("Dataset quality looks good!")
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get quality report", dataset_id=dataset_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quality report"
        )
