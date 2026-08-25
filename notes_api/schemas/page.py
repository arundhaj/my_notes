"""Request/response shapes for pages."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PageCreate(BaseModel):
    title: str = ""
    icon: str | None = None
    cover_url: str | None = None
    parent_id: UUID | None = None
    is_archived: bool = False
    is_trashed: bool = False


class PageUpdate(BaseModel):
    """Every field optional: omitted means unchanged, null means clear."""

    title: str | None = None
    icon: str | None = None
    cover_url: str | None = None
    parent_id: UUID | None = None
    is_archived: bool | None = None
    is_trashed: bool | None = None


class PageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    parent_id: UUID | None
    title: str
    icon: str | None
    cover_url: str | None
    is_archived: bool
    is_trashed: bool
    created_at: datetime
    updated_at: datetime
