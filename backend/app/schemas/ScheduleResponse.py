from pydantic import BaseModel, field_validator
from datetime import date
from typing import List
from enum import Enum

class ScheduleStatus(str, Enum):
    SCHEDULED = "по расписанию"
    CANCELLED = "отменено"
    POSTPONED = "перенесено"
    EXTRA = "дополнительное"

class ScheduleItem(BaseModel):
    id: int
    start_time: str
    end_time: str
    program_name: str
    schedule_status: ScheduleStatus
    child_name: str | None = None
    new_date: date | None = None          # новая дата (если перенесено)
    new_start_time: str | None = None     # новое время начала
    new_end_time: str | None = None       # новое время конца
    teacher_name: str | None = None
    room: str | None = None

    class Config:
        from_attributes = True

class DaySchedule(BaseModel):
    date: date
    day_of_week: str
    lessons: List[ScheduleItem]

    @classmethod
    def _get_valid_days(cls):
        return ["Понедельник", "Вторник", "Среда", "Четверг",
                "Пятница", "Суббота", "Воскресенье"]

    @field_validator("day_of_week")
    @classmethod
    def validate_day_of_week(cls, v):
        if v not in cls._get_valid_days():
            raise ValueError(f"Invalid day: {v}")
        return v

    class Config:
        from_attributes = True