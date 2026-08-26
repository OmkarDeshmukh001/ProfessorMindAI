from fastapi import FastAPI

from backend.api.upload import router as upload_router
from backend.api.question import router as question_router

from backend.database import Base, engine
from backend.models.document import Document


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="ProfessorMind AI",
    version="1.0.0"
)


app.include_router(
    upload_router,
    prefix="/api"
)

app.include_router(
    question_router,
    prefix="/api"
)


@app.get("/")
def home():
    return {
        "message": "ProfessorMind AI Backend Running"
    }
