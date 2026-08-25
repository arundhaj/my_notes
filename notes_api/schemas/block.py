"""Request/response shapes for blocks."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from notes_api.models.block import BlockType


class BlockCreate(BaseModel):
    page_id: UUID
    type: BlockType
    content: dict[str, Any] = Field(default_factory=dict)
    parent_block_id: UUID | None = None
    # Omitted: appended after the last sibling under the same parent.
    position: int | None = Field(default=None, ge=0)


class BlockUpdate(BaseModel):
    type: BlockType | None = None
    content: dict[str, Any] | None = None
    parent_block_id: UUID | None = None
    position: int | None = Field(default=None, ge=0)


class BlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_id: UUID
    parent_block_id: UUID | None
    type: BlockType
    content: dict[str, Any]
    position: int
    created_at: datetime
    updated_at: datetime
