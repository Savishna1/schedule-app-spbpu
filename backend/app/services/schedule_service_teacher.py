from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.models.models import Schedule, ScheduleException
from app.schemas.ScheduleResponse import DaySchedule, ScheduleItem, ScheduleStatus
from app.services.schedule_common import DAY_NAMES, build_empty_week

def build_teacher_weekly_schedule(
    db: Session,
    teacher_name: str,
    days: List[date]
) -> List[DaySchedule]:
    if not days:
        return []

    schedules = db.query(Schedule).filter(
        Schedule.teacher == teacher_name
    ).all()

    if not schedules:
        return build_empty_week(days)

    group_ids = list(set([s.group_id for s in schedules]))

    exceptions = db.query(ScheduleException).filter(
        ScheduleException.group_id.in_(group_ids),
        ScheduleException.status != "дополнительное",
        or_(
            ScheduleException.exception_date.in_(days),
            ScheduleException.new_date.in_(days)
        )
    ).all()

    extra_exceptions = db.query(ScheduleException).filter(
        ScheduleException.status == "дополнительное",
        ScheduleException.new_date.in_(days)
    ).all()

    postponed_exceptions = db.query(ScheduleException).filter(
        ScheduleException.status == "перенесено",
        ScheduleException.new_date.in_(days),
        ~ScheduleException.group_id.in_(group_ids)
    ).all()

    all_exceptions = exceptions + postponed_exceptions + extra_exceptions

    result = []

    for day in days:
        day_name = DAY_NAMES[day.weekday()]
        lessons = []

        for e in all_exceptions:
            if e.status == "дополнительное" and e.new_date == day:
                if e.new_teacher != teacher_name:
                    continue
                group = e.group
                if group:
                    lessons.append(ScheduleItem(
                        id=e.id,
                        start_time=e.new_start_time,
                        end_time=e.new_end_time,
                        program_name=group.name,
                        schedule_status=ScheduleStatus.EXTRA,
                        child_name=None,
                        teacher_name=e.new_teacher,
                        room=e.new_room,
                        new_date=None,
                        new_start_time=None,
                        new_end_time=None
                    ))

        for e in all_exceptions:
            if e.status == "перенесено" and e.new_date == day:
                if e.new_teacher != teacher_name:
                    continue
                group = e.group
                if group:
                    lessons.append(ScheduleItem(
                        id=e.schedule_id or e.id,   # ← ВАЖНО: чтобы фронт знал schedule_id
                        start_time=e.new_start_time,
                        end_time=e.new_end_time,
                        program_name=group.name,
                        schedule_status=ScheduleStatus.SCHEDULED,
                        child_name=None,
                        teacher_name=e.new_teacher,
                        room=e.new_room,
                        new_date=None,
                        new_start_time=None,
                        new_end_time=None
                    ))

        for schedule in schedules:
            if schedule.day_of_week != day_name:
                continue

            # Ищем исключение по конкретному занятию (schedule_id)
            exception = next(
                (e for e in all_exceptions if e.schedule_id == schedule.id and e.exception_date == day),
                None
            )

            if exception:
                if exception.status == "отменено":
                    lesson = ScheduleItem(
                        id=schedule.id,
                        start_time=schedule.start_time,
                        end_time=schedule.end_time,
                        program_name=schedule.group.name if schedule.group else "",
                        schedule_status=ScheduleStatus.CANCELLED,
                        child_name=None,
                        teacher_name=schedule.teacher,
                        room=schedule.room,
                        new_date=None,
                        new_start_time=None,
                        new_end_time=None
                    )
                elif exception.status == "перенесено":
                    if not exception.new_date or not exception.new_start_time or not exception.new_end_time:
                        raise ValueError(
                            f"Перенесённое занятие (group={schedule.group.name if schedule.group else ''}, "
                            f"date={day}) не имеет полных данных"
                        )
                    lesson = ScheduleItem(
                        id=schedule.id,
                        start_time=schedule.start_time,
                        end_time=schedule.end_time,
                        program_name=schedule.group.name if schedule.group else "",
                        schedule_status=ScheduleStatus.POSTPONED,
                        child_name=None,
                        teacher_name=schedule.teacher,
                        room=schedule.room,
                        new_date=exception.new_date,
                        new_start_time=exception.new_start_time,
                        new_end_time=exception.new_end_time
                    )
                else:
                    continue
            else:
                lesson = ScheduleItem(
                    id=schedule.id,
                    start_time=schedule.start_time,
                    end_time=schedule.end_time,
                    program_name=schedule.group.name if schedule.group else "",
                    schedule_status=ScheduleStatus.SCHEDULED,
                    child_name=None,
                    teacher_name=schedule.teacher,
                    room=schedule.room,
                    new_date=None,
                    new_start_time=None,
                    new_end_time=None
                )

            lessons.append(lesson)

        lessons.sort(key=lambda x: x.start_time)
        result.append(DaySchedule(
            date=day,
            day_of_week=day_name,
            lessons=lessons
        ))

    return result