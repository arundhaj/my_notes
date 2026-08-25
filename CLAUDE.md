# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Notion-like note-taking app for a single user (personal/local use), in two halves:

- `schema.sql` + `notes_api/` — the Postgres data model and a FastAPI app over it
  (SQLAlchemy models, an Alembic migration, and CRUD routers for every table).
- `notes_web/` — a Vite + React + TypeScript frontend using MUI, currently a single
  Hello World page.

The two are not wired together yet: the frontend makes no API calls, `vite.config.ts` has no
proxy to the API, and the FastAPI app has no CORS middleware. All three are needed before the
UI can read real data. `README.md` is empty.

## Backend commands

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
There is no Python test suite or linter yet — pick one with the user rather than assuming.

## Frontend commands

```bash
cd notes_web
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # oxlint, shipped with the Vite template
```

The UI framework is **MUI** (Material UI v9) with the default Emotion styling engine. The app
was scaffolded on Mantine and migrated on 2026-08-26; there is no PostCSS config any more, and
nothing should reintroduce one.

`src/main.tsx` wraps `<App />` in `<ThemeProvider>` and renders `<CssBaseline />` — that pair is
what applies the theme's typography and background, so keep both when editing the root. Roboto
is self-hosted via `@fontsource/roboto` because MUI's default `fontFamily` asks for it; drop
those four imports and text silently falls back to Helvetica/Arial.

The Vite boilerplate (`index.css`, `App.css`, `src/assets/`, `public/icons.svg`) was deleted
rather than kept — the template's `index.css` flex-centers `body` and sets its own dark-mode
colors, which fight the MUI theme. Don't reintroduce it.

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
