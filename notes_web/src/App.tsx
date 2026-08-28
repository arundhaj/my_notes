import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { listRootPages } from './api/pages'
import type { Page } from './api/types'
import LeftPanel, { LEFT_PANEL_WIDTH } from './components/LeftPanel'
import RightPanel from './components/RightPanel'

/** Hamburger, inline so the app needs no icon dependency. */
function MenuGlyph() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 20, height: 20 }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Box>
  )
}

function App() {
  const theme = useTheme()
  // Below md the panel overlays the content instead of sitting beside it.
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))

  const [panelOpen, setPanelOpen] = useState(true)
  const [rootPages, setRootPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listRootPages(controller.signal)
      .then((pages) => {
        setRootPages(pages)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken])

  const selectedPage = useMemo(
    () => rootPages.find((page) => page.id === selectedId) ?? null,
    [rootPages, selectedId],
  )

  // Reset the request state here rather than inside the effect, so the effect
  // only ever sets state from the settled promise.
  const handleRetry = useCallback(() => {
    setLoading(true)
    setError(null)
    setReloadToken((token) => token + 1)
  }, [])

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      // On a narrow screen the panel covers the content, so get out of the way.
      if (isNarrow) setPanelOpen(false)
    },
    [isNarrow],
  )

  const panel = (
    <LeftPanel
      pages={rootPages}
      loading={loading}
      error={error}
      selectedId={selectedId}
      onSelect={handleSelect}
      onRetry={handleRetry}
    />
  )

  return (
    // 100dvh rather than 100vh so mobile browser chrome does not push the
    // panels off-screen. overflow hidden keeps scrolling inside the panels.
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            onClick={() => setPanelOpen((open) => !open)}
            aria-label={panelOpen ? 'Collapse pages panel' : 'Expand pages panel'}
            aria-expanded={panelOpen}
            sx={{ mr: 1 }}
          >
            <MenuGlyph />
          </IconButton>
          <Typography variant="subtitle1" component="h1" noWrap>
            
          </Typography>
        </Toolbar>
      </AppBar>

      {/* minHeight: 0 lets the flex children own their scrollbars instead of
          growing this row past the viewport. */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {isNarrow ? (
          <Drawer
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            ModalProps={{ keepMounted: true }}
            slotProps={{
              paper: { sx: { width: LEFT_PANEL_WIDTH, boxSizing: 'border-box' } },
            }}
          >
            {panel}
          </Drawer>
        ) : (
          <Box
            component="aside"
            sx={{
              width: panelOpen ? LEFT_PANEL_WIDTH : 0,
              flexShrink: 0,
              overflow: 'hidden',
              borderRight: panelOpen ? 1 : 0,
              borderColor: 'divider',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            {panel}
          </Box>
        )}

        <Box
          component="main"
          sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}
        >
          <RightPanel page={selectedPage} />
        </Box>
      </Box>
    </Box>
  )
}

export default App
