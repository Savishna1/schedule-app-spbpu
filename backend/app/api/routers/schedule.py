from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.schemas.ScheduleRequest import WeeklyScheduleRequest
from app.schemas.ScheduleResponse import DaySchedule
from app.services.schedule_service import build_weekly_schedule
from app.services.schedule_service_teacher import build_teacher_weekly_schedule

router = APIRouter(prefix="/schedule", tags=["schedule"])

@router.post("/week", response_model=List[DaySchedule])
def get_weekly_schedule(
        request: WeeklyScheduleRequest,
        week_index: int = Query(0, description="Индекс недели: 0 - текущая, 1 - след., -1 - пред."),
        db: Session = Depends(get_db)
):
    offset = week_index * 7
    start_date = date.today() + timedelta(days=offset)
    days = [start_date + timedelta(days=i) for i in range(7)]

    return build_weekly_schedule(db, request, days)

@router.get("/teacher", response_model=List[DaySchedule])
def get_teacher_schedule(
        teacher_name: str = Query(...),
        week_index: int = Query(0, description="Индекс недели: 0 - текущая, 1 - след., -1 - пред."),
        db: Session = Depends(get_db)
):
    offset = week_index * 7
    start_date = date.today() + timedelta(days=offset)
    days = [start_date + timedelta(days=i) for i in range(7)]

    return build_teacher_weekly_schedule(db, teacher_name, days)