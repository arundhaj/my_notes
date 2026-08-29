import { Box } from '@mui/material'
import type { Page } from '../api/types'
import PageTree from './PageTree'

export const LEFT_PANEL_WIDTH = 300

interface LeftPanelProps {
  onSelectPage: (page: Page) => void
}

export default function LeftPanel({ onSelectPage }: LeftPanelProps) {
  return (
    // Fixed width so the content does not reflow while the panel animates
    // open and closed.
    <Box
      sx={{
        width: LEFT_PANEL_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <PageTree onSelectPage={onSelectPage} />
    </Box>
  )
}
