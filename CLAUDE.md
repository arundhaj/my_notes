# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Notion-like note-taking app for a single user (personal/local use), in two halves:

- `schema.sql` + `notes_api/` — the Postgres data model and a FastAPI app over it
  (SQLAlchemy models, an Alembic migration, and CRUD routers for every table).
- `notes_web/` — a Vite + React + TypeScript frontend using MUI: a two-panel shell whose
  left panel lists root pages from the API.

The frontend talks to the API through a dev proxy: `vite.config.ts` maps `/api` to
`http://127.0.0.1:8000` and strips the prefix, so the browser stays on one origin and
`notes_api` needs **no CORS middleware**. Run both servers together during development. A
production deployment serves the built assets from somewhere else and will need its own
answer — either the same reverse-proxy arrangement or CORS. `README.md` is empty.

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
```

The UI framework is **MUI** (Material UI v9) with the default Emotion styling engine. The app
was scaffolded on Mantine and migrated on 2026-08-26; there is no PostCSS config any more, and
nothing should reintroduce one.

`src/main.tsx` wraps `<App />` in `<ThemeProvider>` and renders `<CssBaseline />` — that pair is
what applies the theme's typography and background, so keep both when editing the root. 

The Vite boilerplate (`index.css`, `App.css`, `src/assets/`, `public/icons.svg`) was deleted
rather than kept — the template's `index.css` flex-centers `body` and sets its own dark-mode
colors, which fight the MUI theme. Don't reintroduce it.

### Layout

`src/App.tsx` is the app shell: a fixed top bar over a flex row holding a collapsible left
panel and the main content, each scrolling independently. Three rules keep that working —
the shell is `height: 100dvh` with `overflow: hidden`, the flex row carries `minHeight: 0`
(without it the row grows past the viewport and the page scrolls as a whole instead of the
panels), and each panel sets its own `overflowY: auto`.

Below the `md` breakpoint the left panel becomes a temporary `Drawer` overlay; at `md` and up
it animates between `LEFT_PANEL_WIDTH` and `0`. `LeftPanel` fixes its own inner width so the
content does not reflow mid-animation.

`src/api/` wraps fetch: `client.ts` unwraps FastAPI's `detail` field into thrown `Error`s,
`pages.ts` holds the calls, `types.ts` mirrors the Pydantic response schemas by hand — they
are not generated, so keep them in step with `notes_api/schemas/`.

**Root pages are fetched with `GET /pages?root_only=true`, not `parent_id=null`** —
`parent_id` is typed as a UUID, so the literal string `null` fails validation with a 422.

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
