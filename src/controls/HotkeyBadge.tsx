import { Badge } from '@mui/material'
import React from 'react'
import { MdKeyboardCommandKey } from 'react-icons/md'

type Props = {
  hotkey: string
}

const HotkeyBadge = ({ hotkey }: Props) => {
  return (
    <Badge badgeContent={hotkey} color="primary">
      <MdKeyboardCommandKey />
    </Badge>
  )
}

export default HotkeyBadge
