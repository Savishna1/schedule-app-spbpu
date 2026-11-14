from pydantic import BaseModel
from datetime import date
from typing import List

class ChildGroupRequest(BaseModel):
    program: str
    study_year: int
    group_number: str

class ChildRequest(BaseModel):
    name: str
    groups: List[ChildGroupRequest]

class WeeklyScheduleRequest(BaseModel):
    children: List[ChildRequest]