from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import uuid
import shutil
import os
import stat
from pathlib import Path

from backend.database import SessionLocal
from backend.models.notebook import Notebook
from backend.models.document import Document


router = APIRouter()


# ==================================================
# Base notebook storage directory
# ==================================================

NOTEBOOKS_DIR = Path("storage/notebooks")


# ==================================================
# Notebook Create Schema
# ==================================================

class NotebookCreate(BaseModel):
    name: str
    description: str | None = None


# ==================================================
# Helper: Remove read-only files/folders on Windows
# ==================================================

def remove_readonly(func, path, exc_info):
    """
    Makes a read-only file writable and retries deletion.
    Useful on Windows when deleting FAISS/storage files.
    """

    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)

    except Exception:
        raise


# ==================================================
# 1. CREATE NOTEBOOK
# ==================================================

@router.post("/notebooks")
def create_notebook(data: NotebookCreate):

    db: Session = SessionLocal()

    try:

        # ------------------------------------------
        # Generate notebook ID
        # ------------------------------------------

        notebook_id = str(uuid.uuid4())

        # ------------------------------------------
        # Create database record
        # ------------------------------------------

        notebook = Notebook(
            notebook_id=notebook_id,
            name=data.name,
            description=data.description
        )

        db.add(notebook)
        db.commit()
        db.refresh(notebook)

        # ------------------------------------------
        # Create notebook storage
        #
        # storage/
        # └── notebooks/
        #     └── {notebook_id}/
        #         ├── sources/
        #         └── faiss/
        # ------------------------------------------

        notebook_storage = (
            NOTEBOOKS_DIR / notebook_id
        )

        sources_dir = (
            notebook_storage / "sources"
        )

        faiss_dir = (
            notebook_storage / "faiss"
        )

        sources_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        faiss_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        # ------------------------------------------
        # Return response
        # ------------------------------------------

        return {
            "message": "Notebook created successfully",
            "notebook_id": notebook.notebook_id,
            "name": notebook.name,
            "description": notebook.description,
            "created_at": notebook.created_at
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Notebook creation failed: {str(e)}"
        )

    finally:

        db.close()


# ==================================================
# 2. GET ALL NOTEBOOKS
# ==================================================

@router.get("/notebooks")
def get_notebooks():

    db: Session = SessionLocal()

    try:

        notebooks = (
            db.query(Notebook)
            .order_by(
                Notebook.created_at.desc()
            )
            .all()
        )

        result = []

        for notebook in notebooks:

            # --------------------------------------
            # Get documents belonging to notebook
            # --------------------------------------

            documents = (
                db.query(Document)
                .filter(
                    Document.notebook_id
                    == notebook.notebook_id
                )
                .all()
            )

            result.append({
                "notebook_id": notebook.notebook_id,
                "name": notebook.name,
                "description": notebook.description,
                "created_at": notebook.created_at,
                "total_documents": len(documents),

                "documents": [
                    {
                        "file_id": document.file_id,
                        "filename": document.filename,
                        "stored_as": document.stored_as,
                        "total_pages": document.total_pages,
                        "total_chunks": document.total_chunks,
                        "embedding_dimension": (
                            document.embedding_dimension
                        ),
                        "status": document.status,
                        "uploaded_at": document.uploaded_at
                    }
                    for document in documents
                ]
            })

        return {
            "total_notebooks": len(notebooks),
            "notebooks": result
        }

    finally:

        db.close()


# ==================================================
# 3. GET ONE NOTEBOOK
# ==================================================

@router.get("/notebooks/{notebook_id}")
def get_notebook(notebook_id: str):

    db: Session = SessionLocal()

    try:

        # ------------------------------------------
        # Find notebook
        # ------------------------------------------

        notebook = (
            db.query(Notebook)
            .filter(
                Notebook.notebook_id
                == notebook_id
            )
            .first()
        )

        if not notebook:

            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        # ------------------------------------------
        # Get notebook documents
        # ------------------------------------------

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id
                == notebook_id
            )
            .all()
        )

        # ------------------------------------------
        # Return notebook + documents
        # ------------------------------------------

        return {
            "notebook_id": notebook.notebook_id,
            "name": notebook.name,
            "description": notebook.description,
            "created_at": notebook.created_at,
            "total_documents": len(documents),

            "documents": [
                {
                    "file_id": document.file_id,
                    "filename": document.filename,
                    "stored_as": document.stored_as,
                    "total_pages": document.total_pages,
                    "total_chunks": document.total_chunks,
                    "embedding_dimension": (
                        document.embedding_dimension
                    ),
                    "status": document.status,
                    "uploaded_at": document.uploaded_at
                }
                for document in documents
            ]
        }

    finally:

        db.close()


# ==================================================
# 4. DELETE ENTIRE NOTEBOOK
# ==================================================

@router.delete("/notebooks/{notebook_id}")
def delete_notebook(notebook_id: str):

    db: Session = SessionLocal()

    try:

        # ------------------------------------------
        # Find notebook
        # ------------------------------------------

        notebook = (
            db.query(Notebook)
            .filter(
                Notebook.notebook_id
                == notebook_id
            )
            .first()
        )

        if not notebook:

            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        # ------------------------------------------
        # Find documents
        # ------------------------------------------

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id
                == notebook_id
            )
            .all()
        )

        total_documents = len(documents)

        # ------------------------------------------
        # Notebook storage
        #
        # storage/notebooks/{notebook_id}/
        # ├── sources/
        # └── faiss/
        # ------------------------------------------

        notebook_storage = (
            NOTEBOOKS_DIR
            / str(notebook_id)
        )

        # ------------------------------------------
        # Delete notebook storage
        # ------------------------------------------

        if notebook_storage.exists():

            try:

                shutil.rmtree(
                    notebook_storage,
                    onerror=remove_readonly
                )

            except Exception as e:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Could not delete notebook storage. "
                        "Please make sure no PDF or FAISS "
                        "file is open. "
                        f"Error: {str(e)}"
                    )
                )

        # ------------------------------------------
        # Delete document records
        # ------------------------------------------

        for document in documents:

            db.delete(document)

        # ------------------------------------------
        # Delete notebook record
        # ------------------------------------------

        db.delete(notebook)

        # ------------------------------------------
        # Commit database changes
        # ------------------------------------------

        db.commit()

        # ------------------------------------------
        # Return response
        # ------------------------------------------

        return {
            "message": "Notebook deleted successfully",
            "notebook_id": notebook_id,
            "deleted_documents": total_documents
        }

    except HTTPException:

        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Notebook deletion failed: {str(e)}"
            )
        )

    finally:

        db.close()
