from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.rag_service import answer_question


router = APIRouter()


class QuestionRequest(BaseModel):
    file_id: str
    question: str
    top_k: int = 8


@router.post("/ask")
async def ask_question(request: QuestionRequest):

    try:
        result = answer_question(
            query=request.question,
            file_id=request.file_id,
            top_k=request.top_k
        )

        return result

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="FAISS index for this file was not found."
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
