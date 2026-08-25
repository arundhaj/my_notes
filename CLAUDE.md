# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Notion-like note-taking app for a single user (personal/local use). `schema.sql` is the
Postgres data model; `notes_api/` is a FastAPI app over it (SQLAlchemy models, an Alembic
migration, and a session dependency — but only `/` and `/health` routes so far).
`README.md` is empty.

## Commands

A virtualenv lives at `venv/` (Python 3.14) with the API dependencies already installed.

```bash
source venv/bin/activate
pip install -r notes_api/requirements.txt   # after adding a dependency
uvicorn notes_api.main:app --reload         # http://127.0.0.1:8000, docs at /docs

# Alembic config lives in notes_api/, so every command needs -c from the repo root:
alembic -c notes_api/alembic.ini upgrade head
alembic -c notes_api/alembic.ini upgrade head --sql        # print DDL, no database needed
alembic -c notes_api/alembic.ini revision --autogenerate -m "message"
```

`DATABASE_URL` (see `.env.example`, loaded from `.env`) configures both the app and Alembic;
`migrations/env.py` imports it from `notes_api/database.py` rather than reading `alembic.ini`.
There is no test suite or linter yet — pick one with the user rather than assuming.

## Data model

Three places describe the same tables and must be changed together: `schema.sql` (the
readable reference, applied top to bottom on a fresh database), `notes_api/models/` (one
module per table, re-exported from `models/__init__.py`), and the Alembic revision in
`notes_api/migrations/versions/`. The domain:

- **pages** — self-referencing `parent_id` gives the sidebar tree; `NULL` means a root page.
- **blocks** — the content units. Each block belongs to a page (`page_id`) *and* may nest
  inside another block (`parent_block_id`, e.g. list items and toggles), so a nested block
  carries both. `position` orders siblings within the same parent; `content` is JSONB
  holding the type-specific payload (rich text, checked state, code language).
- **tags** + **page_tags** join table, **attachments** (files hung off a block),
  **favourites** (one row per page, `page_id` is the PK), **page_visits** (append-only
  log; "recently visited" is a `MAX(visited_at)` query).

Constraints the schema deliberately holds to — keep them when editing:

- No users/auth/permissions/multi-tenancy tables.
- Pages and blocks only. The `block_type` enum has no `database` value and there is no
  table/board/gallery view concept.
- No indexes, triggers, functions, views, stored procedures, RLS, or extensions.
- `updated_at` is set by the application, never by a trigger.
- UUID PKs via `DEFAULT gen_random_uuid()` (built in since PG 13, so no extension),
  `timestamptz` timestamps defaulting to `now()`.
- Every table carries a short comment above it explaining its purpose.
