from pydantic import BaseModel
from typing import List

class GroupSubscription(BaseModel):
    program_name: str
    study_year: int
    group_number: str

class DeviceSubscriptionRequest(BaseModel):
    fcm_token: str
    groups: List[GroupSubscription]

    class Config:
        from_attributes = True

class NotificationMessage(BaseModel):
    title: str
    body: str
    group_id: int

    class Config:
        from_attributes = True