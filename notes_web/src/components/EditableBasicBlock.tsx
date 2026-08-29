import {
  Box,
  Checkbox,
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'
import type { TypographyProps } from '@mui/material'
import EditableText from './EditableText'
import type { BasicBlockContent, BasicBlockType } from './blockTypes'

interface EditableBasicBlockProps {
  type: BasicBlockType
  content: BasicBlockContent
  /** Gated by the page's lock state, exactly like EditableText. */
  editable: boolean
  /** Called with the whole next content object whenever any part changes. */
  onChange: (content: BasicBlockContent) => void
  /** 1-based ordinal, used only by numbered_list_item. */
  index?: number
  /** Where a page_link block should navigate to. */
  onNavigateToPage?: (pageId: string) => void
}

/** Heading levels map straight onto MUI's typography scale. */
const HEADING_VARIANT: Record<string, TypographyProps['variant']> = {
  h1: 'h3',
  h2: 'h4',
  h3: 'h5',
  h4: 'h6',
  h5: 'subtitle1',
  h6: 'subtitle2',
}

const PLACEHOLDER: Partial<Record<BasicBlockType, string>> = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  paragraph: 'Type something…',
  bulleted_list_item: 'List item',
  numbered_list_item: 'List item',
  to_do: 'To-do',
  quote: 'Quote',
}

/**
 * Renders one basic block, editable in place when the page is unlocked.
 *
 * Text-bearing types all delegate to EditableText, so caret handling and the
 * blur/Enter commit behaviour stay in one place; this component only decides
 * what wraps that text (heading level, bullet, checkbox, quote rule...).
 *
 * List types are single *items*, matching the schema, where each list entry
 * is its own row ordered by `position` -- not one block holding a whole list.
 */
export default function EditableBasicBlock({
  type,
  content,
  editable,
  onChange,
  index = 1,
  onNavigateToPage,
}: EditableBasicBlockProps) {
  const text = content.text ?? ''
  const commitText = (next: string) => onChange({ ...content, text: next })
  const placeholder = PLACEHOLDER[type]

  if (type === 'divider') {
    return <Divider sx={{ my: 2 }} />
  }

  if (type === 'spacer') {
    return <Box sx={{ height: content.height ?? 24 }} aria-hidden="true" />
  }

  if (type === 'page_link') {
    const pageId = content.pageId ?? null
    return (
      <Link
        component="button"
        type="button"
        underline="hover"
        disabled={!pageId}
        onClick={() => pageId && onNavigateToPage?.(pageId)}
        sx={{ display: 'block', textAlign: 'left', py: 0.25 }}
      >
        {text || 'Untitled page'}
      </Link>
    )
  }

  if (type === 'table') {
    const rows = content.rows ?? [['', '']]
    return (
      <Table size="small" sx={{ my: 1, width: 'auto' }}>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} sx={{ verticalAlign: 'top' }}>
                  <EditableText
                    value={cell}
                    editable={editable}
                    placeholder="—"
                    onCommit={(next) => {
                      const nextRows = rows.map((r) => [...r])
                      nextRows[rowIndex][cellIndex] = next
                      onChange({ ...content, rows: nextRows })
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (type === 'to_do') {
    const checked = content.checked ?? false
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.25 }}>
        <Checkbox
          size="small"
          checked={checked}
          disabled={!editable}
          onChange={(event) => onChange({ ...content, checked: event.target.checked })}
          sx={{ p: 0.5, mr: 0.5 }}
        />
        <EditableText
          value={text}
          editable={editable}
          placeholder={placeholder}
          onCommit={commitText}
          sx={{
            flex: 1,
            pt: 0.25,
            textDecoration: checked ? 'line-through' : 'none',
            color: checked ? 'text.disabled' : 'inherit',
          }}
        />
      </Box>
    )
  }

  if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
    const marker = type === 'bulleted_list_item' ? '•' : `${index}.`
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.25 }}>
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            minWidth: 24,
            textAlign: type === 'bulleted_list_item' ? 'center' : 'right',
            pr: 1,
            color: 'text.secondary',
            userSelect: 'none',
          }}
        >
          {marker}
        </Box>
        <EditableText
          value={text}
          editable={editable}
          placeholder={placeholder}
          onCommit={commitText}
          sx={{ flex: 1 }}
        />
      </Box>
    )
  }

  if (type === 'quote') {
    return (
      <Box
        sx={{
          borderLeft: 3,
          borderColor: 'divider',
          pl: 2,
          my: 1,
          fontStyle: 'italic',
        }}
      >
        <EditableText
          value={text}
          editable={editable}
          placeholder={placeholder}
          onCommit={commitText}
        />
      </Box>
    )
  }

  // Headings and paragraphs: same shape, different typography.
  const variant = type === 'paragraph' ? 'body1' : HEADING_VARIANT[type]
  return (
    <Typography variant={variant} component="div" sx={{ py: 0.25 }}>
      <EditableText
        value={text}
        editable={editable}
        placeholder={placeholder}
        onCommit={commitText}
      />
    </Typography>
  )
}
