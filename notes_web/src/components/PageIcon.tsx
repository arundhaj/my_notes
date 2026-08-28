import { Box } from '@mui/material'

/** Shown when a page has no icon of its own. */
export const DEFAULT_PAGE_ICON = '💼'

interface PageIconProps {
  icon: string | null
  /** Font size token or value; defaults to inheriting the surrounding text. */
  fontSize?: string | number
}

/**
 * A page's icon, falling back to a default.
 *
 * Decorative: the page title always sits next to it, so it is hidden from
 * screen readers rather than announced as a stray emoji.
 */
export default function PageIcon({ icon, fontSize }: PageIconProps) {
  // `||` not `??`: the column is nullable *and* accepts an empty string.
  const glyph = icon?.trim() ? icon : DEFAULT_PAGE_ICON

  return (
    <Box component="span" aria-hidden="true" sx={{ mr: 1, fontSize }}>
      {glyph}
    </Box>
  )
}
