import cloudinary
import cloudinary.uploader
import cloudinary.api
import uuid
from ..config import settings


def init_cloudinary():
    """Initialize Cloudinary with credentials from settings."""
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def upload_resume_pdf(pdf_bytes: bytes, user_id: str, original_filename: str) -> dict:
    """
    Uploads a PDF to Cloudinary and returns the URL and public_id.
    Files are organized as: smartsync/resumes/{user_id}/{unique_id}_{filename}
    """
    init_cloudinary()

    unique_id = str(uuid.uuid4())[:8]
    safe_filename = original_filename.replace(" ", "_").replace(".pdf", "")
    public_id = f"smartsync/resumes/{user_id}/{unique_id}_{safe_filename}"

    result = cloudinary.uploader.upload(
        pdf_bytes,
        resource_type="raw",       # "raw" for non-image files like PDFs
        public_id=public_id,
        overwrite=True,
        tags=["resume", f"user_{user_id}"],
    )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


def delete_resume_pdf(public_id: str) -> bool:
    """Deletes a file from Cloudinary by its public_id."""
    try:
        init_cloudinary()
        result = cloudinary.uploader.destroy(public_id, resource_type="raw")
        return result.get("result") == "ok"
    except Exception:
        return False