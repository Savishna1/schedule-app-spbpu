from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import Teacher
from app.schemas.teacher import TeacherShortResponse, TeacherDetailResponse

router = APIRouter(prefix="/teachers", tags=["teachers"])


# 1. Список (только id, имя, фото)
@router.get("/", response_model=List[TeacherShortResponse])
def get_all_teachers(
    db: Session = Depends(get_db)
):
    teachers = db.query(Teacher).order_by(Teacher.name).all()
    return teachers


# 2. Детали (id, имя, био, фото)
@router.get("/{teacher_id}", response_model=TeacherDetailResponse)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher