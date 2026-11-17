from pydantic import BaseModel
from typing import Optional


# Для списка (только id, имя, фото)
class TeacherShortResponse(BaseModel):
    id: int
    name: str
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


# Для деталей (id, имя, био, фото)
class TeacherDetailResponse(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True