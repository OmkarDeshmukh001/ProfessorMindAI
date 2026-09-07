from sqlalchemy import Column, String, DateTime
from datetime import datetime

from backend.database import Base


class Notebook(Base):

    __tablename__ = "notebooks"

    notebook_id = Column(
        String,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
