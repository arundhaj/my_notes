"""Pydantic request/response models, one module per resource."""

from .attachment import AttachmentCreate, AttachmentRead, AttachmentUpdate
from .block import BlockCreate, BlockRead, BlockUpdate
from .favourite import FavouriteRead, FavouriteUpsert
from .page import PageCreate, PageRead, PageUpdate
from .page_visit import PageVisitRead, RecentPageRead
from .tag import TagCreate, TagRead, TagUpdate

__all__ = [
    "AttachmentCreate",
    "AttachmentRead",
    "AttachmentUpdate",
    "BlockCreate",
    "BlockRead",
    "BlockUpdate",
    "FavouriteRead",
    "FavouriteUpsert",
    "PageCreate",
    "PageRead",
    "PageUpdate",
    "PageVisitRead",
    "RecentPageRead",
    "TagCreate",
    "TagRead",
    "TagUpdate",
]
