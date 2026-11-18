from pydantic import BaseModel, field_validator
from datetime import date

class CanceledLessonData(BaseModel):
    id: int
    lesson_date: date
    program_name: str
    schedule_status: str  # "cancelled"

    @field_validator('schedule_status')
    def validate_schedule_status_cancel(cls, v):
        if v != "cancelled":
            raise ValueError('schedule_status must be "cancelled"')
        return v

class PostponedLessonData(BaseModel):
    id: int
    lesson_date: date
    program_name: str
    schedule_status: str  # "postponed"
    new_date: date
    new_start_time: str
    new_end_time: str
    new_room: str
    new_teacher: str

    @field_validator('schedule_status')
    def validate_schedule_status_postpone(cls, v):
        if v != "postponed":
            raise ValueError('schedule_status must be "postponed"')
        return v

class LessonCancelConfirmation(BaseModel):
    success: bool
    lesson: CanceledLessonData

class LessonPostponeConfirmation(BaseModel):
    success: bool
    lesson: PostponedLessonData

class CancelCommandResponse(BaseModel):
    status: str  # "cancelled"

class PostponeCommandResponse(BaseModel):
    status: str  # "postponed"
    new_date: date
    new_start_time: str
    new_end_time: str
    new_room: str
    new_teacher: str

class ScheduleExceptionResponse(BaseModel):
    id: int
    group_id: int
    exception_date: Optional[date] = None
    status: str  # отменено, перенесено, дополнительное
    new_date: Optional[date] = None
    new_start_time: Optional[str] = None
    new_end_time: Optional[str] = None
    new_room: Optional[str] = None
    new_teacher: Optional[str] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True