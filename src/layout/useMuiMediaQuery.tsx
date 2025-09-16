import { useMediaQuery } from '@mui/material'

export const useMuiMediaQuery = () => {
  const isLargeScreenWidth = useMediaQuery('(min-width:1000px)')
  const isSmallScreenWidth = useMediaQuery('(max-width:600px)')
  const isMediumWidth = useMediaQuery('(max-width:999px)')
  const isMediumScreenWidth = !isSmallScreenWidth && isMediumWidth

  const isLandscapeOrientation = useMediaQuery('(orientation: landscape)')
  const isSmallScreenLandscapeOrientation =
    isMediumWidth && isLandscapeOrientation
  const isSideControls = isLandscapeOrientation || isMediumScreenWidth
  return {
    isLargeScreenWidth,
    isSmallScreenWidth,
    isMediumScreenWidth,
    isLandscapeOrientation,
    isSmallScreenLandscapeOrientation,
    isSideControls,
  }
}
