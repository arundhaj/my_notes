"""Request/response shapes for the visit log."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from notes_api.schemas.page import PageRead


class PageVisitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_id: UUID
    visited_at: datetime


class RecentPageRead(BaseModel):
    """A page plus when it was last opened, for the recently-visited list."""

    page: PageRead
    last_visited_at: datetime
