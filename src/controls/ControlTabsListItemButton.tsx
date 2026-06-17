import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import type React from 'react'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'
import { useControlsWidthContext } from './useControlWidth'

type Props = {
  primary: string
  onClick: React.MouseEventHandler<HTMLDivElement> | undefined
  icon: React.ReactNode
  endIcon?: React.ReactNode
  title?: string
  disabled?: boolean
  isError?: boolean
}

export const ControlTabsListItemButton = ({
  primary,
  onClick,
  icon,
  endIcon,
  title,
  disabled,
  isError,
}: Props) => {
  const { isSmallControls, isMediumControls } = useControlsWidthContext()
  const listItemTextStyleProps = {
    primary: {
      fontSize: isSmallControls ? 8 : isMediumControls ? 12 : 16,
      flexGrow: 1,
    },
  }
  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        minHeight: 32,
        width: '100%',
        boxShadow: isError ? '3px 0 3px #d32f2f, -3px 0 3px  #d32f2f' : '',
        color: isError ? 'error.main' : 'text.secondary',
      }}
      title={title}
      disabled={disabled}
    >
      <ListItemIcon
        sx={{
          minWidth: 26,
          color: isError ? 'error.main' : 'text.secondary',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText primary={primary} slotProps={listItemTextStyleProps} />
      {endIcon && (
        <ListItemIcon
          sx={{
            width: 20,
          }}
        >
          {endIcon}
        </ListItemIcon>
      )}
    </ListItemButton>
  )
}
