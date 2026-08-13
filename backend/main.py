from fastapi import FastAPI
from backend.api.upload import router as upload_router

app = FastAPI(
    title="ProfessorMind AI",
    version="1.0.0"
)

app.include_router(upload_router, prefix="/api")


@app.get("/")
def home():
    return {"message": "ProfessorMind AI Backend Running"}
