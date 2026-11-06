import { Divider, Menu, MenuItem } from '@mui/material'
import { Fragment, useLayoutEffect, useRef } from 'react'
import {
  getSelectionMenuItems,
  selectionMenuActions,
  type SelectionMenuContext,
} from './selectionMenuActions'

export default function SelectionContextMenu({
  anchorPosition,
  context,
  onClose,
}: {
  anchorPosition: { left: number; top: number } | null
  context: SelectionMenuContext
  onClose: () => void
}) {
  const items = getSelectionMenuItems(selectionMenuActions, context)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!anchorPosition) return
    const getMenuItems = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        ),
      )
    const menuItems = getMenuItems()
    menuItems[0]?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const currentItems = getMenuItems()
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!currentItems.length) return
        const activeIndex = currentItems.indexOf(
          document.activeElement as HTMLElement,
        )
        const direction = event.key === 'ArrowDown' ? 1 : -1
        currentItems[
          (activeIndex + direction + currentItems.length) % currentItems.length
        ]?.focus()
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (event.key === 'Enter') {
        const activeItem =
          currentItems.find((item) => item === document.activeElement) ??
          currentItems[0]
        activeItem?.click()
        event.preventDefault()
        event.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [anchorPosition])

  return (
    <Menu
      open={anchorPosition !== null}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      onClose={onClose}
      MenuListProps={{
        'aria-label': 'Piece selection actions',
        autoFocus: true,
        autoFocusItem: anchorPosition !== null,
      }}
    >
      {items.map(({ action, enabled, disabledReason }, index) => {
        const previousGroup = items[index - 1]?.action.group
        const title = enabled ? action.tooltip : disabledReason
        return (
          <Fragment key={action.id}>
            {index > 0 && action.group !== previousGroup && <Divider />}
            <MenuItem
              disabled={!enabled}
              title={title}
              onClick={() => {
                if (!enabled) return
                action.run(context)
                onClose()
              }}
            >
              {action.label}
            </MenuItem>
          </Fragment>
        )
      })}
    </Menu>
  )
}
