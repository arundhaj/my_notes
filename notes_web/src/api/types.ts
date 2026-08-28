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
