from jose import JWTError, jwt
from datetime import datetime, timedelta
from ..config import settings


def create_access_token(user_id: str) -> str:
    """Creates a JWT token with the user's ID and expiry time."""
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),      # Subject = user ID
        "exp": expire,             # Expiry time
        "iat": datetime.utcnow(), # Issued at
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> dict | None:
    """
    Verifies a JWT token.
    Returns the payload dict if valid, None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> str | None:
    """Extracts just the user_id from a token. Returns None if invalid."""
    payload = verify_token(token)
    if not payload:
        return None
    return payload.get("sub")