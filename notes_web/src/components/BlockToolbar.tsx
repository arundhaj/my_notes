import { Box, Button, Paper, Tooltip } from '@mui/material'
import {
  BASIC_BLOCK_TYPES,
  BLOCK_LABEL,
  isPersistable,
} from './blockTypes'
import type { BasicBlockType } from './blockTypes'

interface BlockToolbarProps {
  onAddBlock: (type: BasicBlockType) => void
  disabled?: boolean
}

/**
 * Floating toolbar of block types; clicking one appends it to the page.
 *
 * Sticky rather than fixed, so it tracks the bottom of the content column
 * without having to know the left panel's width or whether it is currently
 * a drawer.
 */
export default function BlockToolbar({ onAddBlock, disabled }: BlockToolbarProps) {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        pt: 3,
        pb: 1,
        // Let content scroll visibly behind the toolbar's own padding.
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          pointerEvents: 'auto',
        }}
      >
        {BASIC_BLOCK_TYPES.map((type) => {
          const persistable = isPersistable(type)
          const button = (
            <Button
              key={type}
              size="small"
              variant="outlined"
              disabled={disabled || !persistable}
              onClick={() => onAddBlock(type)}
              sx={{ textTransform: 'none', minWidth: 0 }}
            >
              {BLOCK_LABEL[type]}
            </Button>
          )

          // A disabled MUI Button fires no events, so the tooltip needs a
          // wrapper element of its own to hang the listeners on.
          return persistable ? (
            button
          ) : (
            <Tooltip
              key={type}
              title="The API has no block_type for this yet — needs a schema migration"
            >
              <span>{button}</span>
            </Tooltip>
          )
        })}
      </Paper>
    </Box>
  )
}
