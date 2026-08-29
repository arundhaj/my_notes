import { Box, Chip, Divider, Stack, Typography } from '@mui/material'
import type { Page } from '../api/types'
import PageIcon from './PageIcon'

interface RightPanelProps {
  page: Page | null
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Box>
  )
}

export default function RightPanel({ page }: RightPanelProps) {
  if (!page) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.secondary">
          Select a space from the left panel.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4, maxWidth: 720 }}>
      <Typography variant="h4" component="h1">
        <PageIcon icon={page.icon} />
        {page.title || 'Untitled'}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {page.is_archived && <Chip size="small" label="Archived" />}
        {page.is_trashed && <Chip size="small" color="warning" label="Trashed" />}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={2}>
        <Field label="Page ID" value={page.id} />
        <Field label="Created" value={new Date(page.created_at).toLocaleString()} />
        <Field label="Updated" value={new Date(page.updated_at).toLocaleString()} />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        Blocks are not loaded yet — this panel will render the page content.
      </Typography>
    </Box>
  )
}
