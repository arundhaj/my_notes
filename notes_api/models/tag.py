"""Tags: labels applied to pages."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, created_at, uuid_pk

if TYPE_CHECKING:
    from .page import Page


class Tag(Base):
    """A label applied to pages. Names are unique across the workspace."""

    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("name"),
        CheckConstraint("length(name) > 0"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = created_at()

    pages: Mapped[list[Page]] = relationship(
        secondary="page_tags", back_populates="tags", viewonly=True
    )
