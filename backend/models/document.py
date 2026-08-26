from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime

from backend.database import Base


class Document(Base):

    __tablename__ = "documents"

    file_id = Column(String, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    stored_as = Column(String, nullable=False)

    total_pages = Column(Integer, nullable=False)

    total_chunks = Column(Integer, nullable=False)

    embedding_dimension = Column(Integer, nullable=False)

    status = Column(String, nullable=False, default="processed")

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )
