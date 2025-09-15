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
}

export const ControlTabsListItemButton = ({
  primary,
  onClick,
  icon,
  endIcon,
  title
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
      }}
      title={title}
    >
      <ListItemIcon
        sx={{
          minWidth: 26,
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={primary}
        slotProps={listItemTextStyleProps}
      />
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
