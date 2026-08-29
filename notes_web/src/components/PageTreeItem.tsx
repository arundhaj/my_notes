import { useEffect, useState } from 'react'
import {
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { listChildPages } from '../api/pages'
import { usePageStore } from '../state/pageStore'
import PageIcon from './PageIcon'

interface PageTreeItemProps {
  pageId: string
  depth: number
  onSelectPage: (pageId: string) => void
}

/**
 * One row of the tree, and its own expand/collapse state.
 *
 * The page itself is read from the shared PageStoreProvider by id, not
 * passed down as a prop -- so if it's being edited elsewhere (e.g. its
 * title, in the right panel), this row re-renders with the same change,
 * with no signal needing to be threaded down to find it.
 *
 * Children are fetched lazily -- only when the chevron button is clicked --
 * and then their ids are cached in state for the row's lifetime, so
 * collapsing and re-expanding does not refetch. The chevron and "Add"
 * buttons stop click propagation so their own clicks don't also select the
 * row's page.
 */
export default function PageTreeItem({
  pageId,
  depth,
  onSelectPage,
}: PageTreeItemProps) {
  const { pages, upsertPages } = usePageStore()
  const page = pages[pageId]

  const [expanded, setExpanded] = useState(false)
  const [childIds, setChildIds] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!expanded || childIds !== null) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    listChildPages(pageId, controller.signal)
      .then((kids) => {
        upsertPages(kids)
        setChildIds(kids.map((kid) => kid.id))
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    return () => controller.abort()
  }, [expanded, childIds, pageId, upsertPages])

  // The store hasn't been populated for this id yet -- shouldn't normally
  // happen, since an id only ever reaches this component alongside its page
  // being upserted in the same batch, but render nothing rather than crash.
  if (!page) return null

  const indent = 1 + depth * 1.5

  return (
    <>
      {/* component="div": ListItemButton is ButtonBase, which renders a
          native <button> by default. Rendering as a div instead lets the
          chevron and add IconButtons -- themselves real <button>s -- nest
          inside it legally, while ButtonBase still adds the role, tabIndex
          and keyboard handling that makes it behave like one. */}
      <ListItemButton
        component="div"
        dense
        onClick={() => onSelectPage(page.id)}
        sx={{
          pl: indent,
          // Reveal the add button only while this row is hovered or focused.
          '&:hover .PageTreeItem-add, &:focus-within .PageTreeItem-add': {
            opacity: 1,
          },
        }}
      >
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          aria-expanded={expanded}
          onClick={(event) => {
            // Stop the row's own onClick from also selecting the page.
            event.stopPropagation()
            setExpanded((value) => !value)
          }}
          sx={{ p: 0.5, mr: 0.25, flexShrink: 0 }}
        >
          <ChevronRightIcon
            fontSize="small"
            sx={{
              transition: 'transform 150ms',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </IconButton>

        <PageIcon icon={page.icon} />
        <ListItemText
          primary={page.title || 'Untitled'}
          slotProps={{ primary: { noWrap: true } }}
        />

        <IconButton
          className="PageTreeItem-add"
          size="small"
          aria-label="Add"
          // No action wired up yet -- just stop the row's own onClick from
          // also selecting the page.
          onClick={(event) => event.stopPropagation()}
          sx={{ opacity: 0, ml: 1, flexShrink: 0 }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </ListItemButton>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {loading && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', pl: indent + 2, py: 0.5 }}
          >
            Loading…
          </Typography>
        )}
        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: 'block', pl: indent + 2, py: 0.5 }}
          >
            {error}
          </Typography>
        )}
        {childIds?.length === 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', pl: indent + 2, py: 0.5 }}
          >
            No pages
          </Typography>
        )}
        {childIds && childIds.length > 0 && (
          <List dense disablePadding>
            {childIds.map((id) => (
              <PageTreeItem
                key={id}
                pageId={id}
                depth={depth + 1}
                onSelectPage={onSelectPage}
              />
            ))}
          </List>
        )}
      </Collapse>
    </>
  )
}
