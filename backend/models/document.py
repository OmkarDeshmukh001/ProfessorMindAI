from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime

from backend.database import Base


class Document(Base):

    __tablename__ = "documents"

    file_id = Column(String, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    stored_as = Column(String, nullable=False)

    total_pages = Column(Integer, default=0)

    total_chunks = Column(Integer, default=0)

    embedding_dimension = Column(Integer, default=0)

    status = Column(
        String,
        nullable=False,
        default="processing"
    )

    error_message = Column(
        String,
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )
