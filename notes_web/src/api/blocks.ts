import { getJson, patchJson, postJson } from './client'
import type { Block, BlockType } from './types'

/** A page's top-level blocks, in `position` order. */
export function listPageBlocks(
  pageId: string,
  signal?: AbortSignal,
): Promise<Block[]> {
  return getJson<Block[]>(`/pages/${encodeURIComponent(pageId)}/blocks`, signal)
}

/**
 * Append a block to the end of a page.
 *
 * `position` is deliberately omitted: the API fills it with one past the last
 * sibling, so concurrent appends can't collide on a stale index.
 */
export function createBlock(
  pageId: string,
  type: BlockType,
  content: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Block> {
  return postJson<Block>('/blocks', { page_id: pageId, type, content }, signal)
}

/** Partial update -- here, only the JSONB content payload. */
export function updateBlock(
  blockId: string,
  content: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Block> {
  return patchJson<Block>(
    `/blocks/${encodeURIComponent(blockId)}`,
    { content },
    signal,
  )
}
