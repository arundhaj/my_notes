"""Request/response shapes for attachments."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AttachmentCreate(BaseModel):
    block_id: UUID
    file_name: str = Field(min_length=1)
    storage_url: str = Field(min_length=1)
    mime_type: str | None = None
    size_bytes: int | None = Field(default=None, ge=0)


class AttachmentUpdate(BaseModel):
    file_name: str | None = Field(default=None, min_length=1)
    storage_url: str | None = Field(default=None, min_length=1)
    mime_type: str | None = None
    size_bytes: int | None = Field(default=None, ge=0)


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    block_id: UUID
    file_name: str
    storage_url: str
    mime_type: str | None
    size_bytes: int | None
    created_at: datetime
