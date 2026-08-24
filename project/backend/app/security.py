"""JWT authentication helpers."""
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.config import get_settings

bearer = HTTPBearer(auto_error=False)
def create_token(username: str) -> str:
    settings = get_settings()
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="AUTHENTICATION_REQUIRED")
    try:
        username = jwt.decode(credentials.credentials, get_settings().secret_key, algorithms=["HS256"]).get("sub")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="AUTHENTICATION_REQUIRED") from exc
    if not username:
        raise HTTPException(status_code=401, detail="AUTHENTICATION_REQUIRED")
    return username
