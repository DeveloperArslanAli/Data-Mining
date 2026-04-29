"""
Data export endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import structlog

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.export_job import ExportJob, ExportFormat, ExportJobStatus

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/jobs", response_model=List[dict])
async def get_export_jobs(
    dataset_id: int = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get export jobs for user or specific dataset"""
    try:
        query = db.query(ExportJob).filter(ExportJob.user_id == current_user.id)
        
        if dataset_id:
            query = query.filter(ExportJob.dataset_id == dataset_id)
        
        jobs = query.order_by(ExportJob.created_at.desc()).all()
        
        return jobs
    except Exception as e:
        logger.error("Failed to get export jobs", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve export jobs"
        )


@router.post("/start")
async def start_export_job(
    dataset_id: int,
    export_format: ExportFormat,
    name: str = None,
    description: str = None,
    include_headers: List[str] = None,
    exclude_headers: List[str] = None,
    filters: dict = None,
    sorting: dict = None,
    limit_rows: int = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start an export job"""
    try:
        # Verify dataset exists and belongs to user
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        # Create export job
        job = ExportJob(
            name=name or f"Export {dataset.name} to {export_format.value}",
            description=description,
            export_format=export_format,
            include_headers=include_headers,
            exclude_headers=exclude_headers,
            filters=filters,
            sorting=sorting,
            limit_rows=limit_rows,
            dataset_id=dataset_id,
            user_id=current_user.id,
            status=ExportJobStatus.PENDING
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # TODO: Start async export process
        # For MVP, we'll just mark it as completed immediately
        
        logger.info("Export job started", 
                   job_id=job.id,
                   dataset_id=dataset_id,
                   format=export_format.value)
        
        return {
            "job_id": job.id,
            "status": job.status,
            "message": "Export job started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start export job", error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start export job"
        )


@router.get("/job/{job_id}")
async def get_export_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get export job details"""
    try:
        job = db.query(ExportJob).filter(
            ExportJob.id == job_id,
            ExportJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )
        
        return job
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get export job", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve export job"
        )


@router.post("/job/{job_id}/cancel")
async def cancel_export_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel an export job"""
    try:
        job = db.query(ExportJob).filter(
            ExportJob.id == job_id,
            ExportJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )
        
        if job.status not in [ExportJobStatus.PENDING, ExportJobStatus.PROCESSING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job cannot be cancelled"
            )
        
        job.status = ExportJobStatus.CANCELLED
        db.commit()
        
        logger.info("Export job cancelled", job_id=job_id)
        
        return {"message": "Export job cancelled"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to cancel export job", job_id=job_id, error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel export job"
        )


@router.get("/job/{job_id}/download")
async def download_export(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download exported file"""
    try:
        job = db.query(ExportJob).filter(
            ExportJob.id == job_id,
            ExportJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )
        
        if job.status != ExportJobStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Export job not completed"
            )
        
        if not job.file_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export file not found"
            )
        
        # TODO: Implement file download
        # For MVP, return file info
        
        return {
            "job_id": job.id,
            "file_path": job.file_path,
            "file_size": job.file_size,
            "format": job.export_format,
            "download_url": f"/api/v1/export/job/{job_id}/file"  # Placeholder
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get download info", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get download information"
        )


@router.get("/job/{job_id}/file")
async def serve_export_file(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Serve the exported file as a download when the job is completed."""
    try:
        job = db.query(ExportJob).filter(
            ExportJob.id == job_id,
            ExportJob.user_id == current_user.id
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )

        if job.status != ExportJobStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Export job not completed"
            )

        if not job.file_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export file not found"
            )

        # Map format to mime
        format_to_mime = {
            ExportFormat.CSV: "text/csv",
            ExportFormat.JSON: "application/json",
            ExportFormat.XML: "application/xml",
            ExportFormat.XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ExportFormat.PARQUET: "application/octet-stream",
            ExportFormat.SQL: "application/sql",
        }
        media_type = format_to_mime.get(job.export_format, "application/octet-stream")

        filename = job.name
        # Ensure a sensible filename with extension
        ext_map = {
            ExportFormat.CSV: ".csv",
            ExportFormat.JSON: ".json",
            ExportFormat.XML: ".xml",
            ExportFormat.XLSX: ".xlsx",
            ExportFormat.PARQUET: ".parquet",
            ExportFormat.SQL: ".sql",
        }
        ext = ext_map.get(job.export_format, "")
        if not filename.lower().endswith(ext):
            filename = f"{filename}{ext}"

        return FileResponse(
            job.file_path,
            media_type=media_type,
            filename=filename
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to serve export file", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to serve export file"
        )


@router.get("/formats")
async def get_supported_formats():
    """Get supported export formats"""
    return {
        "formats": [
            {
                "value": ExportFormat.CSV.value,
                "label": "CSV (Comma Separated Values)",
                "description": "Standard CSV format for spreadsheet applications"
            },
            {
                "value": ExportFormat.JSON.value,
                "label": "JSON (JavaScript Object Notation)",
                "description": "Structured data format for APIs and web applications"
            },
            {
                "value": ExportFormat.XML.value,
                "label": "XML (Extensible Markup Language)",
                "description": "Markup language for structured data"
            },
            {
                "value": ExportFormat.XLSX.value,
                "label": "Excel (XLSX)",
                "description": "Microsoft Excel format with multiple sheets"
            },
            {
                "value": ExportFormat.PARQUET.value,
                "label": "Parquet",
                "description": "Columnar storage format for big data processing"
            },
            {
                "value": ExportFormat.SQL.value,
                "label": "SQL",
                "description": "SQL INSERT statements with database schema"
            }
        ]
    }


@router.get("/dataset/{dataset_id}/quick-export")
async def quick_export(
    dataset_id: int,
    format: ExportFormat,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Quick export without advanced options"""
    try:
        # Verify dataset exists and belongs to user
        dataset = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id
        ).first()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
        # Create export job with default settings
        job = ExportJob(
            name=f"Quick export: {dataset.name} to {format.value}",
            export_format=format,
            dataset_id=dataset_id,
            user_id=current_user.id,
            status=ExportJobStatus.PENDING
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        logger.info("Quick export started", 
                   job_id=job.id,
                   dataset_id=dataset_id,
                   format=format.value)
        
        return {
            "job_id": job.id,
            "status": job.status,
            "message": "Quick export started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start quick export", error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start quick export"
        )
