from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.models import DeviceSubscription, Group
from app.schemas.notification import DeviceSubscriptionRequest

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/subscribe", status_code=status.HTTP_200_OK)
def subscribe_device(
        request: DeviceSubscriptionRequest,
        db: Session = Depends(get_db)
):
    db.query(DeviceSubscription).filter(
        DeviceSubscription.fcm_token == request.fcm_token
    ).delete()

    for group_data in request.groups:
        group = db.query(Group).filter(
            Group.name == group_data.program_name,
            Group.study_year == group_data.study_year,
            Group.number == group_data.group_number
        ).first()

        if not group:
            continue

        subscription = DeviceSubscription(
            fcm_token=request.fcm_token,
            group_id=group.id
        )
        db.add(subscription)

    db.commit()