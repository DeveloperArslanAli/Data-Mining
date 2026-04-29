"""
Authentication endpoints
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
import structlog

from app.core.database import get_db
from app.core.security import (
    authenticate_user, 
    create_user_tokens, 
    get_current_user,
    get_password_hash,
    generate_password_reset_token,
    verify_password_reset_token
)
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse, PasswordReset, PasswordResetConfirm

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            role=user_data.role,
            hashed_password=hashed_password,
            is_verified=True  # Auto-verify for MVP
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Create tokens
        tokens = create_user_tokens(db_user)
        
        logger.info("User registered successfully", user_id=db_user.id, email=db_user.email)
        
        return TokenResponse(
            **tokens,
            user=db_user
        )
        
    except Exception as e:
        logger.error("User registration failed", error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/dev-bootstrap-user", response_model=TokenResponse)
async def dev_bootstrap_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create (or return) a user in DEBUG mode for rapid local setup.
    If the user already exists, returns fresh tokens instead of error.
    Disabled when DEBUG is False.
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        if user is None:
            hashed_password = get_password_hash(user_data.password)
            user = User(
                email=user_data.email,
                username=user_data.username,
                full_name=user_data.full_name,
                role=user_data.role,
                hashed_password=hashed_password,
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("Dev bootstrap user created", user_id=user.id, email=user.email)
        else:
            logger.info("Dev bootstrap user exists", user_id=user.id, email=user.email)
        tokens = create_user_tokens(user)
        return TokenResponse(**tokens, user=user)
    except Exception as e:
        logger.error("Dev bootstrap failed", error=str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Dev bootstrap failed")


@router.post("/login", response_model=TokenResponse)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user and return tokens"""
    try:
        user = authenticate_user(user_credentials.email, user_credentials.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create tokens
        tokens = create_user_tokens(user)
        
        logger.info("User logged in successfully", user_id=user.id, email=user.email)
        
        return TokenResponse(
            **tokens,
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_user)
):
    """Refresh access token"""
    try:
        tokens = create_user_tokens(current_user)
        
        logger.info("Token refreshed", user_id=current_user.id)
        
        return {
            "access_token": tokens["access_token"],
            "token_type": tokens["token_type"],
            "expires_in": tokens["expires_in"]
        }
        
    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client should discard tokens)"""
    logger.info("User logged out", user_id=current_user.id)
    
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(
    password_reset: PasswordReset,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    try:
        user = db.query(User).filter(User.email == password_reset.email).first()
        
        if user:
            # Generate reset token
            reset_token = generate_password_reset_token(password_reset.email)
            
            # In a real application, you would send this token via email
            # For MVP, we'll just return it (not secure for production)
            logger.info("Password reset requested", email=password_reset.email)
            
            return {
                "message": "Password reset email sent",
                "reset_token": reset_token  # Remove this in production
            }
        else:
            # Don't reveal if user exists or not
            return {"message": "Password reset email sent"}
            
    except Exception as e:
        logger.error("Password reset request failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )


@router.post("/reset-password")
async def reset_password(
    password_reset: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    try:
        email = verify_password_reset_token(password_reset.token)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = get_password_hash(password_reset.new_password)
        user.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info("Password reset successfully", email=email)
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password reset failed", error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user
