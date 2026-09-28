from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import uuid

from backend.services.pdf_extractor import extract_text_from_pdf
from backend.services.text_chunker import chunk_text
from backend.services.embedding_service import generate_embeddings
from backend.services.vector_store import add_to_notebook_faiss

from backend.services.video_processor import extract_audio
from backend.services.whisper_service import transcribe_audio
from backend.services.video_chunker import chunk_transcript

from backend.database import SessionLocal
from backend.models.document import Document
from backend.models.notebook import Notebook

router = APIRouter()


# ============================================================
# PDF UPLOAD
# ============================================================

@router.post("/notebooks/{notebook_id}/upload-pdf")
async def upload_pdf(
    notebook_id: str,
    file: UploadFile = File(...)
):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    db = SessionLocal()

    try:

        notebook = db.query(Notebook).filter(
            Notebook.notebook_id == notebook_id
        ).first()

        if not notebook:
            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        source_dir = (
            Path("storage/notebooks")
            / str(notebook_id)
            / "sources"
        )

        source_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        file_id = str(uuid.uuid4())

        stored_filename = f"{file_id}.pdf"

        file_path = source_dir / stored_filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )

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

            # -----------------------------------------
            # Extract PDF pages
            # -----------------------------------------

            pages = extract_text_from_pdf(
                str(file_path)
            )

            if not pages:
                raise ValueError(
                    "No pages found in PDF."
                )

            # -----------------------------------------
            # Chunk PDF
            # -----------------------------------------

            chunks = chunk_text(
                pages
            )

            if not chunks:
                raise ValueError(
                    "No text could be extracted from PDF."
                )

            # -----------------------------------------
            # Add file ID to every chunk
            # -----------------------------------------

            for chunk in chunks:
                chunk["file_id"] = file_id

            # -----------------------------------------
            # Generate embeddings
            # -----------------------------------------

            embeddings = generate_embeddings(
                chunks
            )

            # -----------------------------------------
            # Add to notebook FAISS
            # -----------------------------------------

            index, all_chunks = add_to_notebook_faiss(
                notebook_id=notebook_id,
                embeddings=embeddings,
                chunks=chunks
            )

            # -----------------------------------------
            # Update document
            # -----------------------------------------

            document.total_pages = len(pages)

            document.total_chunks = len(chunks)

            document.embedding_dimension = (
                embeddings.shape[1]
            )

            document.status = "completed"

            document.error_message = None

            db.commit()

            return {
                "message": (
                    "PDF uploaded and processed "
                    "successfully"
                ),
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

            document.status = "failed"

            document.error_message = str(e)

            db.commit()

            if file_path.exists():
                file_path.unlink()

            raise HTTPException(
                status_code=500,
                detail=(
                    f"PDF processing failed: {str(e)}"
                )
            )

    finally:

        db.close()


# ============================================================
# VIDEO UPLOAD
# ============================================================

@router.post("/notebooks/{notebook_id}/upload-video")
async def upload_video(
    notebook_id: str,
    file: UploadFile = File(...)
):

    allowed_types = {
        "video/mp4",
        "video/mpeg",
        "video/webm",
        "video/quicktime"
    }

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported video format. "
                "Allowed formats: MP4, MPEG, WebM, MOV."
            )
        )

    db = SessionLocal()

    file_path = None
    audio_path = None
    transcript_path = None

    try:

        # ==================================================
        # 1. Verify notebook
        # ==================================================

        notebook = db.query(Notebook).filter(
            Notebook.notebook_id == notebook_id
        ).first()

        if not notebook:

            raise HTTPException(
                status_code=404,
                detail="Notebook not found."
            )

        # ==================================================
        # 2. Create storage directories
        # ==================================================

        notebook_dir = (
            Path("storage/notebooks")
            / str(notebook_id)
        )

        source_dir = (
            notebook_dir
            / "sources"
        )

        source_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        # Temporary processing directory
        processing_dir = (
            notebook_dir
            / "processing"
        )

        processing_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        # ==================================================
        # 3. Generate file ID
        # ==================================================

        file_id = str(uuid.uuid4())

        original_extension = (
            Path(file.filename).suffix.lower()
        )

        if not original_extension:
            original_extension = ".mp4"

        stored_filename = (
            f"{file_id}{original_extension}"
        )

        file_path = (
            source_dir
            / stored_filename
        )

        # ==================================================
        # 4. Save uploaded video
        # ==================================================

        with open(file_path, "wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # ==================================================
        # 5. Create document record
        # ==================================================

        document = Document(
            file_id=file_id,
            notebook_id=notebook_id,
            filename=file.filename,
            stored_as=stored_filename,
            file_type="video",
            status="processing"
        )

        db.add(document)
        db.commit()

        try:

            # ==================================================
            # 6. Extract audio
            # ==================================================

            audio_path = (
                processing_dir
                / f"{file_id}.wav"
            )

            extract_audio(
                video_path=str(file_path),
                audio_path=str(audio_path)
            )

            # ==================================================
            # 7. Transcribe using Whisper
            # ==================================================

            transcript_path = (
                processing_dir
                / f"{file_id}_transcript.json"
            )

            transcript = transcribe_audio(
                audio_path=str(audio_path),
                transcript_path=str(transcript_path)
            )

            segments = transcript.get(
                "segments",
                []
            )

            if not segments:

                raise ValueError(
                    "Whisper could not extract "
                    "any speech from the video."
                )

            # ==================================================
            # 8. Create timestamped chunks
            # ==================================================

            chunks = chunk_transcript(
                segments=segments,
                chunk_size=500,
                overlap=100
            )

            if not chunks:

                raise ValueError(
                    "No transcript chunks were created."
                )

            # ==================================================
            # 9. Add file ID to every video chunk
            # ==================================================

            for chunk in chunks:

                chunk["file_id"] = file_id

                chunk["filename"] = file.filename

            # ==================================================
            # 10. Generate embeddings
            # ==================================================

            embeddings = generate_embeddings(
                chunks
            )

            if embeddings is None or len(embeddings) == 0:

                raise ValueError(
                    "No embeddings were generated."
                )

            # ==================================================
            # 11. Add video chunks to notebook FAISS
            # ==================================================

            index, all_chunks = add_to_notebook_faiss(
                notebook_id=notebook_id,
                embeddings=embeddings,
                chunks=chunks
            )

            # ==================================================
            # 12. Update document metadata
            # ==================================================

            document.total_chunks = len(chunks)

            document.embedding_dimension = (
                embeddings.shape[1]
            )

            document.status = "completed"

            document.error_message = None

            db.commit()

            # ==================================================
            # 13. Delete temporary processing files
            # ==================================================

            if audio_path and audio_path.exists():
                audio_path.unlink()

            if transcript_path and transcript_path.exists():
                transcript_path.unlink()

            # Remove processing directory if empty
            try:
                processing_dir.rmdir()
            except OSError:
                pass

            # ==================================================
            # 14. Return success
            # ==================================================

            return {
                "message": (
                    "Video uploaded and processed "
                    "successfully"
                ),
                "notebook_id": notebook_id,
                "notebook_name": notebook.name,
                "file_id": file_id,
                "filename": file.filename,
                "stored_as": stored_filename,
                "file_type": "video",
                "total_chunks": len(chunks),
                "embedding_dimension": embeddings.shape[1],
                "faiss_vectors": index.ntotal,
                "notebook_chunks": len(all_chunks),
                "status": "completed"
            }

        except Exception as e:

            # ==================================================
            # Processing failed
            # ==================================================

            document.status = "failed"

            document.error_message = str(e)

            db.commit()

            # Remove uploaded video
            if file_path and file_path.exists():
                file_path.unlink()

            # Remove temporary files
            if audio_path and audio_path.exists():
                audio_path.unlink()

            if transcript_path and transcript_path.exists():
                transcript_path.unlink()

            raise HTTPException(
                status_code=500,
                detail=(
                    f"Video processing failed: {str(e)}"
                )
            )

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        if audio_path and audio_path.exists():
            audio_path.unlink()

        if transcript_path and transcript_path.exists():
            transcript_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Video upload failed: {str(e)}"
            )
        )

    finally:

        db.close()
