"""The favourites section of the sidebar: one row per pinned page."""

from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from notes_api.crud import commit, get_or_404
from notes_api.database import get_session
from notes_api.models import Favourite, Page
from notes_api.schemas import FavouriteRead, FavouriteUpsert, PageRead

router = APIRouter(prefix="/favourites", tags=["favourites"])


@router.get("", response_model=list[FavouriteRead])
def list_favourites(session: Session = Depends(get_session)):
    stmt = select(Favourite).order_by(Favourite.position)
    return session.scalars(stmt).all()


@router.get("/pages", response_model=list[PageRead])
def list_favourite_pages(session: Session = Depends(get_session)):
    """The favourited pages themselves, in sidebar order."""
    stmt = (
        select(Page)
        .join(Favourite, Favourite.page_id == Page.id)
        .order_by(Favourite.position)
    )
    return session.scalars(stmt).all()


@router.put("/{page_id}", response_model=FavouriteRead)
def upsert_favourite(
    page_id: UUID,
    payload: FavouriteUpsert | None = None,
    session: Session = Depends(get_session),
):
    """Pin a page, or move an already-pinned one. Idempotent."""
    get_or_404(session, Page, page_id)
    position = payload.position if payload else None

    favourite = session.get(Favourite, page_id)
    if favourite is None:
        if position is None:
            position = session.scalar(
                select(func.coalesce(func.max(Favourite.position) + 1, 0))
            )
        favourite = Favourite(page_id=page_id, position=position)
        session.add(favourite)
    elif position is not None:
        favourite.position = position

    commit(session)
    return favourite


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favourite(page_id: UUID, session: Session = Depends(get_session)):
    """Unpin. The page itself is untouched."""
    session.delete(get_or_404(session, Favourite, page_id))
    commit(session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
