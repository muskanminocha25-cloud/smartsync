import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.resume import Resume, ResumeAnalysis
from ..utils.pdf_parser import extract_text_from_pdf, validate_pdf_size
from ..utils.cloudinary_helper import upload_resume_pdf


def upload_and_create_resume(
    pdf_bytes: bytes,
    original_filename: str,
    resume_name: str,
    target_position: str,
    user_id: str,
    db: Session,
) -> Resume:
    """
    Full flow:
    1. Validate PDF size
    2. Extract text from PDF
    3. Upload PDF to Cloudinary
    4. Deactivate all other resumes for this user
    5. Save new resume to database
    Returns the new Resume object (without analysis yet — analysis happens separately).
    """

    # Step 1: Validate
    if not validate_pdf_size(pdf_bytes, max_mb=10):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="PDF must be smaller than 10MB.",
        )

    # Step 2: Extract text
    try:
        extracted_text = extract_text_from_pdf(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    if len(extracted_text.strip()) < 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract enough text from this PDF. Make sure it's not a scanned image.",
        )

    # Step 3: Upload to Cloudinary
    try:
        upload_result = upload_resume_pdf(pdf_bytes, user_id, original_filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}",
        )

    # Step 4: Deactivate all existing resumes for this user
    db.query(Resume).filter(
        Resume.user_id == user_id,
        Resume.is_active == True,
    ).update({"is_active": False})

    # Step 5: Save new resume
    resume = Resume(
        user_id=user_id,
        name=resume_name,
        file_url=upload_result["url"],
        file_name=original_filename,
        target_position=target_position,
        extracted_text=extracted_text,
        is_active=True,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


def save_analysis(
    resume_id: str,
    analysis_data: dict,
    db: Session,
) -> ResumeAnalysis:
    """
    Saves the AI analysis result to the database.
    Deletes old analysis if one already exists for this resume.
    """
    # Remove old analysis if it exists
    db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).delete()

    analysis = ResumeAnalysis(
        resume_id=resume_id,
        match_score=analysis_data["match_score"],
        strengths=analysis_data.get("strengths", []),
        missing_skills=analysis_data.get("missing_skills", []),
        suggestions=analysis_data.get("suggestions", []),
        raw_summary=analysis_data.get("raw_summary", ""),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


def set_active_resume(resume_id: str, user_id: str, db: Session) -> Resume:
    """
    Sets a specific resume as the active one for a user.
    Deactivates all other resumes.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user_id,
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    # Deactivate all, then activate the selected one
    db.query(Resume).filter(Resume.user_id == user_id).update({"is_active": False})
    resume.is_active = True
    db.commit()
    db.refresh(resume)

    return resume


def get_active_resume(user_id: str, db: Session) -> Resume | None:
    """Returns the user's currently active resume (with analysis if it exists)."""
    return (
        db.query(Resume)
        .filter(Resume.user_id == user_id, Resume.is_active == True)
        .first()
    )


def get_all_resumes(user_id: str, db: Session) -> list[Resume]:
    """Returns all resumes for a user, most recent first."""
    return (
        db.query(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
        .all()
    )