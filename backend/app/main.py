from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth, resume, blueprint, tasks, chat, analytics

# Import all routers (we'll build these in Phase 2)
from .routers import auth, resume, blueprint, tasks, chat

app = FastAPI(
    title="SmartSync API",
    description="Semantic Placement Analytics and Adaptive Career Engine",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI at /docs
    redoc_url="/redoc",     # ReDoc at /redoc
)

# ── CORS Configuration ─────────────────────────────────────────
# This allows your frontend (Next.js) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ───────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(blueprint.router, prefix="/blueprint", tags=["Blueprint"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])


# ── Health Check ────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "SmartSync API is running",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}