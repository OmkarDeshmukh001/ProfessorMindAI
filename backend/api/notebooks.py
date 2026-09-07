from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
import shutil
from pathlib import Path

from backend.database import SessionLocal
from backend.models.notebook import Notebook
from backend.models.document import Document


router = APIRouter()


NOTEBOOKS_DIR = Path("storage/notebooks")


class NotebookCreate(BaseModel):

    name: str
    description: str | None = None


# --------------------------------------------------
# 1. Create Notebook
# --------------------------------------------------

@router.post("/notebooks")
def create_notebook(data: NotebookCreate):

    db: Session = SessionLocal()

    try:

        notebook_id = str(uuid.uuid4())

        notebook = Notebook(
            notebook_id=notebook_id,
            name=data.name,
            description=data.description
        )

        db.add(notebook)
        db.commit()
        db.refresh(notebook)

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


# --------------------------------------------------
# 2. Get all notebooks
# --------------------------------------------------

@router.get("/notebooks")
def get_notebooks():

    db: Session = SessionLocal()

    try:

        notebooks = (
            db.query(Notebook)
            .order_by(Notebook.created_at.desc())
            .all()
        )

        return {
            "total_notebooks": len(notebooks),
            "notebooks": [
                {
                    "notebook_id": notebook.notebook_id,
                    "name": notebook.name,
                    "description": notebook.description,
                    "created_at": notebook.created_at
                }
                for notebook in notebooks
            ]
        }

    finally:

        db.close()


# --------------------------------------------------
# 3. Get one notebook
# --------------------------------------------------

@router.get("/notebooks/{notebook_id}")
def get_notebook(notebook_id: str):

    db: Session = SessionLocal()

    try:

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

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id == notebook_id
            )
            .all()
        )

        return {
            "notebook_id": notebook.notebook_id,
            "name": notebook.name,
            "description": notebook.description,
            "created_at": notebook.created_at,
            "total_documents": len(documents),
            "documents": [
                {
                    "file_id": doc.file_id,
                    "filename": doc.filename,
                    "total_pages": doc.total_pages,
                    "total_chunks": doc.total_chunks,
                    "status": doc.status
                }
                for doc in documents
            ]
        }

    finally:

        db.close()


# --------------------------------------------------
# 4. Delete Notebook
# --------------------------------------------------

@router.delete("/notebooks/{notebook_id}")
def delete_notebook(notebook_id: str):

    db: Session = SessionLocal()

    try:

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
        # Delete PDFs belonging to notebook
        # ------------------------------------------

        documents = (
            db.query(Document)
            .filter(
                Document.notebook_id == notebook_id
            )
            .all()
        )

        for document in documents:

            pdf_path = (
                Path("storage/pdfs")
                / document.stored_as
            )

            if pdf_path.exists():
                pdf_path.unlink()

        # ------------------------------------------
        # Delete notebook storage
        # ------------------------------------------

        notebook_storage = (
            NOTEBOOKS_DIR
            / str(notebook_id)
        )

        if notebook_storage.exists():

            shutil.rmtree(
                notebook_storage
            )

        # ------------------------------------------
        # Delete document records
        # ------------------------------------------

        for document in documents:
            db.delete(document)

        # ------------------------------------------
        # Delete notebook
        # ------------------------------------------

        db.delete(notebook)

        db.commit()

        return {
            "message": "Notebook deleted successfully",
            "notebook_id": notebook_id,
            "deleted_documents": len(documents)
        }

    finally:

        db.close()
