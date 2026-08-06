import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi import HTTPException, status

from ..models.user import User
from ..schemas.auth import SignUpRequest, LoginRequest
from ..utils.jwt_handler import create_access_token

# Password hashing tool
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Converts plain text password to a bcrypt hash."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain text password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def register_user(data: SignUpRequest, db: Session) -> dict:
    """
    Creates a new user account.
    Raises HTTPException if email is already registered.
    """
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create the user
    user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        course=data.course.strip(),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token for immediate login after signup
    token = create_access_token(str(user.id))

    return {"token": token, "user": user}


def login_user(data: LoginRequest, db: Session) -> dict:
    """
    Logs in an existing user.
    Raises HTTPException if credentials are wrong.
    """
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    token = create_access_token(str(user.id))
    return {"token": token, "user": user}


def initiate_password_reset(email: str, db: Session) -> str | None:
    """
    Generates a secure reset token, saves it to the user record.
    Returns the token so the caller can send it via email.
    Returns None if no user with that email exists (don't reveal this to the client!).
    """
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        # Security: don't reveal that the email doesn't exist
        return None

    # Generate a secure random token
    reset_token = secrets.token_urlsafe(32)

    # Save token with 1-hour expiry
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    return reset_token


def complete_password_reset(token: str, new_password: str, db: Session) -> bool:
    """
    Verifies the reset token, updates the password, and clears the token.
    Returns True on success, False if token is invalid or expired.
    """
    user = db.query(User).filter(User.reset_token == token).first()

    if not user:
        return False

    if not user.reset_token_expires or datetime.utcnow() > user.reset_token_expires:
        # Token expired — clear it
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        return False

    # Update password and clear token
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return True