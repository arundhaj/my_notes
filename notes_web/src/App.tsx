import { useCallback, useState } from 'react'
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
import MenuIcon from '@mui/icons-material/Menu'
import type { Page } from './api/types'
import LeftPanel, { LEFT_PANEL_WIDTH } from './components/LeftPanel'
import RightPanel from './components/RightPanel'

function App() {
  const theme = useTheme()
  // Below md the panel overlays the content instead of sitting beside it.
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))

  const [panelOpen, setPanelOpen] = useState(true)
  // What the right panel shows: whichever page was last clicked in the tree.
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)

  const handleSelectPage = useCallback(
    (page: Page) => {
      setSelectedPage(page)
      // On a narrow screen the panel covers the content, so get out of the way.
      if (isNarrow) setPanelOpen(false)
    },
    [isNarrow],
  )

  const panel = <LeftPanel onSelectPage={handleSelectPage} />

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
            <MenuIcon fontSize="small" />
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
