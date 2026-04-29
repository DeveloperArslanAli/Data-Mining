"""
Web crawling endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import structlog
from datetime import datetime
import re
from urllib.parse import urlparse

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/start")
async def start_crawling_job(
    urls: List[str],
    max_depth: int = 2,
    max_pages: int = 100,
    delay: int = 1000,
    follow_links: bool = True,
    extract_data: bool = True,
    data_selectors: Optional[Dict[str, str]] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a web crawling job"""
    try:
        # Validate URLs
        if not urls:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one URL is required"
            )
        
        # Validate each URL
        for url in urls:
            if not is_valid_url(url):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid URL format: {url}"
                )
        
        # Validate parameters
        if max_depth < 1 or max_depth > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Max depth must be between 1 and 5"
            )
        
        if max_pages < 1 or max_pages > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Max pages must be between 1 and 1000"
            )
        
        if delay < 0 or delay > 10000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delay must be between 0 and 10000 milliseconds"
            )
        
        # TODO: Create crawling job and start async process
        # For MVP, return mock response with job ID
        
        job_id = generate_job_id()
        
        # Start background crawling task
        background_tasks = BackgroundTasks()
        background_tasks.add_task(
            process_crawling_job,
            job_id,
            urls,
            max_depth,
            max_pages,
            delay,
            follow_links,
            extract_data,
            data_selectors,
            current_user.id
        )
        
        logger.info("Crawling job started", 
                   job_id=job_id,
                   urls=urls,
                   user_id=current_user.id)
        
        return {
            "job_id": job_id,
            "status": "pending",
            "message": "Crawling job started",
            "urls": urls,
            "max_depth": max_depth,
            "max_pages": max_pages,
            "delay": delay,
            "follow_links": follow_links,
            "extract_data": extract_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start crawling job", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start crawling job"
        )


