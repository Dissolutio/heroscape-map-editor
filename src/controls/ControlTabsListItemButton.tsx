import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import type React from 'react'
import type { PropsWithChildren } from 'react'

type Props = {
  primary: string
  onClick: React.MouseEventHandler<HTMLDivElement> | undefined
  icon: React.ReactNode
  endIcon?: React.ReactNode
}

export const ControlTabsListItemButton = ({
  primary,
  onClick,
  icon,
  endIcon,
}: Props) => {
  const listItemTextStyleProps = {
    primary: {
      fontSize: 8,
      fontWeight: 'medium',
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
        sx={
          {
            // width: 200
          }
        }
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
