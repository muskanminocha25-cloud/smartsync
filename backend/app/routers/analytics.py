from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.resume import Resume
from ..models.task import TrackerTask
from ..models.blueprint import Blueprint, BlueprintDay

router = APIRouter()


@router.get("/")
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns analytics data for the dashboard:
    - Task completion rate
    - Blueprint progress
    - Resume score history
    - Days remaining
    """
    # Task stats
    total_tasks = db.query(TrackerTask).filter(
        TrackerTask.user_id == current_user.id
    ).count()
    done_tasks = db.query(TrackerTask).filter(
        TrackerTask.user_id == current_user.id,
        TrackerTask.completed == True,
    ).count()

    # Active blueprint stats
    blueprint = db.query(Blueprint).filter(
        Blueprint.user_id == current_user.id,
        Blueprint.is_active == True,
    ).first()

    days_completed = 0
    days_total = 0
    if blueprint:
        days_total = blueprint.timeline_days
        days_completed = db.query(BlueprintDay).filter(
            BlueprintDay.blueprint_id == blueprint.id,
            BlueprintDay.is_completed == True,
        ).count()

    # Resume score history (all resumes, newest first)
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.asc()).all()

    score_history = []
    for r in resumes:
        if r.analysis:
            score_history.append({
                "resume_name": r.name,
                "score": r.analysis.match_score,
                "date": r.created_at.strftime("%b %d"),
            })

    completion_rate = round((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    blueprint_progress = round((days_completed / days_total) * 100) if days_total > 0 else 0

    return {
        "total_tasks": total_tasks,
        "completed_tasks": done_tasks,
        "completion_rate": completion_rate,
        "days_completed": days_completed,
        "days_total": days_total,
        "blueprint_progress": blueprint_progress,
        "score_history": score_history,
    }