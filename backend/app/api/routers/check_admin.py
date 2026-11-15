from fastapi import APIRouter, HTTPException, status
import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.check_admin import AdminPasswordRequest, AdminTokenResponse

security = HTTPBearer()
load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

TEACHER_PASSWORD = os.getenv("TEACHER_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 365

def create_admin_token() -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "admin": True,
        "exp": expire
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

@router.post("/verify-admin", response_model=AdminTokenResponse)
def verify_admin(request: AdminPasswordRequest):
    if request.password != TEACHER_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin password"
        )

    token = create_admin_token()

    return AdminTokenResponse(admin_token=token)

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")