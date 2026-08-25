"""SQLAlchemy models mirroring schema.sql, one module per table.

Importing this package registers every model on `Base.metadata`, which is what
Alembic autogenerate compares against the database.
"""

from .attachment import Attachment
from .base import Base
from .block import Block, BlockType, block_type_enum
from .favourite import Favourite
from .page import Page
from .page_tag import PageTag
from .page_visit import PageVisit
from .tag import Tag

__all__ = [
    "Attachment",
    "Base",
    "Block",
    "BlockType",
    "Favourite",
    "Page",
    "PageTag",
    "PageVisit",
    "Tag",
    "block_type_enum",
]
