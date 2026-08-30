from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import uuid

from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text
from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    create_faiss_index,
    save_faiss_index
)

from backend.database import SessionLocal
from backend.models.document import Document


router = APIRouter()

UPLOAD_DIR = Path("storage/pdfs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    # -----------------------------
    # 1. Validate file
    # -----------------------------

    if file.content_type != "application/pdf":

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    # -----------------------------
    # 2. Generate unique ID
    # -----------------------------

    file_id = str(uuid.uuid4())

    filename = f"{file_id}.pdf"

    file_path = UPLOAD_DIR / filename

    # -----------------------------
    # 3. Save PDF
    # -----------------------------

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # -----------------------------
    # 4. Create DB record
    # -----------------------------

    db = SessionLocal()

    document = Document(
        file_id=file_id,
        filename=file.filename,
        stored_as=filename,
        status="processing"
    )

    db.add(document)
    db.commit()

    try:

        # -----------------------------
        # 5. Extract text
        # -----------------------------

        pages = extract_text_from_pdf(
            str(file_path)
        )

        if not pages:

            raise ValueError(
                "No pages found in PDF."
            )

        # -----------------------------
        # 6. Chunk text
        # -----------------------------

        chunks = chunk_text(pages)

        if not chunks:

            raise ValueError(
                "No text could be extracted from PDF."
            )

        # -----------------------------
        # 7. Generate embeddings
        # -----------------------------

        embeddings = generate_embeddings(
            chunks
        )

        # -----------------------------
        # 8. Create FAISS index
        # -----------------------------

        index = create_faiss_index(
            embeddings
        )

        # -----------------------------
        # 9. Save FAISS
        # -----------------------------

        save_faiss_index(
            index,
            chunks,
            file_id
        )

        # -----------------------------
        # 10. Update DB
        # -----------------------------

        document.total_pages = len(pages)

        document.total_chunks = len(chunks)

        document.embedding_dimension = embeddings.shape[1]

        document.status = "completed"

        document.error_message = None

        db.commit()

        # -----------------------------
        # 11. Return response
        # -----------------------------

        return {
            "message": "PDF uploaded and processed successfully",
            "file_id": file_id,
            "filename": file.filename,
            "stored_as": filename,
            "total_pages": len(pages),
            "total_chunks": len(chunks),
            "embedding_dimension": embeddings.shape[1],
            "faiss_vectors": index.ntotal,
            "status": "completed"
        }

    except Exception as e:

        # -----------------------------
        # Processing failed
        # -----------------------------

        document.status = "failed"

        document.error_message = str(e)

        db.commit()

        # Remove PDF
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(e)}"
        )

    finally:

        db.close()
