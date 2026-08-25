"""Request/response shapes for tags."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TagCreate(BaseModel):
    # min_length mirrors the CHECK (length(name) > 0) in the schema.
    name: str = Field(min_length=1)
    color: str | None = None


class TagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    color: str | None = None


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    color: str | None
    created_at: datetime
