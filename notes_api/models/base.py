"""Declarative base and the column shapes every table repeats."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def uuid_pk() -> Mapped[uuid.UUID]:
    """`id uuid PRIMARY KEY DEFAULT gen_random_uuid()`."""
    return mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )


def created_at() -> Mapped[datetime]:
    """`created_at timestamptz NOT NULL DEFAULT now()`."""
    return mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


def updated_at() -> Mapped[datetime]:
    """`updated_at timestamptz NOT NULL DEFAULT now()`.

    `onupdate` makes SQLAlchemy put now() in the UPDATE statement it sends, so
    the timestamp stays application-set -- the schema has no triggers.
    """
    return mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
