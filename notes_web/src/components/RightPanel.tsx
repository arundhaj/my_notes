import { useCallback, useEffect, useState } from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { updatePage } from '../api/pages'
import { usePageStore } from '../state/pageStore'
import EditableText from './EditableText'
import PageIcon from './PageIcon'

interface RightPanelProps {
  pageId: string | null
}

/**
 * Reads the selected page straight from the shared PageStoreProvider by id,
 * rather than taking it as a prop -- the same object the tree renders, so
 * a title edit here shows up in the tree with no extra wiring, and a change
 * to the tree's copy (once it can make any) would show up here too.
 */
export default function RightPanel({ pageId }: RightPanelProps) {
  const { pages, upsertPages } = usePageStore()
  const page = pageId ? pages[pageId] : null

  // Gates every EditableText on the page (title today, block content later).
  // Starts locked so switching to a page never leaves it silently editable.
  const [locked, setLocked] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setLocked(true)
    setSaveError(null)
  }, [pageId])

  const handleTitleCommit = useCallback(
    (nextTitle: string) => {
      if (!page) return
      setSaveError(null)
      updatePage(page.id, { title: nextTitle })
        .then((updated) => upsertPages([updated]))
        .catch((err: unknown) => {
          setSaveError(err instanceof Error ? err.message : String(err))
        })
    },
    [page, upsertPages],
  )

  if (!page) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.secondary">
          Select a page from the left panel.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip
          title={locked ? 'Unlock to edit' : 'Lock page'}
          // Keep the popper a few px clear of the viewport edge. Pinned flush
          // against it, sub-pixel rounding tips it over into overflow and
          // starts the scrollbar/reposition oscillation.
          slotProps={{
            popper: {
              popperOptions: {
                modifiers: [{ name: 'preventOverflow', options: { padding: 8 } }],
              },
            },
          }}
        >
          <IconButton
            size="small"
            aria-label={locked ? 'Unlock page' : 'Lock page'}
            aria-pressed={!locked}
            onClick={() => setLocked((value) => !value)}
          >
            {locked ? (
              <LockIcon fontSize="small" />
            ) : (
              <LockOpenIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Typography
        variant="h4"
        component="div"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <PageIcon icon={page.icon} />
        <EditableText
          key={page.id}
          value={page.title}
          editable={!locked}
          onCommit={handleTitleCommit}
          placeholder="Untitled"
          sx={{ flex: 1 }}
        />
      </Typography>

      {saveError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 0.5 }}
        >
          Could not save title: {saveError}
        </Typography>
      )}
    </Box>
  )
}
