from datetime import date
from typing import List

from app.schemas.ScheduleResponse import DaySchedule

DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]

def build_empty_week(days: List[date]) -> List[DaySchedule]:
    result = []
    for day in days:
        day_name = DAY_NAMES[day.weekday()]
        result.append(DaySchedule(
            date=day,
            day_of_week=day_name,
            lessons=[]
        ))
    return result