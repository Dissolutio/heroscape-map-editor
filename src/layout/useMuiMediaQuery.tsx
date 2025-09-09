import { useMediaQuery } from '@mui/material'
import React from 'react'


export const useMuiMediaQuery = () => {
  const isLargeScreenLayout = useMediaQuery('(min-width:1000px)')
  const isMobileScreenLayout = useMediaQuery('(max-width:600px)')
  const isMediumScreenLayout = !isLargeScreenLayout && !isMobileScreenLayout
  return ({
    isLargeScreenLayout,
    isMobileScreenLayout,
    isMediumScreenLayout,
  })
}
