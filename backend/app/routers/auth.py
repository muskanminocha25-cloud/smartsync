from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..schemas.auth import (
    SignUpRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from ..services import auth_service
from ..services.email_service import send_password_reset_email

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    """Register a new user. Returns a JWT token and user info."""
    result = auth_service.register_user(data, db)
    return TokenResponse(token=result["token"], user=result["user"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Log in with email and password. Returns a JWT token."""
    result = auth_service.login_user(data, db)
    return TokenResponse(token=result["token"], user=result["user"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the logged-in user's profile. Used on app load to verify session."""
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Sends a password reset email.
    Always returns 200 even if email doesn't exist (security best practice).
    """
    reset_token = auth_service.initiate_password_reset(data.email, db)

    if reset_token:
        # Find user name for the email
        from ..models.user import User
        user = db.query(User).filter(User.email == data.email.lower()).first()
        if user:
            send_password_reset_email(data.email, user.name, reset_token)

    # Always return success (don't reveal if email exists)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets the user's password using the token from the email link."""
    success = auth_service.complete_password_reset(data.token, data.new_password, db)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    return {"message": "Password updated successfully. You can now log in."}