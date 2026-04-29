"""
Data cleaning endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import structlog
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user, require_advanced_access
from app.models.user import User
from app.models.dataset import Dataset
from app.models.cleaning_operation import CleaningOperation, CleaningOperationType, CleaningOperationStatus
from app.schemas.cleaning_operation import CleaningOperationCreate, CleaningOperationUpdate, CleaningOperationResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/operations", response_model=List[CleaningOperationResponse])
async def get_cleaning_operations(
    dataset_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get cleaning operations for user or specific dataset"""
    try:
        query = db.query(CleaningOperation).filter(CleaningOperation.user_id == current_user.id)
        
        if dataset_id:
            query = query.filter(CleaningOperation.dataset_id == dataset_id)
        
        operations = query.order_by(CleaningOperation.created_at.desc()).offset(skip).limit(limit).all()
        
        return operations
    except Exception as e:
        logger.error("Failed to get cleaning operations", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cleaning operations"
        )


@router.post("/start", response_model=CleaningOperationResponse)
async def start_cleaning_operation(
    operation_data: CleaningOperationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a cleaning operation"""
    try:
        # Verify dataset exists and belongs to user
        dataset = db.query(Dataset).filter(
            Dataset.id == operation_data.dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        # Create cleaning operation
        operation = CleaningOperation(
            name=operation_data.name,
            description=operation_data.description,
            operation_type=operation_data.operation_type,
            parameters=operation_data.parameters or {},
            target_columns=operation_data.target_columns or [],
            dataset_id=operation_data.dataset_id,
            user_id=current_user.id,
            status=CleaningOperationStatus.PENDING
        )
        
        db.add(operation)
        db.commit()
        db.refresh(operation)
        
        # Start background processing
        background_tasks.add_task(process_cleaning_operation, operation.id, db)
        
        logger.info("Cleaning operation started", 
                   operation_id=operation.id,
                   dataset_id=operation_data.dataset_id,
                   operation_type=operation_data.operation_type.value)
        
        return operation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start cleaning operation", error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start cleaning operation"
        )


@router.get("/operation/{operation_id}", response_model=CleaningOperationResponse)
async def get_cleaning_operation(
    operation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get cleaning operation details"""
    try:
        operation = db.query(CleaningOperation).filter(
            CleaningOperation.id == operation_id,
            CleaningOperation.user_id == current_user.id
        ).first()
        
        if not operation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cleaning operation not found"
            )
        
        return operation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get cleaning operation", operation_id=operation_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cleaning operation"
        )


