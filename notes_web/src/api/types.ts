/** Mirrors PageRead in notes_api/schemas/page.py. */
export interface Page {
  id: string
  parent_id: string | null
  title: string
  icon: string | null
  cover_url: string | null
  is_archived: boolean
  is_trashed: boolean
  created_at: string
  updated_at: string
}

/** Mirrors the block_type enum in notes_api/models/block.py. */
export type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'image'
  | 'bookmark'
  | 'equation'

/** Mirrors BlockRead in notes_api/schemas/block.py. */
export interface Block {
  id: string
  page_id: string
  parent_block_id: string | null
  type: BlockType
  content: Record<string, unknown>
  position: number
  created_at: string
  updated_at: string
}
