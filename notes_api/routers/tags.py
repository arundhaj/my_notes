"""CRUD for tags."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from notes_api.crud import apply_updates, commit, get_or_404
from notes_api.database import get_session
from notes_api.models import Tag
from notes_api.schemas import PageRead, TagCreate, TagRead, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
def list_tags(
    session: Session = Depends(get_session),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = select(Tag).order_by(Tag.name).limit(limit).offset(offset)
    return session.scalars(stmt).all()


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, session: Session = Depends(get_session)):
    """Names are unique; a duplicate returns 409."""
    tag = Tag(**payload.model_dump())
    session.add(tag)
    commit(session)
    return tag


@router.get("/{tag_id}", response_model=TagRead)
def get_tag(tag_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, Tag, tag_id)


@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: UUID, payload: TagUpdate, session: Session = Depends(get_session)
):
    tag = get_or_404(session, Tag, tag_id)
    apply_updates(tag, payload.model_dump(exclude_unset=True))
    commit(session)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: UUID, session: Session = Depends(get_session)):
    """Removes the tag from every page that carries it."""
    session.delete(get_or_404(session, Tag, tag_id))
    commit(session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{tag_id}/pages", response_model=list[PageRead])
def list_tag_pages(tag_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, Tag, tag_id).pages
