from pydantic import BaseModel
from typing import List

class ProgramListResponse(BaseModel):
    programs: List[str]

class StudyYearsResponse(BaseModel):
    study_years: List[int]

class GroupsResponse(BaseModel):
    groups: List[str]