"""CRUD for blocks, plus their children and attachments."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from notes_api.crud import apply_updates, commit, get_or_404, reject_self_parent
from notes_api.database import get_session
from notes_api.models import Attachment, Block, Page
from notes_api.schemas import AttachmentRead, BlockCreate, BlockRead, BlockUpdate

router = APIRouter(prefix="/blocks", tags=["blocks"])


def _next_position(
    session: Session, page_id: UUID, parent_block_id: UUID | None
) -> int:
    """One past the last sibling under the same parent."""
    stmt = select(func.coalesce(func.max(Block.position) + 1, 0)).where(
        Block.page_id == page_id
    )
    stmt = (
        stmt.where(Block.parent_block_id.is_(None))
        if parent_block_id is None
        else stmt.where(Block.parent_block_id == parent_block_id)
    )
    return session.scalar(stmt)


@router.post("", response_model=BlockRead, status_code=status.HTTP_201_CREATED)
def create_block(payload: BlockCreate, session: Session = Depends(get_session)):
    get_or_404(session, Page, payload.page_id)
    if payload.parent_block_id is not None:
        parent = get_or_404(session, Block, payload.parent_block_id)
        if parent.page_id != payload.page_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="parent block belongs to a different page",
            )

    values = payload.model_dump()
    if values["position"] is None:
        values["position"] = _next_position(
            session, payload.page_id, payload.parent_block_id
        )
    block = Block(**values)
    session.add(block)
    commit(session)
    return block


@router.get("/{block_id}", response_model=BlockRead)
def get_block(block_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, Block, block_id)


@router.patch("/{block_id}", response_model=BlockRead)
def update_block(
    block_id: UUID, payload: BlockUpdate, session: Session = Depends(get_session)
):
    block = get_or_404(session, Block, block_id)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("parent_block_id") is not None:
        reject_self_parent(block_id, changes["parent_block_id"])
        parent = get_or_404(session, Block, changes["parent_block_id"])
        if parent.page_id != block.page_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="parent block belongs to a different page",
            )
    apply_updates(block, changes)
    commit(session)
    return block


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(block_id: UUID, session: Session = Depends(get_session)):
    """Nested blocks and attachments cascade."""
    session.delete(get_or_404(session, Block, block_id))
    commit(session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{block_id}/children", response_model=list[BlockRead])
def list_block_children(block_id: UUID, session: Session = Depends(get_session)):
    get_or_404(session, Block, block_id)
    stmt = (
        select(Block)
        .where(Block.parent_block_id == block_id)
        .order_by(Block.position)
    )
    return session.scalars(stmt).all()


@router.get("/{block_id}/attachments", response_model=list[AttachmentRead])
def list_block_attachments(
    block_id: UUID, session: Session = Depends(get_session)
):
    get_or_404(session, Block, block_id)
    stmt = (
        select(Attachment)
        .where(Attachment.block_id == block_id)
        .order_by(Attachment.created_at)
    )
    return session.scalars(stmt).all()
