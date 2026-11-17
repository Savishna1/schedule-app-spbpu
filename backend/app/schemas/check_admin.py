from pydantic import BaseModel

class AdminPasswordRequest(BaseModel):
    password: str

class AdminTokenResponse(BaseModel):
    admin_token: str
    token_type: str = "bearer"