import { getJson } from './client'
import type { Page } from './types'

/**
 * Spaces -- root pages, i.e. those with no parent.
 *
 * The API takes `root_only=true` rather than `parent_id=null`: `parent_id` is
 * typed as a UUID, so the literal string "null" fails validation with a 422.
 */
export function listSpaces(signal?: AbortSignal): Promise<Page[]> {
  return getJson<Page[]>('/pages?root_only=true', signal)
}
