"""
ML Engine Service - Main API Router
"""

from fastapi import APIRouter

from app.api.v1.endpoints import cleaning, quality, suggestions, automl

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(cleaning.router, prefix="/cleaning", tags=["cleaning"])
api_router.include_router(quality.router, prefix="/quality", tags=["quality"])
api_router.include_router(suggestions.router, prefix="/suggestions", tags=["suggestions"])
api_router.include_router(automl.router, prefix="/automl", tags=["automl"])
