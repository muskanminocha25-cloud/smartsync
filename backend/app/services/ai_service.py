"""
AI Service — the brain of SmartSync.
Uses LangChain + Groq for all AI operations.
The model name comes from the GROQ_MODEL setting in Render.
"""
import asyncio
import json
import re
from datetime import date, timedelta
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

from ..config import settings

CHUNK_SIZE = 10  # days generated per AI call


def _get_llm(temperature: float = 0.3, max_tokens: int = 4096) -> ChatGroq:
    """Creates a ChatGroq instance using the model set in the environment."""
    return ChatGroq(
        model=settings.groq_model,
        temperature=temperature,
        max_tokens=max_tokens,
        groq_api_key=settings.groq_api_key,
    )


def _clean_json_string(raw: str) -> str:
    """Removes markdown code fences if the AI wraps its JSON in them."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _extract_json(raw: str) -> dict:
    """Pull the JSON object out of the AI reply, even if it adds extra text."""
    raw = _clean_json_string(raw)
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON found in AI response")
    return json.loads(raw[start:end + 1])


# ───────────────────────── RESUME ANALYSIS ─────────────────────────
async def analyze_resume(resume_text: str, target_position: str) -> dict:
    """
    Sends the resume text to the AI and gets back a structured analysis.
    Returns: match_score, strengths, missing_skills, suggestions, raw_summary
    """
    llm = _get_llm(temperature=0.2, max_tokens=4000)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert campus placement advisor and technical recruiter with 10+ years of experience.
You analyze student resumes honestly and give direct, actionable feedback.
You MUST return ONLY valid JSON — no markdown, no extra text, no explanation before or after.""",
        ),
        (
            "human",
            """Analyze this student's resume for the role: {target_position}

RESUME:
{resume_text}

Return ONLY this JSON structure (fill all fields, be specific and honest):
{{
  "match_score": <integer from 0 to 100>,
  "strengths": [
    "<specific strength found in the resume>"
  ],
  "missing_skills": [
    {{
      "skill": "<exact skill name>",
      "importance": "<critical | important | nice-to-have>",
      "description": "<one clear sentence: why this matters for {target_position}>"
    }}
  ],
  "suggestions": [
    "<specific, actionable improvement>"
  ],
  "raw_summary": "<2-3 plain sentences summarizing the resume's overall strength for this role>"
}}

Provide at least 2 strengths and 3 missing skills. Keep everything direct and student-friendly.""",
        ),
    ])

    chain = prompt | llm | StrOutputParser()
    safe_text = resume_text[:6000]

    last_error = None
    for attempt in range(3):
        try:
            raw_result = await chain.ainvoke({
                "target_position": target_position,
                "resume_text": safe_text,
            })
            analysis = _extract_json(raw_result)
            analysis["match_score"] = max(0, min(100, int(analysis.get("match_score", 50))))
            return analysis
        except Exception as e:
            last_error = e
            await asyncio.sleep(2)
    raise last_error


# ───────────────────────── BLUEPRINT ─────────────────────────
async def generate_blueprint(
    target_position: str,
    timeline_days: int,
    analysis: dict,
    start_date: date,
) -> list[dict]:
    """
    Generates a day-by-day preparation blueprint.
    Builds the plan in small chunks (CHUNK_SIZE days per AI call)
    so the AI reply never gets cut off.
    """
    missing_skills_text = ", ".join(
        [s.get("skill", "") for s in analysis.get("missing_skills", [])]
    ) or "General skills for the role"
    strengths_text = ", ".join(analysis.get("strengths", [])) or "Not assessed"

    all_days = []
    for start_day in range(1, timeline_days + 1, CHUNK_SIZE):
        end_day = min(start_day + CHUNK_SIZE - 1, timeline_days)
        days = await _generate_days_chunk(
            target_position, missing_skills_text, strengths_text,
            start_day, end_day, start_date, timeline_days,
        )
        all_days.extend(days)
    return all_days


async def _generate_days_chunk(
    target_position: str,
    missing_skills: str,
    strengths: str,
    start_day: int,
    end_day: int,
    plan_start_date: date,
    total_days: int,
) -> list[dict]:
    """Generates one small chunk of days. Retries up to 3 times if the reply is broken."""
    llm = _get_llm(temperature=0.4, max_tokens=8000)
    days_count = end_day - start_day + 1

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a campus placement coach. Return ONLY valid JSON, no extra text.",
        ),
        (
            "human",
            """Create Day {start_day} to Day {end_day} (exactly {days_count} days) of a
{total_days}-day preparation plan for a student targeting: {target_position}

Missing skills: {missing_skills}
Existing strengths: {strengths}

Rules:
- Start easy and get harder as the day number grows (this is day {start_day} of {total_days})
- 2-3 tasks per day, keep every description to ONE short sentence
- 1 real resource per day (LeetCode, GeeksForGeeks, YouTube, official docs)

Return ONLY this JSON:
{{"days": [{{"day_number": {start_day}, "theme": "short theme",
"tasks": [{{"description": "one sentence", "duration_minutes": 60, "type": "study"}}],
"resources": [{{"title": "name", "url": "https://...", "type": "article"}}]}}]}}

Type must be one of: study, practice, project, revision.""",
        ),
    ])
    chain = prompt | llm | StrOutputParser()

    last_error = None
    days = []
    for attempt in range(3):
        try:
            raw = await chain.ainvoke({
                "target_position": target_position,
                "missing_skills": missing_skills,
                "strengths": strengths,
                "days_count": days_count,
                "start_day": start_day,
                "end_day": end_day,
                "total_days": total_days,
            })
            days = _extract_json(raw).get("days", [])
            if not days:
                raise ValueError("AI returned no days")
            break
        except Exception as e:
            last_error = e
            await asyncio.sleep(2)
    else:
        raise last_error

    days = days[:days_count]
    for i, day in enumerate(days):
        day["day_number"] = start_day + i
        day["date"] = str(plan_start_date + timedelta(days=start_day + i - 1))
        for task in day.get("tasks", []):
            task.setdefault("completed", False)
        day.setdefault("resources", [])

    return days


# ───────────────────────── CHAT ─────────────────────────
async def chat_response(
    user_message: str,
    conversation_history: list[dict],
    context: dict,
) -> str:
    """
    Generates a contextual chat response.
    Uses the student's resume analysis as context for personalized answers.
    """
    llm = _get_llm(temperature=0.5, max_tokens=2000)

    missing_skills = ", ".join(context.get("missing_skills", [])) or "Not analyzed yet"

    system_content = f"""You are SmartSync's placement advisor — direct, human, and specific.
Help this student prepare for campus placements.

THIS STUDENT'S PROFILE:
- Target role: {context.get('target_position', 'Not specified')}
- Resume match score: {context.get('match_score', 'Not analyzed')}/100
- Missing skills: {missing_skills}
- Timeline: {context.get('timeline_days', 'Not set')} days

RULES:
1. Always reference their specific situation — never give generic advice
2. Be direct and concise
3. Never make up facts, links, or statistics you don't know
4. Keep answers under 200 words unless they ask for something detailed
5. Use plain language — no jargon"""

    messages = [SystemMessage(content=system_content)]

    for msg in conversation_history[-8:]:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_message))

    response = await llm.ainvoke(messages)
    return response.content