@router.get("/jobs")
async def get_crawling_jobs(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's crawling jobs from Crawling Service"""
    try:
        import httpx
        from app.core.config import settings
        
        crawling_service_url = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/jobs"
        
        params = {
            "userId": str(current_user.id),
            "limit": limit,
            "offset": skip
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(crawling_service_url, params=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
        return result
        
    except Exception as e:
        logger.error("Failed to get crawling jobs", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve crawling jobs"
        )


@router.get("/job/{job_id}")
async def get_crawling_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get crawling job details from Crawling Service"""
    try:
        import httpx
        from app.core.config import settings
        
        crawling_service_url = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/job/{job_id}"
        
        params = {
            "userId": str(current_user.id)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(crawling_service_url, params=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
        return result
        
    except Exception as e:
        logger.error("Failed to get crawling job", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve crawling job"
        )


@router.post("/job/{job_id}/cancel")
async def cancel_crawling_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a crawling job via Crawling Service"""
    try:
        import httpx
        from app.core.config import settings
        
        crawling_service_url = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/job/{job_id}/cancel"
        
        payload = {
            "userId": str(current_user.id)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(crawling_service_url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
        logger.info("Crawling job cancelled", job_id=job_id, user_id=current_user.id)
        
        return result
        
    except Exception as e:
        logger.error("Failed to cancel crawling job", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel crawling job"
        )


@router.get("/job/{job_id}/data")
async def get_crawled_data(
    job_id: str,
    format: str = "json",
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get crawled data from a job via Crawling Service"""
    try:
        import httpx
        from app.core.config import settings
        
        crawling_service_url = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/job/{job_id}/data"
        
        params = {
            "userId": str(current_user.id),
            "format": format,
            "limit": limit
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(crawling_service_url, params=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
        return result
        
    except Exception as e:
        logger.error("Failed to get crawled data", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve crawled data"
        )


@router.get("/job/{job_id}/download")
async def download_crawled_data(
    job_id: str,
    format: str = "csv",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download crawled data via Crawling Service.

    If the crawling service returns a JSON with a `download_url`, follow it and stream the file bytes back to the client.
    Otherwise, if it returns bytes directly, proxy the stream.
    """
    try:
        import httpx
        from app.core.config import settings

        base_endpoint = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/job/{job_id}/download"
        params = {"userId": str(current_user.id), "format": format}

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # First attempt: some services return the file directly
            head = await client.get(base_endpoint, params=params, timeout=30)
            if head.headers.get("content-type", "").lower().startswith(("text/", "application/")) and not _is_json_content(head):
                return _stream_httpx_response(head)

            # If JSON, check for a download_url and fetch it
            result = head.json()
            download_url = result.get("download_url") or result.get("url")
            if not download_url:
                return result  # fallback: return JSON info to caller

            if not download_url.startswith("http"):
                # Build absolute URL from service base
                download_url = f"{settings.CRAWLING_SERVICE_URL}{download_url if download_url.startswith('/') else '/' + download_url}"

            file_resp = await client.get(download_url, timeout=60)
            file_resp.raise_for_status()
            return _stream_httpx_response(file_resp)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to proxy crawled data download", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download crawled data"
        )


def _is_json_content(resp) -> bool:
    try:
        ct = resp.headers.get("content-type", "").lower()
        return "application/json" in ct
    except Exception:
        return False


def _stream_httpx_response(resp):
    # Determine filename from headers if possible
    disposition = resp.headers.get("content-disposition", "")
    filename = None
    if "filename=" in disposition:
        try:
            filename = disposition.split("filename=")[-1].strip('"')
        except Exception:
            filename = None

    media_type = resp.headers.get("content-type", "application/octet-stream")
    return StreamingResponse(
        resp.aiter_bytes(),
        media_type=media_type,
        headers={
            **({"Content-Disposition": f"attachment; filename={filename}"} if filename else {})
        }
    )


@router.get("/settings/default")
async def get_default_crawling_settings():
    """Get default crawling settings"""
    return {
        "max_depth": 2,
        "max_pages": 100,
        "delay": 1000,
        "follow_links": True,
        "extract_data": True,
        "user_agent": "DataMiningBot/1.0",
        "timeout": 30,
        "retry_attempts": 3,
        "data_selectors": {
            "title": "h1, h2, h3",
            "content": "p, div.content, article",
            "links": "a[href]",
            "images": "img[src]"
        }
    }


@router.post("/validate-url")
async def validate_url(url: str):
    """Validate a URL for crawling via Crawling Service"""
    try:
        import httpx
        from app.core.config import settings
        
        crawling_service_url = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/validate-url"
        
        payload = {
            "url": url
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(crawling_service_url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
        return result
        
    except Exception as e:
        logger.error("Failed to validate URL", url=url, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate URL"
        )


def is_valid_url(url: str) -> bool:
    """Check if URL is valid"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def generate_job_id() -> str:
    """Generate a unique job ID"""
    import uuid
    return f"crawl_{uuid.uuid4().hex[:8]}"


async def process_crawling_job(
    job_id: str,
    urls: List[str],
    max_depth: int,
    max_pages: int,
    delay: int,
    follow_links: bool,
    extract_data: bool,
    data_selectors: Optional[Dict[str, str]],
    user_id: int
):
    """Background task to process crawling job using Crawling Service"""
    try:
        logger.info("Starting crawling job processing", job_id=job_id)
        
        # Call Crawling Service
        import httpx
        from app.core.config import settings
        
        crawling_service_url = f"{settings.CRAWLING_SERVICE_URL}/api/v1/crawling/start"
        
        # Prepare request payload
        payload = {
            "urls": urls,
            "maxDepth": max_depth,
            "maxPages": max_pages,
            "delay": delay,
            "followLinks": follow_links,
            "extractData": extract_data,
            "dataSelectors": data_selectors or {},
            "userId": str(user_id)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(crawling_service_url, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            
        logger.info("Crawling job started via service", 
                   job_id=job_id, 
                   service_job_id=result.get("job_id"),
                   urls=urls)
        
    except Exception as e:
        logger.error("Failed to process crawling job", job_id=job_id, error=str(e))
