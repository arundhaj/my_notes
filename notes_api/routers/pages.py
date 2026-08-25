"""CRUD for pages, plus their block list and tag assignments."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from notes_api.crud import apply_updates, commit, get_or_404, reject_self_parent
from notes_api.database import get_session
from notes_api.models import Block, Page, PageTag, Tag
from notes_api.schemas import BlockRead, PageCreate, PageRead, PageUpdate, TagRead

router = APIRouter(prefix="/pages", tags=["pages"])


@router.get("", response_model=list[PageRead])
def list_pages(
    session: Session = Depends(get_session),
    parent_id: UUID | None = None,
    root_only: bool = Query(False, description="Only pages with no parent"),
    is_archived: bool | None = None,
    is_trashed: bool | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = select(Page)
    if root_only:
        stmt = stmt.where(Page.parent_id.is_(None))
    elif parent_id is not None:
        stmt = stmt.where(Page.parent_id == parent_id)
    if is_archived is not None:
        stmt = stmt.where(Page.is_archived == is_archived)
    if is_trashed is not None:
        stmt = stmt.where(Page.is_trashed == is_trashed)
    stmt = stmt.order_by(Page.created_at).limit(limit).offset(offset)
    return session.scalars(stmt).all()


@router.post("", response_model=PageRead, status_code=status.HTTP_201_CREATED)
def create_page(payload: PageCreate, session: Session = Depends(get_session)):
    if payload.parent_id is not None:
        get_or_404(session, Page, payload.parent_id)
    page = Page(**payload.model_dump())
    session.add(page)
    commit(session)
    return page


@router.get("/{page_id}", response_model=PageRead)
def get_page(page_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, Page, page_id)


@router.patch("/{page_id}", response_model=PageRead)
def update_page(
    page_id: UUID, payload: PageUpdate, session: Session = Depends(get_session)
):
    page = get_or_404(session, Page, page_id)
    changes = payload.model_dump(exclude_unset=True)
    if "parent_id" in changes and changes["parent_id"] is not None:
        reject_self_parent(page_id, changes["parent_id"])
        get_or_404(session, Page, changes["parent_id"])
    apply_updates(page, changes)
    commit(session)
    return page


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: UUID, session: Session = Depends(get_session)):
    """Hard delete. Child pages, blocks, tags, favourite and visits cascade.

    To keep a page but hide it, PATCH is_trashed instead.
    """
    session.delete(get_or_404(session, Page, page_id))
    commit(session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{page_id}/blocks", response_model=list[BlockRead])
def list_page_blocks(
    page_id: UUID,
    session: Session = Depends(get_session),
    top_level_only: bool = Query(
        True, description="Exclude blocks nested inside another block"
    ),
):
    get_or_404(session, Page, page_id)
    stmt = select(Block).where(Block.page_id == page_id)
    if top_level_only:
        stmt = stmt.where(Block.parent_block_id.is_(None))
    return session.scalars(stmt.order_by(Block.position)).all()


@router.get("/{page_id}/tags", response_model=list[TagRead])
def list_page_tags(page_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, Page, page_id).tags


@router.put("/{page_id}/tags/{tag_id}", response_model=list[TagRead])
def add_page_tag(
    page_id: UUID, tag_id: UUID, session: Session = Depends(get_session)
):
    """Idempotent: tagging an already-tagged page is a no-op."""
    page = get_or_404(session, Page, page_id)
    get_or_404(session, Tag, tag_id)
    if session.get(PageTag, (page_id, tag_id)) is None:
        session.add(PageTag(page_id=page_id, tag_id=tag_id))
        commit(session)
    session.refresh(page)
    return page.tags


@router.delete(
    "/{page_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_page_tag(
    page_id: UUID, tag_id: UUID, session: Session = Depends(get_session)
):
    session.delete(get_or_404(session, PageTag, (page_id, tag_id)))
    commit(session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
