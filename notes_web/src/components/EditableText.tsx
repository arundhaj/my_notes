import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'

interface EditableTextProps {
  /** The saved value. The DOM is (re-)synced from this whenever it changes
   * from outside -- but never while the user is actively typing. */
  value: string
  /** Called on blur (or Enter) with the trimmed text, only if it changed. */
  onCommit: (value: string) => void
  /** Whether this region can currently be typed into -- driven by the
   * page's lock/unlock state, not by this component. */
  editable: boolean
  placeholder?: string
  sx?: SxProps<Theme>
}

/**
 * A `contentEditable` region: click it, type in place, blur or Enter to
 * save. Built for the page title, but deliberately generic -- the same
 * component is meant to back block text later, where each block is its own
 * inline-editable region gated by the same lock state.
 *
 * Deliberately uncontrolled: contentEditable owns its own text node, so
 * rewriting it via React children on every keystroke would fight the DOM and
 * throw the caret around. Instead the DOM is only written imperatively, on
 * mount and whenever `value` changes for a reason other than this element's
 * own edits (e.g. the caller remounts it with a new `key` for a new page).
 */
export default function EditableText({
  value,
  onCommit,
  editable,
  placeholder,
  sx,
}: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  const commit = () => {
    if (!editable) return
    const next = (ref.current?.textContent ?? '').trim()
    if (next !== value) {
      onCommit(next)
    } else if (ref.current) {
      ref.current.textContent = value // normalize a whitespace-only edit
    }
  }

  return (
    <Box
      ref={ref}
      component="div"
      // Explicit false (not just omitted) so this never inherits
      // editability from an ancestor while the page is locked.
      contentEditable={editable}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={false}
      aria-readonly={!editable}
      data-placeholder={placeholder}
      onBlur={commit}
      onKeyDown={(event) => {
        if (!editable) return
        if (event.key === 'Enter') {
          event.preventDefault()
          ref.current?.blur() // triggers commit via onBlur
        } else if (event.key === 'Escape') {
          if (ref.current) ref.current.textContent = value
          ref.current?.blur()
        }
      }}
      sx={{
        outline: 'none',
        borderRadius: 1,
        px: 0.5,
        mx: -0.5,
        cursor: editable ? 'text' : 'inherit',
        ...(placeholder && {
          '&:empty::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
          },
        }),
        ...sx,
      }}
    />
  )
}
