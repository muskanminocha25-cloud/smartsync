from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import Optional


class SkillGapItem(BaseModel):
    skill: str
    importance: str   # "critical" | "important" | "nice-to-have"
    description: str


class ResumeAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    resume_id: uuid.UUID
    match_score: int
    strengths: list[str]
    missing_skills: list[SkillGapItem]
    suggestions: list[str]
    raw_summary: Optional[str]
    created_at: datetime


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    file_url: str
    file_name: str
    target_position: str
    is_active: bool
    created_at: datetime
    analysis: Optional[ResumeAnalysisResponse] = None


class SetActiveResumeRequest(BaseModel):
    resume_id: uuid.UUID


class ResumeNameUpdateRequest(BaseModel):
    name: str