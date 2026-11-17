from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routers import registration, check_admin, cancel_postpone_schedule, schedule, notifications, teachers
from .database.db import engine, Base

app = FastAPI(title="Center Education API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registration.router, prefix="/api", tags=["registration"])
app.include_router(check_admin.router, prefix="/api", tags=["check_admin"])
app.include_router(cancel_postpone_schedule.router, prefix="/api", tags=["cancel_postpone_schedule"])
app.include_router(schedule.router, prefix="/api", tags=["schedule"])
app.include_router(notifications.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    print("Database tables ensured")

@app.get("/")
def root():
    return {"message": "Center Education API"}