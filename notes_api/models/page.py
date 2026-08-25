"""Pages: the documents, arranged in a tree."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, created_at, updated_at, uuid_pk

if TYPE_CHECKING:
    from .block import Block
    from .favourite import Favourite
    from .page_visit import PageVisit
    from .tag import Tag


class Page(Base):
    """A document. `parent_id` nests it under another page; NULL means root."""

    __tablename__ = "pages"
    __table_args__ = (CheckConstraint("parent_id IS NULL OR parent_id <> id"),)

    id: Mapped[uuid.UUID] = uuid_pk()
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("''")
    )
    icon: Mapped[str | None] = mapped_column(Text)
    cover_url: Mapped[str | None] = mapped_column(Text)
    is_archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    is_trashed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()

    parent: Mapped[Page | None] = relationship(
        back_populates="children", remote_side="Page.id"
    )
    children: Mapped[list[Page]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    blocks: Mapped[list[Block]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )
    tags: Mapped[list[Tag]] = relationship(
        secondary="page_tags", back_populates="pages", viewonly=True
    )
    favourite: Mapped[Favourite | None] = relationship(
        back_populates="page", cascade="all, delete-orphan", uselist=False
    )
    visits: Mapped[list[PageVisit]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )
