import { ButtonGroup } from '@mui/material'
import React, { type PropsWithChildren } from 'react'

const ControlButtonGroup = (props: PropsWithChildren) => {
  return (
    <ButtonGroup
      // sx={{ padding: '10px' }}
      variant="contained"
      orientation="vertical"
      size={'small'}
    >
      {props.children}
    </ButtonGroup>
  )
}

export default ControlButtonGroup
