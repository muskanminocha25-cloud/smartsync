import uuid
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.resume import Resume
from ..schemas.resume import ResumeResponse, ResumeAnalysisResponse, SetActiveResumeRequest
from ..services import resume_service
from ..services.ai_service import analyze_resume

router = APIRouter()


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    resume_name: str = Form(...),
    target_position: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF resume.
    Steps: validate → extract text → upload to Cloudinary → save to DB → analyze → save analysis.
    Returns the resume object with its analysis.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are accepted.",
        )

    # Read the file bytes
    pdf_bytes = await file.read()

    # Step 1: Create the resume record
    resume = resume_service.upload_and_create_resume(
        pdf_bytes=pdf_bytes,
        original_filename=file.filename,
        resume_name=resume_name,
        target_position=target_position,
        user_id=str(current_user.id),
        db=db,
    )

    # Step 2: Run AI analysis on the extracted text
    try:
        analysis_data = await analyze_resume(
            resume_text=resume.extracted_text,
            target_position=target_position,
        )
        resume_service.save_analysis(
            resume_id=str(resume.id),
            analysis_data=analysis_data,
            db=db,
        )
    except Exception as e:
        # Don't fail the whole upload if AI analysis fails
        print(f"[Analysis Error] {e}")

    # Reload with analysis relationship
    db.refresh(resume)
    return resume


@router.get("/all", response_model=list[ResumeResponse])
async def get_all_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all resumes uploaded by the logged-in user."""
    return resume_service.get_all_resumes(str(current_user.id), db)


@router.get("/active", response_model=ResumeResponse)
async def get_active_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the user's currently active resume (with analysis)."""
    resume = resume_service.get_active_resume(str(current_user.id), db)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload one.",
        )
    return resume


@router.put("/set-active/{resume_id}", response_model=ResumeResponse)
async def set_active_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Switch the active resume (when user selects a different resume from dropdown)."""
    return resume_service.set_active_resume(str(resume_id), str(current_user.id), db)


@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
async def delete_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a resume and all its associated data."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    db.delete(resume)
    db.commit()

    # If we deleted the active one, make another resume active
    if resume.is_active:
        next_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.created_at.desc()).first()
        if next_resume:
            next_resume.is_active = True
            db.commit()

    return {"message": "Resume deleted successfully."}


@router.post("/reanalyze/{resume_id}", response_model=ResumeAnalysisResponse)
async def reanalyze_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-runs AI analysis on an existing resume (useful if analysis failed or user wants fresh results)."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if not resume.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text found in this resume to analyze.",
        )

    analysis_data = await analyze_resume(
        resume_text=resume.extracted_text,
        target_position=resume.target_position,
    )

    analysis = resume_service.save_analysis(
        resume_id=str(resume.id),
        analysis_data=analysis_data,
        db=db,
    )

    return analysis