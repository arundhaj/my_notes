import { getJson, patchJson } from './client'
import type { Page } from './types'

/**
 * Root pages -- those with no parent.
 *
 * The API takes `root_only=true` rather than `parent_id=null`: `parent_id` is
 * typed as a UUID, so the literal string "null" fails validation with a 422.
 */
export function listRootPages(signal?: AbortSignal): Promise<Page[]> {
  return getJson<Page[]>('/pages?root_only=true', signal)
}

/** A page's direct children -- the pages nested inside it. */
export function listChildPages(
  parentId: string,
  signal?: AbortSignal,
): Promise<Page[]> {
  return getJson<Page[]>(`/pages?parent_id=${encodeURIComponent(parentId)}`, signal)
}

/** Partial update -- only the fields passed in `changes` are touched. */
export function updatePage(
  pageId: string,
  changes: Partial<Pick<Page, 'title'>>,
  signal?: AbortSignal,
): Promise<Page> {
  return patchJson<Page>(`/pages/${encodeURIComponent(pageId)}`, changes, signal)
}
