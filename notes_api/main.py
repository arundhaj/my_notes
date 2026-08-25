from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from notes_api.database import get_session
from notes_api.models import Page
from notes_api.routers import (
    attachments,
    blocks,
    favourites,
    page_visits,
    pages,
    tags,
)

app = FastAPI(title="Notes API")

app.include_router(pages.router)
app.include_router(blocks.router)
app.include_router(tags.router)
app.include_router(attachments.router)
app.include_router(favourites.router)
app.include_router(page_visits.router)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
def health(session: Session = Depends(get_session)):
    """Report whether Postgres is reachable, with the current page count."""
    try:
        pages_count = session.scalar(select(func.count()).select_from(Page))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail=f"database unavailable: {exc}")
    return {"status": "ok", "pages": pages_count}
