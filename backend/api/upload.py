from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import uuid

from backend.database import SessionLocal
from backend.models.document import Document
from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text
from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    create_faiss_index,
    save_faiss_index
)


router = APIRouter()

UPLOAD_DIR = Path("storage/pdfs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    # 1. Validate PDF
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    # 2. Generate unique file ID
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.pdf"

    file_path = UPLOAD_DIR / filename

    # 3. Save PDF
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        # 4. Extract text
        pages = extract_text_from_pdf(str(file_path))

        # 5. Create chunks
        chunks = chunk_text(pages)

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from this PDF."
            )

        # 6. Generate embeddings
        embeddings = generate_embeddings(chunks)

        # 7. Create FAISS index
        index = create_faiss_index(embeddings)

        # 8. Save FAISS + metadata
        index_path, metadata_path = save_faiss_index(
            index,
            chunks,
            file_id
        )

        # 9. Save document metadata to database
        db = SessionLocal()

        try:

            document = Document(
                file_id=file_id,
                filename=file.filename,
                stored_as=filename,
                total_pages=len(pages),
                total_chunks=len(chunks),
                embedding_dimension=embeddings.shape[1],
                status="processed"
            )

            db.add(document)
            db.commit()

        finally:
            db.close()

        # 10. Return response
        return {
            "message": "PDF uploaded and processed successfully",
            "file_id": file_id,
            "filename": file.filename,
            "stored_as": filename,
            "total_pages": len(pages),
            "total_chunks": len(chunks),
            "embedding_dimension": embeddings.shape[1],
            "faiss_vectors": index.ntotal
        }

    except HTTPException:
        raise

    except Exception as e:

        # Remove PDF if processing fails
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(e)}"
        )
