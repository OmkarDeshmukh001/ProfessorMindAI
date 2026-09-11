from fastapi import APIRouter, HTTPException
from pathlib import Path
import shutil

from backend.database import SessionLocal
from backend.models.document import Document
from backend.models.notebook import Notebook

from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import (
    load_notebook_faiss,
    save_notebook_faiss,
    create_faiss_index
)


router = APIRouter()


# --------------------------------------------------
# Base storage directory
# --------------------------------------------------

NOTEBOOKS_DIR = Path("storage/notebooks")


# ==================================================
# 1. GET ALL NOTEBOOKS WITH THEIR DOCUMENTS
# ==================================================

@router.get("/documents")
def get_all_documents():

    db = SessionLocal()

    try:

        notebooks = (
            db.query(Notebook)
            .order_by(Notebook.created_at)
            .all()
        )

        result = []

        for notebook in notebooks:

            documents = (
                db.query(Document)
                .filter(
                    Document.notebook_id == notebook.notebook_id
                )
                .all()
            )

            result.append({
                "notebook_id": notebook.notebook_id,
                "notebook_name": notebook.name,
                "description": notebook.description,
                "created_at": notebook.created_at,
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
            })

        return {
            "total_notebooks": len(notebooks),
            "notebooks": result
        }

    finally:

        db.close()


# ==================================================
# 2. GET DOCUMENTS OF ONE NOTEBOOK
# ==================================================

@router.get("/notebooks/{notebook_id}/documents")
def get_notebook_documents(notebook_id: str):

    db = SessionLocal()

    try:

        # ------------------------------------------
        # Check notebook exists
        # ------------------------------------------

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

        # ------------------------------------------
        # Get documents
        # ------------------------------------------

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id == notebook_id
            )
            .all()
        )

        return {
            "notebook_id": notebook_id,
            "notebook_name": notebook.name,
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


# ==================================================
# 3. DELETE ONE PDF FROM A NOTEBOOK
# ==================================================

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
        # Check notebook exists
        # ------------------------------------------

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

        # ------------------------------------------
        # Find document inside notebook
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

        filename = document.filename

        # ------------------------------------------
        # Delete PDF
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
        # Remove chunks belonging to this PDF
        # ------------------------------------------

        remaining_chunks = [
            chunk
            for chunk in chunks
            if chunk.get("file_id") != file_id
        ]

        # ------------------------------------------
        # Rebuild FAISS
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

            remaining_vectors = new_index.ntotal

        else:

            # --------------------------------------
            # No documents/chunks remain
            # --------------------------------------

            faiss_dir = (
                NOTEBOOKS_DIR
                / str(notebook_id)
                / "faiss"
            )

            index_path = (
                faiss_dir / "index.faiss"
            )

            metadata_path = (
                faiss_dir / "metadata.pkl"
            )

            if index_path.exists():
                index_path.unlink()

            if metadata_path.exists():
                metadata_path.unlink()

            remaining_vectors = 0

        # ------------------------------------------
        # Delete database record
        # ------------------------------------------

        db.delete(document)
        db.commit()

        return {
            "message": "Document deleted successfully",
            "notebook_id": notebook_id,
            "file_id": file_id,
            "filename": filename,
            "remaining_faiss_vectors": remaining_vectors
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


# ==================================================
# 4. DELETE ENTIRE NOTEBOOK
# ==================================================

@router.delete(
    "/notebooks/{notebook_id}"
)
def delete_notebook(notebook_id: str):

    db = SessionLocal()

    try:

        # ------------------------------------------
        # Check notebook exists
        # ------------------------------------------

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

        notebook_name = notebook.name

        # ------------------------------------------
        # Count documents
        # ------------------------------------------

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id == notebook_id
            )
            .all()
        )

        total_documents = len(documents)

        # ------------------------------------------
        # Delete document database records
        # ------------------------------------------

        for document in documents:
            db.delete(document)

        # ------------------------------------------
        # Delete notebook database record
        # ------------------------------------------

        db.delete(notebook)

        db.commit()

        # ------------------------------------------
        # Delete entire notebook storage
        # ------------------------------------------

        notebook_dir = (
            NOTEBOOKS_DIR
            / str(notebook_id)
        )

        if notebook_dir.exists():

            shutil.rmtree(
                notebook_dir
            )

        return {
            "message": "Notebook deleted successfully",
            "notebook_id": notebook_id,
            "notebook_name": notebook_name,
            "deleted_documents": total_documents
        }

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete notebook: {str(e)}"
        )

    finally:

        db.close()
