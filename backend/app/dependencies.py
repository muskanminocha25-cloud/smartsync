from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models.user import User
from .utils.jwt_handler import verify_token

# This tells FastAPI where the login endpoint is (for Swagger UI)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency used by all protected routes.
    Reads the JWT token from the Authorization header,
    verifies it, and returns the User from the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode the token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    # Extract user_id
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Find user in database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    return user