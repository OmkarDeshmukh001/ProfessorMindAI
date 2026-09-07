from fastapi import APIRouter, HTTPException

from backend.database import SessionLocal
from backend.models.document import Document

from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    load_notebook_faiss,
    save_notebook_faiss,
    create_faiss_index
)

from pathlib import Path


router = APIRouter()


# --------------------------------------------------
# Base storage directory
# --------------------------------------------------

NOTEBOOKS_DIR = Path("storage/notebooks")


# --------------------------------------------------
# 1. List documents inside a notebook
# --------------------------------------------------

@router.get("/notebooks/{notebook_id}/documents")
def get_notebook_documents(notebook_id: str):

    db = SessionLocal()

    try:

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id == notebook_id
            )
            .all()
        )

        return {
            "notebook_id": notebook_id,
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
# 2. Delete document from notebook
# --------------------------------------------------

@router.delete(
    "/notebooks/{notebook_id}/documents/{file_id}"
)
def delete_document(
    notebook_id: str,
    file_id: str
):

    db = SessionLocal()

    try:

        # ------------------------------------------
        # Find document inside this notebook
        # ------------------------------------------

        document = (
            db.query(Document)
            .filter(
                Document.file_id == file_id,
                Document.notebook_id == notebook_id
            )
            .first()
        )

        if not document:

            raise HTTPException(
                status_code=404,
                detail="Document not found in this notebook."
            )

        # ------------------------------------------
        # Delete PDF from notebook-specific folder
        # ------------------------------------------

        pdf_path = (
            NOTEBOOKS_DIR
            / str(notebook_id)
            / "sources"
            / document.stored_as
        )

        if pdf_path.exists():
            pdf_path.unlink()

        # ------------------------------------------
        # Load notebook FAISS
        # ------------------------------------------

        index, chunks = load_notebook_faiss(
            notebook_id
        )

        # ------------------------------------------
        # Remove chunks belonging to this file
        # ------------------------------------------

        remaining_chunks = [
            chunk
            for chunk in chunks
            if chunk.get("file_id") != file_id
        ]

        # ------------------------------------------
        # Rebuild notebook FAISS
        # ------------------------------------------

        if remaining_chunks:

            embeddings = generate_embeddings(
                remaining_chunks
            )

            new_index = create_faiss_index(
                embeddings
            )

            save_notebook_faiss(
                new_index,
                remaining_chunks,
                notebook_id
            )

        else:

            # --------------------------------------
            # No chunks left in notebook
            # --------------------------------------

            faiss_dir = (
                NOTEBOOKS_DIR
                / str(notebook_id)
                / "faiss"
            )

            index_path = faiss_dir / "index.faiss"
            metadata_path = faiss_dir / "metadata.pkl"

            if index_path.exists():
                index_path.unlink()

            if metadata_path.exists():
                metadata_path.unlink()

        # ------------------------------------------
        # Delete database record
        # ------------------------------------------

        filename = document.filename

        db.delete(document)
        db.commit()

        return {
            "message": "Document deleted successfully",
            "notebook_id": notebook_id,
            "file_id": file_id,
            "filename": filename
        }

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )

    finally:

        db.close()
