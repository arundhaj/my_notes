import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import type { Page } from '../api/types'
import PageIcon from './PageIcon'

export const LEFT_PANEL_WIDTH = 300

interface LeftPanelProps {
  pages: Page[]
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string | null) => void
  onRetry: () => void
}

export default function LeftPanel({
  pages,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
}: LeftPanelProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onSelect(event.target.value || null)
  }

  return (
    // Fixed width so the content does not reflow while the panel animates open
    // and closed. Column layout keeps the header still and scrolls the body.
    <Box
      sx={{
        width: LEFT_PANEL_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading spaces…
            </Typography>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <FormControl fullWidth size="small" disabled={pages.length === 0}>
            <InputLabel id="space-label">Space</InputLabel>
            <Select
              labelId="space-label"
              id="space-select"
              label="Space"
              value={selectedId ?? ''}
              onChange={handleChange}
              displayEmpty={pages.length === 0}
            >
              {pages.map((page) => (
                <MenuItem key={page.id} value={page.id}>
                  <PageIcon icon={page.icon} />
                  {page.title || 'Untitled'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {!loading && !error && pages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No spaces yet. Create one with <code>POST /pages</code>.
          </Typography>
        )}
      </Box>
    </Box>
  )
}
