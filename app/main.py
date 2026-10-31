import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db, SessionLocal
from app.db.models import PolicyDocumentModel
from app.target.policies import get_all_policies
from app.api.routes import router as api_router
from app.api.validation_suite import router as validation_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trustforge.main")

def seed_policies_if_needed():
    db = SessionLocal()
    try:
        count = db.query(PolicyDocumentModel).count()
        if count == 0:
            logger.info("Seeding initial 5 synthetic enterprise policy documents into SQLite database...")
            for p in get_all_policies():
                db.add(PolicyDocumentModel(
                    doc_id=p.doc_id,
                    title=p.title,
                    version=p.version,
                    last_updated=p.last_updated,
                    content=p.content,
                    important_requirements=p.important_requirements,
                    is_active=True
                ))
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing TrustForge AI database...")
    init_db()
    seed_policies_if_needed()
    logger.info("TrustForge AI backend operational.")
    yield
    logger.info("TrustForge AI shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic Quality Engineering for LLM-Enabled Systems",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix="/api")
app.include_router(validation_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "online",
        "docs_url": "/docs"
    }

