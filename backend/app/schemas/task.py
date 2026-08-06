from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"   # low | medium | high


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    completed: bool
    priority: str
    is_custom: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ChatSendRequest(BaseModel):
    message: str
    session_id: Optional[uuid.UUID] = None   # Optional — creates new session if not given


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    created_at: datetime


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    message: ChatMessageResponse