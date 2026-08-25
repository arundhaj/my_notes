"""Blocks: the content units inside a page, themselves nestable."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Integer, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, created_at, updated_at, uuid_pk

if TYPE_CHECKING:
    from .attachment import Attachment
    from .page import Page


class BlockType(str, enum.Enum):
    """The `block_type` Postgres enum.

    Pages and blocks only: there is deliberately no database/table/board/
    gallery member here.
    """

    paragraph = "paragraph"
    heading_1 = "heading_1"
    heading_2 = "heading_2"
    heading_3 = "heading_3"
    bulleted_list_item = "bulleted_list_item"
    numbered_list_item = "numbered_list_item"
    to_do = "to_do"
    toggle = "toggle"
    quote = "quote"
    callout = "callout"
    code = "code"
    divider = "divider"
    image = "image"
    bookmark = "bookmark"
    equation = "equation"


# values_callable keeps the member *values* in Postgres, matching schema.sql.
block_type_enum = Enum(
    BlockType,
    name="block_type",
    values_callable=lambda t: [member.value for member in t],
)


class Block(Base):
    """A content unit on a page.

    Always belongs to one page; `parent_block_id` additionally nests it inside
    another block (list items, toggles, callouts), so a nested block carries
    both. `position` orders siblings within the same parent, and `content`
    holds the type-specific payload (rich text, checked state, code language).
    """

    __tablename__ = "blocks"
    __table_args__ = (
        CheckConstraint("parent_block_id IS NULL OR parent_block_id <> id"),
        CheckConstraint("position >= 0"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_block_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blocks.id", ondelete="CASCADE")
    )
    type: Mapped[BlockType] = mapped_column(block_type_enum, nullable=False)
    content: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()

    page: Mapped[Page] = relationship(back_populates="blocks")
    parent: Mapped[Block | None] = relationship(
        back_populates="children", remote_side="Block.id"
    )
    children: Mapped[list[Block]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    attachments: Mapped[list[Attachment]] = relationship(
        back_populates="block", cascade="all, delete-orphan"
    )
