"""The visit log: record page opens, read back the recently-visited list.

The log is append-only, so there is no update endpoint.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from notes_api.crud import commit, get_or_404
from notes_api.database import get_session
from notes_api.models import Page, PageVisit
from notes_api.schemas import PageVisitRead, RecentPageRead

router = APIRouter(tags=["visits"])


@router.post(
    "/pages/{page_id}/visits",
    response_model=PageVisitRead,
    status_code=status.HTTP_201_CREATED,
)
def record_visit(page_id: UUID, session: Session = Depends(get_session)):
    get_or_404(session, Page, page_id)
    visit = PageVisit(page_id=page_id)
    session.add(visit)
    commit(session)
    return visit


@router.get("/pages/{page_id}/visits", response_model=list[PageVisitRead])
def list_page_visits(
    page_id: UUID,
    session: Session = Depends(get_session),
    limit: int = Query(50, ge=1, le=500),
):
    get_or_404(session, Page, page_id)
    stmt = (
        select(PageVisit)
        .where(PageVisit.page_id == page_id)
        .order_by(PageVisit.visited_at.desc())
        .limit(limit)
    )
    return session.scalars(stmt).all()


@router.get("/recent", response_model=list[RecentPageRead])
def list_recent_pages(
    session: Session = Depends(get_session),
    limit: int = Query(10, ge=1, le=100),
    include_trashed: bool = False,
):
    """Distinct pages by most recent visit."""
    last_visited = func.max(PageVisit.visited_at).label("last_visited_at")
    stmt = (
        select(Page, last_visited)
        .join(PageVisit, PageVisit.page_id == Page.id)
        .group_by(Page.id)
        .order_by(last_visited.desc())
        .limit(limit)
    )
    if not include_trashed:
        stmt = stmt.where(Page.is_trashed.is_(False))
    return [
        RecentPageRead(page=page, last_visited_at=visited_at)
        for page, visited_at in session.execute(stmt)
    ]
