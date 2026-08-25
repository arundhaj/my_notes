-- Schema for a Notion-like note-taking app (single user, local use).
-- PostgreSQL 15+. Runs top to bottom on a fresh database.

-- The kinds of content a block can hold. Pages and blocks only: there is
-- deliberately no database/table/board/gallery block type.
CREATE TYPE block_type AS ENUM (
    'paragraph',
    'heading_1',
    'heading_2',
    'heading_3',
    'bulleted_list_item',
    'numbered_list_item',
    'to_do',
    'toggle',
    'quote',
    'callout',
    'code',
    'divider',
    'image',
    'bookmark',
    'equation'
);

-- Pages are the top-level documents. A page may nest under another page,
-- forming the sidebar hierarchy; a NULL parent_id means a root-level page.
CREATE TABLE pages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   uuid REFERENCES pages (id) ON DELETE CASCADE,
    title       text        NOT NULL DEFAULT '',
    icon        text,
    cover_url   text,
    is_archived boolean     NOT NULL DEFAULT false,
    is_trashed  boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CHECK (parent_id IS NULL OR parent_id <> id)
);

-- Blocks are the content units inside a page. Every block belongs to exactly
-- one page. A block may also nest inside another block (list items, toggles,
-- callouts); parent_block_id NULL means the block sits directly on the page.
-- `position` orders siblings within the same parent, and `content` holds the
-- type-specific payload (rich text, checked state, code language, ...).
CREATE TABLE blocks (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id         uuid        NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    parent_block_id uuid REFERENCES blocks (id) ON DELETE CASCADE,
    type            block_type  NOT NULL,
    content         jsonb       NOT NULL DEFAULT '{}'::jsonb,
    position        integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CHECK (parent_block_id IS NULL OR parent_block_id <> id),
    CHECK (position >= 0)
);

-- Tags used to label pages. Names are unique across the workspace.
CREATE TABLE tags (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text        NOT NULL UNIQUE,
    color      text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (length(name) > 0)
);

-- Join table giving pages their tags (many-to-many).
CREATE TABLE page_tags (
    page_id    uuid        NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    tag_id     uuid        NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (page_id, tag_id)
);

-- Files uploaded into the app (images, PDFs, bookmark previews). Each file is
-- attached to the block that renders or links to it.
CREATE TABLE attachments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id    uuid        NOT NULL REFERENCES blocks (id) ON DELETE CASCADE,
    file_name   text        NOT NULL,
    storage_url text        NOT NULL,
    mime_type   text,
    size_bytes  bigint,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CHECK (size_bytes IS NULL OR size_bytes >= 0)
);

-- Pages pinned to the favourites section of the sidebar. One row per page,
-- with `position` giving the manual order within the section.
CREATE TABLE favourites (
    page_id    uuid PRIMARY KEY REFERENCES pages (id) ON DELETE CASCADE,
    position   integer     NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (position >= 0)
);

-- Append-only log of page opens, used to build the "recently visited" list.
CREATE TABLE page_visits (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id    uuid        NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    visited_at timestamptz NOT NULL DEFAULT now()
);
