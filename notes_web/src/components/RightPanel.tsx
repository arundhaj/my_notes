import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { createBlock, listPageBlocks, updateBlock } from '../api/blocks'
import { updatePage } from '../api/pages'
import type { Block } from '../api/types'
import { usePageStore } from '../state/pageStore'
import BlockToolbar from './BlockToolbar'
import EditableBasicBlock from './EditableBasicBlock'
import EditableText from './EditableText'
import PageIcon from './PageIcon'
import { API_BLOCK_TYPE, defaultContentFor, fromApiBlockType } from './blockTypes'
import type { BasicBlockContent, BasicBlockType } from './blockTypes'

interface RightPanelProps {
  pageId: string | null
}

/**
 * Reads the selected page straight from the shared PageStoreProvider by id,
 * rather than taking it as a prop -- the same object the tree renders, so
 * a title edit here shows up in the tree with no extra wiring.
 */
export default function RightPanel({ pageId }: RightPanelProps) {
  const { pages, upsertPages } = usePageStore()
  const page = pageId ? pages[pageId] : null

  // Gates every EditableText on the page (title and block content alike).
  // Starts locked so switching to a page never leaves it silently editable.
  const [locked, setLocked] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [blocks, setBlocks] = useState<Block[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)

  useEffect(() => {
    setLocked(true)
    setSaveError(null)
    setBlocks([])

    if (!pageId) return
    const controller = new AbortController()
    setBlocksLoading(true)

    listPageBlocks(pageId, controller.signal)
      .then((loaded) => {
        setBlocks(loaded)
        setBlocksLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setSaveError(err instanceof Error ? err.message : String(err))
        setBlocksLoading(false)
      })

    return () => controller.abort()
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

  const handleAddBlock = useCallback(
    (type: BasicBlockType) => {
      if (!page) return
      const apiType = API_BLOCK_TYPE[type]
      if (!apiType) return // guarded in the toolbar too, but never trust it

      setSaveError(null)
      createBlock(page.id, apiType, defaultContentFor(type))
        // Appended, matching the position the API assigned it.
        .then((created) => setBlocks((prev) => [...prev, created]))
        .catch((err: unknown) => {
          setSaveError(err instanceof Error ? err.message : String(err))
        })
    },
    [page],
  )

  const handleBlockChange = useCallback(
    (block: Block, content: BasicBlockContent) => {
      // Optimistic: the edit is already on screen, so show it immediately and
      // reconcile with the server's copy when the PATCH resolves.
      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? { ...b, content } : b)),
      )
      updateBlock(block.id, content)
        .then((saved) =>
          setBlocks((prev) => prev.map((b) => (b.id === saved.id ? saved : b))),
        )
        .catch((err: unknown) => {
          setSaveError(err instanceof Error ? err.message : String(err))
        })
    },
    [],
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

  // Ordinals restart whenever a non-numbered block interrupts the run.
  let ordinal = 0

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
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
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <Box sx={{ flex: 1, mt: 2 }}>
        {blocksLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Loading blocks…
            </Typography>
          </Box>
        )}

        {!blocksLoading &&
          blocks.map((block) => {
            const type = fromApiBlockType(block.type)
            ordinal = type === 'numbered_list_item' ? ordinal + 1 : 0
            return (
              <EditableBasicBlock
                key={block.id}
                type={type}
                content={block.content as BasicBlockContent}
                editable={!locked}
                index={ordinal}
                onChange={(content) => handleBlockChange(block, content)}
              />
            )
          })}
      </Box>

      <BlockToolbar onAddBlock={handleAddBlock} disabled={locked} />
    </Box>
  )
}
