import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    target_position: Mapped[str] = mapped_column(String(255), nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="resumes")
    analysis = relationship(
        "ResumeAnalysis", back_populates="resume", uselist=False, cascade="all, delete-orphan"
    )
    blueprints = relationship("Blueprint", back_populates="resume", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Resume id={self.id} name={self.name}>"


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One analysis per resume
    )
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    # JSONB stores Python lists/dicts directly in PostgreSQL
    strengths: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    missing_skills: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    suggestions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    raw_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Relationships
    resume = relationship("Resume", back_populates="analysis")