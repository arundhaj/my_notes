import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, List, Typography } from '@mui/material'
import { listRootPages } from '../api/pages'
import type { Page } from '../api/types'
import PageTreeItem from './PageTreeItem'

interface PageTreeProps {
  onSelectPage: (page: Page) => void
}

/**
 * The full page tree: root pages (parent_id is null) fetched on mount, each
 * expandable downward on demand -- clicking a row's chevron fetches and
 * inserts that page's children (see PageTreeItem), so nothing below the
 * root level is fetched until it is asked for.
 *
 * Self-scrollable: this component owns `overflowY: auto` on its own root, so
 * a caller can drop it into a fixed-height flex column and it will scroll
 * independently of everything else on the page.
 */
export default function PageTree({ onSelectPage }: PageTreeProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    listRootPages(controller.signal)
      .then((rootPages) => {
        setPages(rootPages)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken])

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

      {!loading && !error && pages.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No pages yet. Create one with <code>POST /pages</code>.
        </Typography>
      )}

      {!loading && !error && pages.length > 0 && (
        <List dense disablePadding>
          {pages.map((page) => (
            <PageTreeItem
              key={page.id}
              page={page}
              depth={0}
              onSelectPage={onSelectPage}
            />
          ))}
        </List>
      )}
    </Box>
  )
}
