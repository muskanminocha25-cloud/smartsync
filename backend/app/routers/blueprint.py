import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.blueprint import Blueprint, BlueprintDay
from ..models.resume import Resume
from ..schemas.blueprint import (
    GenerateBlueprintRequest,
    BlueprintResponse,
    BlueprintDayResponse,
)
from ..services.ai_service import generate_blueprint

router = APIRouter()


@router.post("/generate", response_model=BlueprintResponse, status_code=status.HTTP_201_CREATED)
async def generate_blueprint_route(
    data: GenerateBlueprintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a day-by-day preparation blueprint.
    Uses the resume's AI analysis to create a personalized plan.
    Replaces any existing active blueprint for this user.
    """
    # Get the resume and its analysis
    resume = db.query(Resume).filter(
        Resume.id == data.resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if not resume.analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please analyze your resume first before generating a blueprint.",
        )

    # Build context for AI
    analysis_context = {
        "match_score": resume.analysis.match_score,
        "strengths": resume.analysis.strengths,
        "missing_skills": resume.analysis.missing_skills,
        "suggestions": resume.analysis.suggestions,
    }

    # Generate the days using AI
    start_date = date.today()
    end_date = start_date + timedelta(days=data.timeline_days - 1)

    generated_days = await generate_blueprint(
        target_position=resume.target_position,
        timeline_days=data.timeline_days,
        analysis=analysis_context,
        start_date=start_date,
    )

    # Deactivate old blueprints for this user
    db.query(Blueprint).filter(
        Blueprint.user_id == current_user.id,
        Blueprint.is_active == True,
    ).update({"is_active": False})

    # Create the blueprint record
    blueprint = Blueprint(
        user_id=current_user.id,
        resume_id=data.resume_id,
        timeline_days=data.timeline_days,
        target_position=resume.target_position,
        start_date=start_date,
        end_date=end_date,
        is_active=True,
    )
    db.add(blueprint)
    db.flush()   # Get the blueprint.id before committing

    # Save all the days
    for day_data in generated_days:
        day = BlueprintDay(
            blueprint_id=blueprint.id,
            day_number=day_data["day_number"],
            date=day_data["date"],
            theme=day_data["theme"],
            tasks=day_data.get("tasks", []),
            resources=day_data.get("resources", []),
            is_completed=False,
        )
        db.add(day)

    db.commit()
    db.refresh(blueprint)

    return blueprint


@router.get("/active", response_model=BlueprintResponse)
async def get_active_blueprint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the user's active blueprint with all days."""
    blueprint = db.query(Blueprint).filter(
        Blueprint.user_id == current_user.id,
        Blueprint.is_active == True,
    ).first()

    if not blueprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No blueprint found. Generate one from your resume analysis.",
        )

    return blueprint


@router.get("/{blueprint_id}", response_model=BlueprintResponse)
async def get_blueprint(
    blueprint_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns a specific blueprint by ID."""
    blueprint = db.query(Blueprint).filter(
        Blueprint.id == blueprint_id,
        Blueprint.user_id == current_user.id,
    ).first()

    if not blueprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blueprint not found.")

    return blueprint


@router.patch("/day/{day_id}/complete", response_model=BlueprintDayResponse)
async def toggle_day_complete(
    day_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marks/unmarks a blueprint day as completed."""
    day = db.query(BlueprintDay).join(Blueprint).filter(
        BlueprintDay.id == day_id,
        Blueprint.user_id == current_user.id,
    ).first()

    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Day not found.")

    day.is_completed = not day.is_completed
    db.commit()
    db.refresh(day)

    return day