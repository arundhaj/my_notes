"""Favourites: pages pinned to the sidebar."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, created_at

if TYPE_CHECKING:
    from .page import Page


class Favourite(Base):
    """A pinned page. One row per page, so `page_id` is the primary key;
    `position` gives the manual order within the favourites section."""

    __tablename__ = "favourites"
    __table_args__ = (CheckConstraint("position >= 0"),)

    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        primary_key=True,
    )
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    created_at: Mapped[datetime] = created_at()

    page: Mapped[Page] = relationship(back_populates="favourite")
