import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.task import ChatSession, ChatMessage
from ..models.resume import Resume
from ..schemas.task import ChatSendRequest, ChatMessageResponse, ChatResponse
from ..services.ai_service import chat_response

router = APIRouter()


@router.post("/send", response_model=ChatResponse)
async def send_message(
    data: ChatSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sends a message and gets an AI response.
    Creates a new chat session if session_id is not provided.
    The AI response is grounded in the user's resume analysis and blueprint.
    """
    # Get or create a chat session
    if data.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == data.session_id,
            ChatSession.user_id == current_user.id,
        ).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    else:
        # Find the active resume for context
        active_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id,
            Resume.is_active == True,
        ).first()

        session = ChatSession(
            user_id=current_user.id,
            resume_id=active_resume.id if active_resume else None,
        )
        db.add(session)
        db.flush()

    # Load conversation history (last 10 messages)
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()

    history_dicts = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(history)
    ]

    # Build context from the user's active resume analysis
    context = {"target_position": "Not set", "match_score": "Not analyzed", "missing_skills": []}

    if session.resume_id:
        resume = db.query(Resume).filter(Resume.id == session.resume_id).first()
        if resume:
            context["target_position"] = resume.target_position
            if resume.analysis:
                context["match_score"] = resume.analysis.match_score
                context["missing_skills"] = [
                    s.get("skill", "") for s in resume.analysis.missing_skills
                ]

    # Save the user's message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=data.message,
    )
    db.add(user_msg)
    db.flush()

    # Get AI response
    try:
        ai_content = await chat_response(
            user_message=data.message,
            conversation_history=history_dicts,
            context=context,
        )
    except Exception as e:
        ai_content = "I'm having trouble responding right now. Please try again in a moment."
        print(f"[Chat Error] {e}")

    # Save AI response
    ai_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_content,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ChatResponse(session_id=session.id, message=ai_msg)


@router.get("/history", response_model=list[ChatMessageResponse])
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all messages from the user's most recent chat session.
    """
    session = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).first()

    if not session:
        return []

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).all()

    return messages


@router.delete("/clear", status_code=status.HTTP_200_OK)
async def clear_chat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clears all messages from the user's most recent chat session."""
    session = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).first()

    if session:
        db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete()
        db.commit()

    return {"message": "Chat cleared."}