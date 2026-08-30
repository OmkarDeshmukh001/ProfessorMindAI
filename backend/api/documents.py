from fastapi import APIRouter, HTTPException

from backend.database import SessionLocal
from backend.models.document import Document

from pathlib import Path


router = APIRouter()

PDF_DIR = Path("storage/pdfs")
FAISS_DIR = Path("storage/faiss")


# --------------------------------------------------
# 1. List all documents
# --------------------------------------------------

@router.get("/documents")
def get_documents():

    db = SessionLocal()

    try:
        documents = db.query(Document).all()

        return {
            "total_documents": len(documents),
            "documents": [
                {
                    "file_id": doc.file_id,
                    "filename": doc.filename,
                    "stored_as": doc.stored_as,
                    "total_pages": doc.total_pages,
                    "total_chunks": doc.total_chunks,
                    "embedding_dimension": doc.embedding_dimension,
                    "status": doc.status,
                    "uploaded_at": doc.uploaded_at
                }
                for doc in documents
            ]
        }

    finally:
        db.close()


# --------------------------------------------------
# 2. Get one document
# --------------------------------------------------

@router.get("/documents/{file_id}")
def get_document(file_id: str):

    db = SessionLocal()

    try:
        document = (
            db.query(Document)
            .filter(Document.file_id == file_id)
            .first()
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        return {
            "file_id": document.file_id,
            "filename": document.filename,
            "stored_as": document.stored_as,
            "total_pages": document.total_pages,
            "total_chunks": document.total_chunks,
            "embedding_dimension": document.embedding_dimension,
            "status": document.status,
            "uploaded_at": document.uploaded_at
        }

    finally:
        db.close()


# --------------------------------------------------
# 3. Delete document
# --------------------------------------------------

@router.delete("/documents/{file_id}")
def delete_document(file_id: str):

    db = SessionLocal()

    try:

        document = (
            db.query(Document)
            .filter(Document.file_id == file_id)
            .first()
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        # Delete PDF
        pdf_path = PDF_DIR / document.stored_as

        if pdf_path.exists():
            pdf_path.unlink()

        # Delete FAISS index
        index_path = FAISS_DIR / f"{file_id}.index"

        if index_path.exists():
            index_path.unlink()

        # Delete FAISS metadata
        metadata_path = FAISS_DIR / f"{file_id}.pkl"

        if metadata_path.exists():
            metadata_path.unlink()

        # Delete database record
        db.delete(document)
        db.commit()

        return {
            "message": "Document deleted successfully",
            "file_id": file_id
        }

    finally:
        db.close()
