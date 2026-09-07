from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import uuid

from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text
from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import add_to_notebook_faiss

from backend.database import SessionLocal
from backend.models.document import Document
from backend.models.notebook import Notebook


router = APIRouter()


@router.post("/notebooks/{notebook_id}/upload-pdf")
async def upload_pdf(
    notebook_id: str,
    file: UploadFile = File(...)
):

    # -----------------------------
    # 1. Validate PDF
    # -----------------------------

    if file.content_type != "application/pdf":

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    # -----------------------------
    # 2. Open database
    # -----------------------------

    db = SessionLocal()

    try:

        # -----------------------------
        # 3. Check notebook exists
        # -----------------------------

        notebook = (
            db.query(Notebook)
            .filter(
                Notebook.notebook_id == notebook_id
            )
            .first()
        )

        if not notebook:

            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        # -----------------------------
        # 4. Create notebook source directory
        # -----------------------------

        source_dir = (
            Path("storage/notebooks")
            / str(notebook_id)
            / "sources"
        )

        source_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        # -----------------------------
        # 5. Generate unique file ID
        # -----------------------------

        file_id = str(uuid.uuid4())

        stored_filename = f"{file_id}.pdf"

        file_path = (
            source_dir
            / stored_filename
        )

        # -----------------------------
        # 6. Save PDF
        # -----------------------------

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # -----------------------------
        # 7. Create document record
        # -----------------------------

        document = Document(
            file_id=file_id,
            notebook_id=notebook_id,
            filename=file.filename,
            stored_as=stored_filename,
            status="processing"
        )

        db.add(document)
        db.commit()

        try:

            # -----------------------------
            # 8. Extract text
            # -----------------------------

            pages = extract_text_from_pdf(
                str(file_path)
            )

            if not pages:

                raise ValueError(
                    "No pages found in PDF."
                )

            # -----------------------------
            # 9. Create chunks
            # -----------------------------

            chunks = chunk_text(
                pages
            )

            if not chunks:

                raise ValueError(
                    "No text could be extracted from PDF."
                )

            # -----------------------------
            # Add file ID to chunks
            # -----------------------------

            for chunk in chunks:

                chunk["file_id"] = file_id

            # -----------------------------
            # 10. Generate embeddings
            # -----------------------------

            embeddings = generate_embeddings(
                chunks
            )

            # -----------------------------
            # 11. Add to Notebook FAISS
            # -----------------------------

            index, all_chunks = add_to_notebook_faiss(
                notebook_id=notebook_id,
                embeddings=embeddings,
                chunks=chunks
            )

            # -----------------------------
            # 12. Update document
            # -----------------------------

            document.total_pages = len(pages)

            document.total_chunks = len(chunks)

            document.embedding_dimension = (
                embeddings.shape[1]
            )

            document.status = "completed"

            document.error_message = None

            db.commit()

            # -----------------------------
            # 13. Return response
            # -----------------------------

            return {
                "message": "PDF uploaded and processed successfully",
                "notebook_id": notebook_id,
                "notebook_name": notebook.name,
                "file_id": file_id,
                "filename": file.filename,
                "stored_as": stored_filename,
                "total_pages": len(pages),
                "total_chunks": len(chunks),
                "embedding_dimension": embeddings.shape[1],
                "faiss_vectors": index.ntotal,
                "notebook_chunks": len(all_chunks),
                "status": "completed"
            }

        except Exception as e:

            # -----------------------------
            # Mark document as failed
            # -----------------------------

            document.status = "failed"

            document.error_message = str(e)

            db.commit()

            # -----------------------------
            # Delete failed PDF
            # -----------------------------

            if file_path.exists():

                file_path.unlink()

            raise HTTPException(
                status_code=500,
                detail=f"PDF processing failed: {str(e)}"
            )

    finally:

        db.close()
