"""
AI Service — the brain of SmartSync.
Uses LangChain + Groq (FREE) for all AI operations.
Model: llama-3.1-70b-versatile (Meta's open-source Llama 3.1)
"""

import json
import re
from datetime import date, timedelta
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

from ..config import settings


def _get_llm(temperature: float = 0.3, max_tokens: int = 4096) -> ChatGroq:
    """Creates a ChatGroq instance — same interface as ChatOpenAI, 100% free."""
    return ChatGroq(
        model=settings.groq_model,
        temperature=temperature,
        max_tokens=max_tokens,
        groq_api_key=settings.groq_api_key,
    )


def _clean_json_string(raw: str) -> str:
    """
    Removes markdown code fences if the AI wraps its JSON in them.
    Example: ```json {...} ``` → {...}
    """
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


async def analyze_resume(resume_text: str, target_position: str) -> dict:
    """
    Sends the resume text to Groq and gets back a structured analysis.
    Returns: match_score, strengths, missing_skills, suggestions, raw_summary
    """
    llm = _get_llm(temperature=0.2, max_tokens=2000)

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

    raw_result = await chain.ainvoke({
        "target_position": target_position,
        "resume_text": safe_text,
    })

    cleaned = _clean_json_string(raw_result)
    analysis = json.loads(cleaned)
    analysis["match_score"] = max(0, min(100, int(analysis.get("match_score", 50))))

    return analysis


async def generate_blueprint(
    target_position: str,
    timeline_days: int,
    analysis: dict,
    start_date: date,
) -> list[dict]:
    """
    Generates a day-by-day preparation blueprint.
    Splits into two calls for 60/90-day plans to stay within token limits.
    """
    missing_skills_text = ", ".join(
        [s.get("skill", "") for s in analysis.get("missing_skills", [])]
    ) or "General skills for the role"

    strengths_text = ", ".join(analysis.get("strengths", [])) or "Not assessed"

    if timeline_days <= 30:
        return await _generate_days_chunk(
            target_position, missing_skills_text, strengths_text,
            1, timeline_days, start_date
        )
    else:
        half = timeline_days // 2
        first_half = await _generate_days_chunk(
            target_position, missing_skills_text, strengths_text,
            1, half, start_date
        )
        second_half = await _generate_days_chunk(
            target_position, missing_skills_text, strengths_text,
            half + 1, timeline_days, start_date
        )
        return first_half + second_half


async def _generate_days_chunk(
    target_position: str,
    missing_skills: str,
    strengths: str,
    start_day: int,
    end_day: int,
    plan_start_date: date,
) -> list[dict]:
    """Generates a chunk of days and returns them as a list of dicts."""
    llm = _get_llm(temperature=0.4, max_tokens=8000)
    days_count = end_day - start_day + 1

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a campus placement coach creating a precise day-by-day study plan.
Be specific, realistic, and progressive. Return ONLY valid JSON.""",
        ),
        (
            "human",
            """Create a {days_count}-day preparation plan (Day {start_day} to Day {end_day})
for a student targeting: {target_position}

Missing skills: {missing_skills}
Existing strengths: {strengths}

RULES:
- Start from basics, get harder over time
- Mix study, practice, and revision
- Each day: 2-4 tasks totaling 2-4 hours
- Resources must be REAL sites (LeetCode, GeeksForGeeks, YouTube, official docs)
- Be specific to {target_position}

Return ONLY this JSON:
{{
  "days": [
    {{
      "day_number": {start_day},
      "theme": "<short theme e.g. 'Arrays & Two Pointers'>",
      "tasks": [
        {{
          "description": "<specific task>",
          "duration_minutes": <30 to 120>,
          "type": "<study | practice | project | revision>"
        }}
      ],
      "resources": [
        {{
          "title": "<resource name>",
          "url": "<real URL or null>",
          "type": "<video | article | practice | book>"
        }}
      ]
    }},
    ... all {days_count} days ...
  ]
}}

Generate ALL {days_count} days from Day {start_day} to Day {end_day}.""",
        ),
    ])

    chain = prompt | llm | StrOutputParser()

    raw_result = await chain.ainvoke({
        "target_position": target_position,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "days_count": days_count,
        "start_day": start_day,
        "end_day": end_day,
    })

    cleaned = _clean_json_string(raw_result)
    data = json.loads(cleaned)
    days = data.get("days", [])

    for day in days:
        day_offset = day["day_number"] - 1
        day["date"] = str(plan_start_date + timedelta(days=day_offset))
        for task in day.get("tasks", []):
            task.setdefault("completed", False)

    return days


async def chat_response(
    user_message: str,
    conversation_history: list[dict],
    context: dict,
) -> str:
    """
    Generates a contextual chat response.
    Uses the student's resume analysis as context for personalized answers.
    """
    llm = _get_llm(temperature=0.5, max_tokens=1000)

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