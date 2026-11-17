from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.models import models
from app.schemas.ScheduleRequest import OneTimeScheduleCreate
from app.schemas.ScheduleResponse import OneTimeScheduleResponse
from app.schemas.cancel_postpone_schedule import (
    CancelCommandResponse,
    PostponeCommandResponse,
    ScheduleExceptionResponse,
    LessonCancelConfirmation,
    LessonPostponeConfirmation,
)
from app.database.db import get_db
from app.api.routers.check_admin import get_current_admin
from datetime import date

import requests
from typing import List
from sqlalchemy.orm import Session
from app.models.models import DeviceSubscription, Group, ScheduleException
from app.schemas.notification import NotificationMessage

EXPO_API_URL = "https://exp.host/--/api/v2/push/send"

router = APIRouter()


def send_notifications(notification: NotificationMessage, db: Session):
    subscriptions = db.query(DeviceSubscription).filter(
        DeviceSubscription.group_id == notification.group_id
    ).all()

    if not subscriptions:
        return

    tokens = list(set([sub.fcm_token for sub in subscriptions]))

    for token in tokens:
        message = {
            "to": token,
            "title": notification.title,
            "body": notification.body,
            "sound": "default",
            "priority": "high",
            "icon": "ic_notification"
        }

        try:
            response = requests.post(
                EXPO_API_URL,
                json=message,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                expo_data = result.get("data", result)

                if expo_data.get("status") == "error":
                    error = expo_data.get("details", {}).get("error", "Unknown")

                    if error == "DeviceNotRegistered":
                        db.query(DeviceSubscription).filter(
                            DeviceSubscription.fcm_token == token
                        ).delete()
                        db.commit()
        except Exception:
            pass

    db.commit()


@router.post(
    "/lessons/confirm-action",
    response_model=CancelCommandResponse | PostponeCommandResponse,
    status_code=status.HTTP_200_OK
)
def confirm_lesson_action(
        request: LessonCancelConfirmation | LessonPostponeConfirmation,
        db: Session = Depends(get_db),
        _=Depends(get_current_admin)
):
    lesson_id = request.lesson.id

    schedule = db.query(models.Schedule).filter(models.Schedule.id == lesson_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Lesson not found")

    group_id = schedule.group_id
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    group_name = group.name if group else "занятие"

    lesson_start_time = schedule.start_time
    lesson_end_time = schedule.end_time
    day_of_week = schedule.day_of_week

    if isinstance(request, LessonCancelConfirmation):
        specific_date = request.lesson.lesson_date

        exception = models.ScheduleException(
            group_id=group_id,
            exception_date=specific_date,
            status="отменено"
        )
        db.add(exception)
        db.commit()

        send_notifications(NotificationMessage(
            group_id=group_id,
            title="Занятие отменено",
            body=f"{group_name}\n{day_of_week} {lesson_start_time}-{lesson_end_time} отменено"
        ), db)

        return CancelCommandResponse(status="cancelled")

    elif isinstance(request, LessonPostponeConfirmation):
        lesson_data = request.lesson
        specific_date = lesson_data.lesson_date

        exception = models.ScheduleException(
            group_id=group_id,
            exception_date=specific_date,
            status="перенесено",
            new_date=lesson_data.new_date,
            new_start_time=lesson_data.new_start_time,
            new_end_time=lesson_data.new_end_time,
            new_room=lesson_data.new_room,
            new_teacher=lesson_data.new_teacher
        )
        db.add(exception)
        db.commit()

        send_notifications(NotificationMessage(
            group_id=group_id,
            title="Занятие перенесено",
            body=f"{group_name}\nБыло: {day_of_week} {lesson_start_time}-{lesson_end_time}\n"
                 f"Перенесено на: {lesson_data.new_date} {lesson_data.new_start_time}-{lesson_data.new_end_time}"
        ), db)

        return PostponeCommandResponse(
            status="postponed",
            new_date=lesson_data.new_date,
            new_start_time=lesson_data.new_start_time,
            new_end_time=lesson_data.new_end_time,
            new_room=lesson_data.new_room,
            new_teacher=lesson_data.new_teacher
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid request type")


@router.delete("/exceptions", status_code=status.HTTP_204_NO_CONTENT)
def delete_exception(
        group_id: int,
        exception_date: date,
        status: str = Query(..., description="Тип исключения: отменено, перенесено, дополнительное"),
        db: Session = Depends(get_db),
        _=Depends(get_current_admin)
):
    if status == "дополнительное":
        exception = db.query(ScheduleException).filter_by(
            group_id=group_id,
            new_date=exception_date,
            status=status
        ).first()
    else:
        exception = db.query(ScheduleException).filter_by(
            group_id=group_id,
            exception_date=exception_date,
            status=status
        ).first()

    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")

    group = db.query(Group).filter(Group.id == group_id).first()
    group_name = group.name if group else "занятие"

    if status == "отменено":
        title = "Отмена занятия отменена"
        body = f"{group_name}\nЗанятие на {exception_date} снова состоится по расписанию"
    elif status == "перенесено":
        title = "Перенос занятия отменён"
        body = f"{group_name}\nЗанятие на {exception_date} снова состоится по расписанию"
    elif status == "дополнительное":
        actual_date = exception.new_date or exception_date
        title = "Дополнительное занятие отменено"
        body = f"{group_name}\nДоп. занятие на {actual_date} отменено"
    else:
        title = "Изменение в расписании"
        body = f"{group_name}\nИзменение в расписании"

    db.delete(exception)
    db.commit()

    send_notifications(NotificationMessage(
        group_id=group_id,
        title=title,
        body=body
    ), db)

    return


@router.post("/one-time", response_model=OneTimeScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_one_time_schedule(
        data: OneTimeScheduleCreate,
        db: Session = Depends(get_db),
        _=Depends(get_current_admin)
):
    group = db.query(Group).filter(
        Group.name == data.program,
        Group.study_year == data.study_year,
        Group.number == data.group_number
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {data.program}, year={data.study_year}, number={data.group_number}"
        )

    exception = ScheduleException(
        group_id=group.id,
        exception_date=None,
        status="дополнительное",
        new_date=data.date,
        new_start_time=data.start_time,
        new_end_time=data.end_time,
        new_room=data.room,
        new_teacher=data.teacher
    )
    db.add(exception)
    db.commit()
    db.refresh(exception)

    send_notifications(NotificationMessage(
        group_id=group.id,
        title="Новое дополнительное занятие",
        body=f"{group.name}\n{data.date} {data.start_time}-{data.end_time}\n"
             f"Кабинет: {data.room}\nПреподаватель: {data.teacher}"
    ), db)

    return OneTimeScheduleResponse(
        id=exception.id,
        program=group.name,
        study_year=group.study_year,
        group_number=group.number,
        date=exception.new_date,
        start_time=exception.new_start_time,
        end_time=exception.new_end_time,
        room=exception.new_room,
        teacher=exception.new_teacher,
        status=exception.status
    )


RECENT_LIMIT = 15


@router.get("/recent", response_model=List[ScheduleExceptionResponse])
def get_recent_exceptions(
        db: Session = Depends(get_db),
        _=Depends(get_current_admin)
):
    exceptions = db.query(ScheduleException).order_by(
        ScheduleException.id.desc()
    ).limit(RECENT_LIMIT).all()

    result = []
    for exc in exceptions:
        group = db.query(Group).filter(Group.id == exc.group_id).first()
        result.append(ScheduleExceptionResponse(
            id=exc.id,
            group_id=exc.group_id,
            exception_date=exc.exception_date,
            status=exc.status,
            new_date=exc.new_date,
            new_start_time=exc.new_start_time,
            new_end_time=exc.new_end_time,
            new_room=exc.new_room,
            new_teacher=exc.new_teacher,
            group_name=group.name if group else None
        ))

    return result