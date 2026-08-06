import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.task import TrackerTask
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()


@router.get("/", response_model=list[TaskResponse])
async def get_all_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all tasks for the logged-in user, most recent first."""
    return (
        db.query(TrackerTask)
        .filter(TrackerTask.user_id == current_user.id)
        .order_by(TrackerTask.created_at.desc())
        .all()
    )


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new custom task (user-added, not AI-generated)."""
    task = TrackerTask(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        priority=data.priority,
        is_custom=True,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates a task's details."""
    task = db.query(TrackerTask).filter(
        TrackerTask.id == task_id,
        TrackerTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Only update fields that were actually provided
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggles a task between completed and not completed."""
    task = db.query(TrackerTask).filter(
        TrackerTask.id == task_id,
        TrackerTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.completed = not task.completed
    task.completed_at = datetime.utcnow() if task.completed else None
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a task."""
    task = db.query(TrackerTask).filter(
        TrackerTask.id == task_id,
        TrackerTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted."}