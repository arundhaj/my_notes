import type { BlockType as ApiBlockType } from '../api/types'

/** Every basic block the editor can render. */
export const BASIC_BLOCK_TYPES = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'paragraph',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'quote',
  'table',
  'divider',
  'spacer',
  'page_link',
] as const

export type BasicBlockType = (typeof BASIC_BLOCK_TYPES)[number]

/**
 * Loose bag matching the JSONB `content` column: which keys are meaningful
 * depends on the block type. Text blocks use `text`, to_do adds `checked`,
 * and so on.
 */
export interface BasicBlockContent {
  text?: string
  checked?: boolean
  rows?: string[][]
  height?: number
  pageId?: string | null
  /** The column is free-form JSONB: keys this editor does not know about
   * (a code block's `language`, say) ride along untouched instead of being
   * stripped on save. */
  [key: string]: unknown
}

/**
 * How each renderable type maps onto the persisted `block_type` enum
 * (see notes_api/models/block.py).
 *
 * `null` means the schema has no enum value for it: h4/h5/h6 stop at
 * heading_3, and there is no table, spacer or page-link member -- the table
 * omission is deliberate per the schema's "pages and blocks only" rule.
 * These render fine but cannot be saved without a migration adding the enum
 * values, so check this before POSTing a block.
 */
export const API_BLOCK_TYPE: Record<BasicBlockType, ApiBlockType | null> = {
  h1: 'heading_1',
  h2: 'heading_2',
  h3: 'heading_3',
  h4: null,
  h5: null,
  h6: null,
  paragraph: 'paragraph',
  bulleted_list_item: 'bulleted_list_item',
  numbered_list_item: 'numbered_list_item',
  to_do: 'to_do',
  quote: 'quote',
  table: null,
  divider: 'divider',
  spacer: null,
  page_link: null,
}

/** True if a block of this type can currently be persisted by the API. */
export function isPersistable(type: BasicBlockType): boolean {
  return API_BLOCK_TYPE[type] !== null
}

/** Toolbar labels. */
export const BLOCK_LABEL: Record<BasicBlockType, string> = {
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  h6: 'H6',
  paragraph: 'Text',
  bulleted_list_item: 'Bulleted list',
  numbered_list_item: 'Numbered list',
  to_do: 'To-do',
  quote: 'Quote',
  table: 'Table',
  divider: 'Divider',
  spacer: 'Empty space',
  page_link: 'Link to page',
}

/** The `content` a freshly added block of this type starts with. */
export function defaultContentFor(type: BasicBlockType): BasicBlockContent {
  switch (type) {
    case 'table':
      return { rows: [['', ''], ['', '']] }
    case 'to_do':
      return { text: '', checked: false }
    case 'spacer':
      return { height: 24 }
    case 'page_link':
      return { text: '', pageId: null }
    case 'divider':
      return {}
    default:
      return { text: '' }
  }
}

/**
 * Reverse of API_BLOCK_TYPE, for rendering blocks loaded from the API.
 *
 * Falls back to 'paragraph' for enum members this editor has no renderer for
 * (toggle, callout, code, image, bookmark, equation) so an unfamiliar block
 * still shows its text instead of vanishing.
 */
export function fromApiBlockType(apiType: string): BasicBlockType {
  const match = BASIC_BLOCK_TYPES.find((type) => API_BLOCK_TYPE[type] === apiType)
  return match ?? 'paragraph'
}
