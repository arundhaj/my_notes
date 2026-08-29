import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, List, Typography } from '@mui/material'
import { listRootPages } from '../api/pages'
import { usePageStore } from '../state/pageStore'
import PageTreeItem from './PageTreeItem'

interface PageTreeProps {
  onSelectPage: (pageId: string) => void
}

/**
 * The full page tree: root pages (parent_id is null) fetched on mount, each
 * expandable downward on demand -- clicking a row's chevron fetches and
 * inserts that page's children (see PageTreeItem), so nothing below the
 * root level is fetched until it is asked for.
 *
 * This component and PageTreeItem only track *which* ids belong where --
 * ordering and tree shape. The pages themselves live in the shared
 * PageStoreProvider, keyed by id, so a row here and the right panel showing
 * the same page are reading the exact same object; editing it anywhere
 * updates every place it's rendered.
 *
 * Self-scrollable: this component owns `overflowY: auto` on its own root, so
 * a caller can drop it into a fixed-height flex column and it will scroll
 * independently of everything else on the page.
 */
export default function PageTree({ onSelectPage }: PageTreeProps) {
  const { upsertPages } = usePageStore()
  const [rootIds, setRootIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    listRootPages(controller.signal)
      .then((rootPages) => {
        upsertPages(rootPages)
        setRootIds(rootPages.map((page) => page.id))
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken, upsertPages])

  const handleRetry = useCallback(() => setReloadToken((token) => token + 1), [])

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading pages…
          </Typography>
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ m: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && !error && rootIds.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No pages yet. Create one with <code>POST /pages</code>.
        </Typography>
      )}

      {!loading && !error && rootIds.length > 0 && (
        <List dense disablePadding>
          {rootIds.map((id) => (
            <PageTreeItem
              key={id}
              pageId={id}
              depth={0}
              onSelectPage={onSelectPage}
            />
          ))}
        </List>
      )}
    </Box>
  )
}
