"""Request/response shapes for favourites."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FavouriteUpsert(BaseModel):
    # Omitted: appended after the last favourite.
    position: int | None = Field(default=None, ge=0)


class FavouriteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page_id: UUID
    position: int
    created_at: datetime
