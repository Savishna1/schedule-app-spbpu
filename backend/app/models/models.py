from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from ..database import Base
import enum


class Group(Base):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True)  # айди группы (не программы!)
    name = Column(String(100))              # название группы (например, "Математика")
    number = Column(String(20))             # номер группы (например, "101")
    study_year = Column(Integer)            # год обучения
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=True)
    from_excel = Column(Boolean, default=False, nullable=False)

    teacher = relationship("Teacher", back_populates="groups")
    schedules = relationship("Schedule", back_populates="group")
    exceptions = relationship("ScheduleException", back_populates="group")


class Schedule(Base):
    __tablename__ = 'schedules'

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False)
    day_of_week = Column(String(20))      # например "Понедельник"
    start_time = Column(String(5))        # "16:25"
    end_time = Column(String(5))          # "18:05" (итоговое время окончания)
    time = Column(String, nullable=True)
    room = Column(String(50))
    teacher = Column(String(100))
    from_excel = Column(Boolean, default=False, nullable=False)

    group = relationship("Group", back_populates="schedules")


class ExceptionStatus(enum.Enum):
    CANCELLED = "отменено"
    POSTPONED = "перенесено"
    EXTRA = "дополнительное"


class ScheduleException(Base):
    __tablename__ = 'schedule_exceptions'

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False)
    exception_date = Column(Date, nullable=True)  # Дата, когда произошло изменение
    status = Column(String(20))                   # отменено / перенесено / дополнительное
    # Новое время (если перенесено)
    new_date = Column(Date, nullable=True)
    new_start_time = Column(String(5), nullable=True)
    new_end_time = Column(String(5), nullable=True)
    new_room = Column(String(50), nullable=True)
    new_teacher = Column(String(100), nullable=True)
    reason = Column(String(200), nullable=True)

    group = relationship("Group", back_populates="exceptions")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)      # ФИО преподавателя
    bio = Column(String, nullable=True)             # биография
    photo_url = Column(String, nullable=True)
    from_excel = Column(Boolean, default=False, nullable=False)

    groups = relationship("Group", back_populates="teacher")


class DeviceSubscription(Base):
    __tablename__ = "device_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    fcm_token = Column(String, nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    group = relationship("Group")