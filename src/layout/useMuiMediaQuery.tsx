import { useMediaQuery } from '@mui/material'

export const useMuiMediaQuery = () => {
  const isLargeScreenLayout = useMediaQuery('(min-width:1000px)')
  const isMobileScreenLayout = useMediaQuery('(max-width:600px)')
  const isMediumWidth = useMediaQuery('(max-width:999px)')
  const isMediumScreenLayout = !isMobileScreenLayout && isMediumWidth
  const isLandscapeOrientation = useMediaQuery('(orientation: landscape)')
  const isMediumScreenLandscapeOrientation = isMediumScreenLayout && isLandscapeOrientation
  const isSmallScreenLandscapeOrientation = !isLargeScreenLayout && isLandscapeOrientation
  return {
    isLargeScreenLayout,
    isMobileScreenLayout,
    isMediumScreenLayout,
    isLandscapeOrientation,
    isSmallScreenLandscapeOrientation,
    isMediumScreenLandscapeOrientation
  }
}
