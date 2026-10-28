import { Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import React from 'react'
import { FcPrint } from 'react-icons/fc'
import { MdFullscreen, MdFullscreenExit, MdNewReleases } from 'react-icons/md'
import { Hexes2DIcon, World3DIcon } from '../assets/EditedGameIcons'
import useBoundStore from '../store/store'
import { useFullscreen } from '../hooks/useFullscreen'
import { lazyWithRetry } from '../utils/lazyWithRetry'
import { getSetsUsedText } from '../utils/map-utils'
import { useMuiMediaQuery } from './useMuiMediaQuery'

const ReactPdfDownloadLink = lazyWithRetry(() =>
  import('../pdf-map/ReactPdfDownloadLink').then((module) => ({
    default: module.ReactPdfDownloadLink,
  })),
)

export function HeaderNav({
  onOpenWhatsNew,
}: {
  onOpenWhatsNew: () => void
}) {
  // AppBar height is 64px when screen > 600px
  // AppBar height is 56px when screen < 600px
  const hexMap = useBoundStore((s) => s.hexMap)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const toggleIsPdfOpen = useBoundStore((s) => s.toggleIsPdfOpen)
  const toggleIs2DOpen = useBoundStore((s) => s.toggleIs2DOpen)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const view3DOr2DIconTitle = is2DOpen ? 'View 3D Map' : 'View 2D Map'
  const setsUsedText = getSetsUsedText(hexMap?.setsUsed ?? [])
  const { isSmallScreenWidth, isMediumScreenWidth } = useMuiMediaQuery()
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const fontSizeHeaderMapName =
    isSmallScreenWidth && hexMap.name.length > 32
      ? '0.6em'
      : isSmallScreenWidth
        ? '0.9em'
        : hexMap.name.length > 32
          ? '0.8em'
          : '1em'

  return (
    <AppBar
      position="static"
      // sx={{ backgroundColor: 'var(--black)' }}
      // sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} //drawer is 1200, appbar is 1100
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="h1"
          title="Name of this map"
          sx={{
            // must grow instead of sets used text growing, since on small screens sets used text not displayed
            flexGrow: isSmallScreenWidth ? 1 : 0,
            m: 0,
            p: 0,
            fontSize: fontSizeHeaderMapName,
          }}
        >
          {hexMap.name || 'Hexoscape Map Editor'}
        </Typography>

        {/* Hide sets used in navbar on narrow screens */}
        {!isSmallScreenWidth && (
          <Typography
            variant="subtitle1"
            component="span"
            title="Heroscape terrain sets used in this map"
            noWrap
            sx={{
              flexGrow: 1,
              textAlign: 'left',
              fontSize: `calc(${fontSizeHeaderMapName} * 0.7)`,
              color: 'var(--sub-white)',
              px: 2,
              overflow: 'hidden',
              maxHeight: 68,
            }}
          >
            {setsUsedText}
          </Typography>
        )}

        <IconButton
          size={
            isSmallScreenWidth
              ? 'small'
              : isMediumScreenWidth
                ? undefined
                : 'large'
          }
          aria-label="What's new"
          title="What's new"
          sx={{ mr: isSmallScreenWidth ? 0 : isMediumScreenWidth ? 1 : 2 }}
          onClick={onOpenWhatsNew}
        >
          <MdNewReleases />
        </IconButton>
        <IconButton
          size={
            isSmallScreenWidth
              ? 'small'
              : isMediumScreenWidth
                ? undefined
                : 'large'
          }
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          sx={{ mr: isSmallScreenWidth ? 0 : isMediumScreenWidth ? 1 : 2 }}
          onClick={() => toggleFullscreen()}
        >
          {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
        </IconButton>
        {/* MOBILE: No render pdf, does not seem to work on mobile, direct download on button click instead */}
        {isSmallScreenWidth ? (
          <React.Suspense fallback={null}>
            <ReactPdfDownloadLink>
              <IconButton
                size="small"
                title={'Download pdf build instructions'}
                aria-label={'Download pdf build instructions'}
              >
                <FcPrint />
              </IconButton>
            </ReactPdfDownloadLink>
          </React.Suspense>
        ) : (
          // NOT ON MOBILE: You can view the pdf, can download from that view
          <IconButton
            size={
              isSmallScreenWidth
                ? 'small'
                : isMediumScreenWidth
                  ? undefined
                  : 'large'
            }
            title={`${isPdfOpen ? 'Close' : 'View'} pdf build instructions`}
            aria-label={`${isPdfOpen ? 'Close' : 'View'} pdf build instructions`}
            sx={{ mr: isSmallScreenWidth ? 0 : isMediumScreenWidth ? 1 : 2 }}
            onClick={() => toggleIsPdfOpen(!isPdfOpen)}
          >
            <FcPrint />
          </IconButton>
        )}
        <IconButton
          size={
            isSmallScreenWidth
              ? 'small'
              : isMediumScreenWidth
                ? undefined
                : 'large'
          }
          aria-label={view3DOr2DIconTitle}
          title={view3DOr2DIconTitle}
          sx={{ mr: isSmallScreenWidth ? 0 : isMediumScreenWidth ? 1 : 2 }}
          onClick={() => toggleIs2DOpen(!is2DOpen)}
        >
          {is2DOpen ? (
            <World3DIcon title={view3DOr2DIconTitle} />
          ) : (
            <Hexes2DIcon title={view3DOr2DIconTitle} />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
