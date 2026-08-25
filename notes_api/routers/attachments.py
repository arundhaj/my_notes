"""CRUD for file attachments.

These rows only record where a file lives; uploading the bytes is out of scope.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from notes_api.crud import apply_updates, commit, get_or_404
from notes_api.database import get_session
from notes_api.models import Attachment, Block
from notes_api.schemas import AttachmentCreate, AttachmentRead, AttachmentUpdate

router = APIRouter(prefix="/attachments", tags=["attachments"])


@router.post(
    "", response_model=AttachmentRead, status_code=status.HTTP_201_CREATED
)
def create_attachment(
    payload: AttachmentCreate, session: Session = Depends(get_session)
):
    get_or_404(session, Block, payload.block_id)
    attachment = Attachment(**payload.model_dump())
    session.add(attachment)
    commit(session)
    return attachment


@router.get("/{attachment_id}", response_model=AttachmentRead)
def get_attachment(
    attachment_id: UUID, session: Session = Depends(get_session)
):
    return get_or_404(session, Attachment, attachment_id)


@router.patch("/{attachment_id}", response_model=AttachmentRead)
def update_attachment(
    attachment_id: UUID,
    payload: AttachmentUpdate,
    session: Session = Depends(get_session),
):
    attachment = get_or_404(session, Attachment, attachment_id)
    apply_updates(attachment, payload.model_dump(exclude_unset=True))
    commit(session)
    return attachment


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: UUID, session: Session = Depends(get_session)
):
    session.delete(get_or_404(session, Attachment, attachment_id))
    commit(session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
