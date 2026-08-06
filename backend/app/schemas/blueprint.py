from pydantic import BaseModel, ConfigDict, field_validator
import uuid
from datetime import datetime, date
from typing import Optional


class GenerateBlueprintRequest(BaseModel):
    resume_id: uuid.UUID
    timeline_days: int

    @field_validator("timeline_days")
    @classmethod
    def validate_timeline(cls, v: int) -> int:
        if v not in [30, 60, 90]:
            raise ValueError("Timeline must be 30, 60, or 90 days")
        return v


class TaskItem(BaseModel):
    description: str
    duration_minutes: int
    type: str          # study | practice | project | revision
    completed: bool = False


class ResourceItem(BaseModel):
    title: str
    url: Optional[str] = None
    type: str          # video | article | practice | book


class BlueprintDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    blueprint_id: uuid.UUID
    day_number: int
    date: date
    theme: str
    tasks: list[dict]
    resources: list[dict]
    is_completed: bool


class BlueprintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    resume_id: uuid.UUID
    timeline_days: int
    target_position: str
    start_date: date
    end_date: date
    is_active: bool
    created_at: datetime
    days: list[BlueprintDayResponse] = []