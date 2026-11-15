from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Set, Tuple
from app.models.models import Group, Schedule, ScheduleException
from app.schemas.ScheduleRequest import WeeklyScheduleRequest
from app.schemas.ScheduleResponse import DaySchedule, ScheduleItem, ScheduleStatus
from app.services.schedule_common import DAY_NAMES, build_empty_week

def build_weekly_schedule(
    db: Session,
    request: WeeklyScheduleRequest,
    days: List[date]
) -> List[DaySchedule]:
    if not days:
        return []

    unique_groups: Set[Tuple[str, int, str]] = set()
    child_group_map: Dict[Tuple[str, int, str], List[str]] = {}

    for child in request.children:
        for group in child.groups:
            key = (group.program, group.study_year, group.group_number)
            unique_groups.add(key)
            if key not in child_group_map:
                child_group_map[key] = []
            child_group_map[key].append(child.name)

    if not unique_groups:
        return build_empty_week(days)

    group_conditions = [
        (Group.name == program) &
        (Group.study_year == study_year) &
        (Group.number == number)
        for program, study_year, number in unique_groups
    ]

    found_groups = db.query(Group).filter(or_(*group_conditions)).all()

    if not found_groups:
        return build_empty_week(days)

    group_ids = [g.id for g in found_groups]
    group_map = {g.id: g for g in found_groups}

    schedules = db.query(Schedule).filter(Schedule.group_id.in_(group_ids)).all()

    group_schedules = {}
    for s in schedules:
        if s.group_id not in group_schedules:
            group_schedules[s.group_id] = []
        group_schedules[s.group_id].append(s)

    exceptions = db.query(ScheduleException).filter(
        ScheduleException.group_id.in_(group_ids),
        or_(
            ScheduleException.exception_date.in_(days),
            ScheduleException.new_date.in_(days)
        )
    ).all()

    result = []

    for day in days:
        day_name = DAY_NAMES[day.weekday()]
        lessons = []

        for e in exceptions:
            if e.status == "дополнительное" and e.new_date == day:
                group = group_map.get(e.group_id)
                if group:
                    child_names = ", ".join(child_group_map.get((group.name, group.study_year, group.number), []))
                    lessons.append(ScheduleItem(
                        id=e.id,
                        start_time=e.new_start_time,
                        end_time=e.new_end_time,
                        program_name=group.name,
                        schedule_status=ScheduleStatus.EXTRA,
                        child_name=child_names,
                        teacher_name=e.new_teacher,
                        room=e.new_room,
                        new_date=None,
                        new_start_time=None,
                        new_end_time=None
                    ))

        for group_id, schedules_list in group_schedules.items():
            group = group_map.get(group_id)
            if not group:
                continue

            day_schedule = next(
                (s for s in schedules_list if s.day_of_week == day_name),
                None
            )

            if not day_schedule:
                continue

            exception = next(
                (e for e in exceptions if e.group_id == group_id and e.exception_date == day),
                None
            )

            if exception:
                if exception.status == "отменено":
                    lessons.append(ScheduleItem(
                        id=day_schedule.id,
                        start_time=day_schedule.start_time,
                        end_time=day_schedule.end_time,
                        program_name=group.name,
                        schedule_status=ScheduleStatus.CANCELLED,
                        child_name=", ".join(child_group_map.get((group.name, group.study_year, group.number), [])),
                        teacher_name=day_schedule.teacher,
                        room=day_schedule.room,
                        new_date=None,
                        new_start_time=None,
                        new_end_time=None
                    ))
                    continue

                if exception.status == "перенесено":
                    if not exception.new_date or not exception.new_start_time or not exception.new_end_time:
                        raise ValueError(
                            f"Перенесённое занятие (group={group.name} {group.number}, "
                            f"date={day}) не имеет полных данных"
                        )
                    lessons.append(ScheduleItem(
                        id=day_schedule.id,
                        start_time=day_schedule.start_time,
                        end_time=day_schedule.end_time,
                        program_name=group.name,
                        schedule_status=ScheduleStatus.POSTPONED,
                        child_name=", ".join(child_group_map.get((group.name, group.study_year, group.number), [])),
                        teacher_name=day_schedule.teacher,
                        room=day_schedule.room,
                        new_date=exception.new_date,
                        new_start_time=exception.new_start_time,
                        new_end_time=exception.new_end_time
                    ))
                    continue

            lessons.append(ScheduleItem(
                id=day_schedule.id,
                start_time=day_schedule.start_time,
                end_time=day_schedule.end_time,
                program_name=group.name,
                schedule_status=ScheduleStatus.SCHEDULED,
                child_name=", ".join(child_group_map.get((group.name, group.study_year, group.number), [])),
                teacher_name=day_schedule.teacher,
                room=day_schedule.room,
                new_date=None,
                new_start_time=None,
                new_end_time=None
            ))

        lessons.sort(key=lambda x: x.start_time)
        result.append(DaySchedule(
            date=day,
            day_of_week=day_name,
            lessons=lessons
        ))

    for exception in exceptions:
        if exception.status != "перенесено":
            continue
        if not exception.new_date or exception.new_date not in days:
            continue

        group = group_map.get(exception.group_id)
        if not group:
            continue

        for day_schedule in result:
            if day_schedule.date == exception.new_date:
                already_added = any(
                    lesson.program_name == group.name and lesson.start_time == exception.new_start_time
                    for lesson in day_schedule.lessons
                )
                if not already_added:
                    day_schedule.lessons.append(ScheduleItem(
                        id=exception.id,
                        start_time=exception.new_start_time,
                        end_time=exception.new_end_time,
                        program_name=group.name,
                        schedule_status=ScheduleStatus.SCHEDULED,
                        child_name=", ".join(child_group_map.get((group.name, group.study_year, group.number), [])),
                        teacher_name=exception.new_teacher,
                        room=exception.new_room,
                        new_date=None,
                        new_start_time=None,
                        new_end_time=None
                    ))
                    day_schedule.lessons.sort(key=lambda x: x.start_time)
                break

    return result