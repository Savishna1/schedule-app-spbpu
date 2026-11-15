from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import Group
from app.schemas.registration import (
    ProgramListResponse,
    StudyYearsResponse,
    GroupsResponse
)

router = APIRouter(prefix="/register", tags=["registration"])

@router.get("/programs", response_model=ProgramListResponse)
def get_all_programs(db: Session = Depends(get_db)):
    programs = db.query(Group.name).distinct().order_by(Group.name).all()
    return ProgramListResponse(programs=[p[0] for p in programs])

@router.get("/programs/{program_name}/study-years", response_model=StudyYearsResponse)
def get_study_years_for_program(
        program_name: str,
        db: Session = Depends(get_db)
):
    years = db.query(Group.study_year).filter(
        Group.name == program_name
    ).distinct().order_by(Group.study_year).all()

    if not years:
        raise HTTPException(status_code=404, detail="Program not found")

    return StudyYearsResponse(study_years=[y[0] for y in years])

@router.get("/programs/{program_name}/study-years/{study_year}/groups", response_model=GroupsResponse)
def get_groups_for_program_and_year(
        program_name: str,
        study_year: int,
        db: Session = Depends(get_db)
):
    groups = db.query(Group.number).filter(
        Group.name == program_name,
        Group.study_year == study_year
    ).order_by(Group.number).all()

    if not groups:
        raise HTTPException(
            status_code=404,
            detail=f"No groups found for {program_name}, year {study_year}"
        )

    return GroupsResponse(groups=[g[0] for g in groups])