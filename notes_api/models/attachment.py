"""Attachments: files referenced by a block."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, created_at, uuid_pk

if TYPE_CHECKING:
    from .block import Block


class Attachment(Base):
    """A file (image, PDF, bookmark preview) hung off the block that shows it."""

    __tablename__ = "attachments"
    __table_args__ = (CheckConstraint("size_bytes IS NULL OR size_bytes >= 0"),)

    id: Mapped[uuid.UUID] = uuid_pk()
    block_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(Text, nullable=False)
    storage_url: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(Text)
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = created_at()

    block: Mapped[Block] = relationship(back_populates="attachments")
