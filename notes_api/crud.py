"""Helpers the routers share: lookups, partial updates, constraint mapping."""

from typing import Any, TypeVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from notes_api.models import Base

ModelT = TypeVar("ModelT", bound=Base)


def get_or_404(session: Session, model: type[ModelT], pk: Any) -> ModelT:
    """Fetch by primary key or raise 404 naming the resource."""
    obj = session.get(model, pk)
    if obj is None:
        name = model.__name__.lower()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} {pk} not found"
        )
    return obj


def apply_updates(obj: ModelT, changes: dict[str, Any]) -> ModelT:
    """Apply a PATCH body. Callers pass model_dump(exclude_unset=True), so an
    omitted field is left alone while an explicit null clears the column."""
    for field, value in changes.items():
        setattr(obj, field, value)
    return obj


def commit(session: Session) -> None:
    """Commit, translating constraint violations into 4xx responses.

    The schema's foreign keys, unique constraint on tags.name, and CHECKs
    (position >= 0, a row cannot be its own parent) all surface here.
    """
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc.orig).strip(),
        ) from exc


def reject_self_parent(child_id: UUID | None, parent_id: UUID | None) -> None:
    """Guard the `x IS NULL OR x <> id` CHECKs with a clearer error."""
    if child_id is not None and parent_id == child_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="a row cannot be its own parent",
        )
