"""Composable API router (no standalone FastAPI instance)."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, datasets, cleaning, export, crawling, ml_models

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(cleaning.router, prefix="/cleaning", tags=["cleaning"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(crawling.router, prefix="/crawling", tags=["crawling"])
api_router.include_router(ml_models.router, prefix="/ml-models", tags=["ml-models"])

# Utility to inject security scheme when attaching router (used in main app)
def inject_security_schemes(openapi_schema: dict) -> dict:
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }
    return openapi_schema