@router.post("/operation/{operation_id}/cancel")
async def cancel_cleaning_operation(
    operation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a cleaning operation"""
    try:
        operation = db.query(CleaningOperation).filter(
            CleaningOperation.id == operation_id,
            CleaningOperation.user_id == current_user.id
        ).first()
        
        if not operation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cleaning operation not found"
            )
        
        if operation.status not in [CleaningOperationStatus.PENDING, CleaningOperationStatus.PROCESSING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation cannot be cancelled"
            )
        
        operation.status = CleaningOperationStatus.CANCELLED
        db.commit()
        
        logger.info("Cleaning operation cancelled", operation_id=operation_id)
        
        return {"message": "Cleaning operation cancelled"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to cancel cleaning operation", operation_id=operation_id, error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel cleaning operation"
        )


@router.get("/suggestions/{dataset_id}")
async def get_cleaning_suggestions(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered cleaning suggestions for dataset using ML Engine Service"""
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
        
        # Call ML Engine Service for suggestions
        import httpx
        from app.core.config import settings
        
        ml_engine_url = f"{settings.ML_ENGINE_URL}/api/v1/suggestions/generate"
        
        # Prepare request payload
        payload = {
            "file_path": dataset.file_path,
            "max_suggestions": 10
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(ml_engine_url, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
        
        # Convert ML Engine suggestions to our format
        suggestions = []
        for suggestion in result.get("suggestions", []):
            suggestions.append({
                "type": suggestion["type"],
                "operation": suggestion["parameters"].get("operation", ""),
                "description": suggestion["description"],
                "columns": suggestion["parameters"].get("columns", []),
                "priority": suggestion["priority"],
                "estimated_impact": suggestion["expected_impact"],
                "confidence": suggestion["confidence"]
            })
        
        return {
            "dataset_id": dataset_id,
            "suggestions": suggestions,
            "total_suggestions": len(suggestions),
            "data_insights": result.get("data_insights", {}),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get cleaning suggestions", dataset_id=dataset_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate cleaning suggestions"
        )


@router.post("/auto-clean/{dataset_id}")
async def auto_clean_dataset(
    dataset_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Automatically clean dataset using AI suggestions"""
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
        
        # Get suggestions
        suggestions_response = await get_cleaning_suggestions(dataset_id, current_user, db)
        suggestions = suggestions_response["suggestions"]
        
        if not suggestions:
            return {"message": "No cleaning operations needed"}
        
        # Create operations for high and medium priority suggestions
        operations_created = []
        for suggestion in suggestions:
            if suggestion["priority"] in ["high", "medium"]:
                operation = CleaningOperation(
                    name=f"Auto: {suggestion['description']}",
                    description=f"Automatically generated cleaning operation for {suggestion['type']}",
                    operation_type=suggestion["operation"],
                    parameters={},
                    target_columns=suggestion.get("columns", []),
                    dataset_id=dataset_id,
                    user_id=current_user.id,
                    status=CleaningOperationStatus.PENDING
                )
                
                db.add(operation)
                operations_created.append(operation)
        
        db.commit()
        
        # Start background processing for all operations
        for operation in operations_created:
            background_tasks.add_task(process_cleaning_operation, operation.id, db)
        
        logger.info("Auto-clean operations created", 
                   dataset_id=dataset_id,
                   operations_count=len(operations_created))
        
        return {
            "message": f"Created {len(operations_created)} cleaning operations",
            "operations": [op.id for op in operations_created],
            "started_processing": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to auto-clean dataset", dataset_id=dataset_id, error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to auto-clean dataset"
        )


@router.get("/operation-types")
async def get_cleaning_operation_types():
    """Get available cleaning operation types"""
    return {
        "operation_types": [
            {
                "value": CleaningOperationType.REMOVE_DUPLICATES.value,
                "label": "Remove Duplicates",
                "description": "Remove duplicate rows from the dataset",
                "category": "data_quality"
            },
            {
                "value": CleaningOperationType.HANDLE_MISSING_VALUES.value,
                "label": "Handle Missing Values",
                "description": "Fill or remove missing values in the dataset",
                "category": "data_quality"
            },
            {
                "value": CleaningOperationType.REMOVE_OUTLIERS.value,
                "label": "Remove Outliers",
                "description": "Remove statistical outliers from numeric columns",
                "category": "data_quality"
            },
            {
                "value": CleaningOperationType.DATA_TYPE_CONVERSION.value,
                "label": "Data Type Conversion",
                "description": "Convert column data types",
                "category": "transformation"
            },
            {
                "value": CleaningOperationType.STRING_CLEANING.value,
                "label": "String Cleaning",
                "description": "Clean and standardize string values",
                "category": "transformation"
            },
            {
                "value": CleaningOperationType.NORMALIZATION.value,
                "label": "Normalization",
                "description": "Normalize numeric columns",
                "category": "transformation"
            },
            {
                "value": CleaningOperationType.ENCODING.value,
                "label": "Encoding",
                "description": "Encode categorical variables",
                "category": "transformation"
            },
            {
                "value": CleaningOperationType.CUSTOM_TRANSFORMATION.value,
                "label": "Custom Transformation",
                "description": "Apply custom data transformation",
                "category": "custom"
            }
        ]
    }


async def process_cleaning_operation(operation_id: int, db: Session):
    """Background task to process cleaning operation using ML Engine Service"""
    try:
        # Get operation
        operation = db.query(CleaningOperation).filter(CleaningOperation.id == operation_id).first()
        if not operation:
            logger.error("Cleaning operation not found", operation_id=operation_id)
            return
        
        # Update status to processing
        operation.status = CleaningOperationStatus.PROCESSING
        operation.started_at = datetime.utcnow()
        db.commit()
        
        # Get dataset
        dataset = db.query(Dataset).filter(Dataset.id == operation.dataset_id).first()
        if not dataset:
            raise Exception("Dataset not found")
        
        # Call ML Engine Service
        import httpx
        from app.core.config import settings
        
        ml_engine_url = f"{settings.ML_ENGINE_URL}/api/v1/cleaning/process"
        
        # Prepare request payload
        payload = {
            "file_path": dataset.file_path,
            "operation_type": operation.operation_type.value,
            "parameters": operation.parameters or {},
            "target_columns": operation.target_columns or []
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(ml_engine_url, json=payload, timeout=300)
            response.raise_for_status()
            
            result = response.json()
        
        # Update operation with results
        operation.status = CleaningOperationStatus.COMPLETED
        operation.completed_at = datetime.utcnow()
        operation.progress = 100
        operation.rows_affected = result.get("results", {}).get("rows_affected", 0)
        operation.rows_removed = result.get("results", {}).get("rows_removed", 0)
        operation.rows_modified = result.get("results", {}).get("rows_modified", 0)
        operation.processing_time = int(result.get("processing_time", 0))
        operation.quality_improvement = {
            "before": result.get("results", {}).get("initial_quality_score", 0),
            "after": result.get("results", {}).get("final_quality_score", 0)
        }
        
        # Update dataset with cleaned file path if available
        if "cleaned_file_path" in result.get("results", {}):
            dataset.file_path = result["results"]["cleaned_file_path"]
            dataset.status = DatasetStatus.CLEANED
            dataset.processed_at = datetime.utcnow()
        
        db.commit()
        
        logger.info("Cleaning operation completed", 
                   operation_id=operation_id,
                   processing_time=operation.processing_time,
                   quality_improvement=operation.quality_improvement)
        
    except Exception as e:
        logger.error("Failed to process cleaning operation", operation_id=operation_id, error=str(e))
        
        # Update operation status to failed
        try:
            operation = db.query(CleaningOperation).filter(CleaningOperation.id == operation_id).first()
            if operation:
                operation.status = CleaningOperationStatus.FAILED
                operation.error_message = str(e)
                db.commit()
        except Exception as update_error:
            logger.error("Failed to update operation status", operation_id=operation_id, error=str(update_error))
