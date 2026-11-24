import { Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import React from 'react'
import { FcPrint } from 'react-icons/fc'
import { MdFullscreen, MdFullscreenExit, MdNewReleases } from 'react-icons/md'
import { Hexes2DIcon, World3DIcon } from '../assets/EditedGameIcons'
import { getViewMode, type ViewMode } from '../controls/viewMode'
import useBoundStore from '../store/store'
import { useFullscreen } from '../hooks/useFullscreen'
import { lazyWithRetry } from '../utils/lazyWithRetry'
import { useMuiMediaQuery } from './useMuiMediaQuery'

const ReactPdfDownloadLink = lazyWithRetry(() =>
  import('../pdf-map/ReactPdfDownloadLink').then((module) => ({
    default: module.ReactPdfDownloadLink,
  })),
)

export function HeaderNav({ onOpenWhatsNew }: { onOpenWhatsNew: () => void }) {
  // AppBar height is 64px when screen > 600px
  // AppBar height is 56px when screen < 600px
  const hexMap = useBoundStore((s) => s.hexMap)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const toggleIsPdfOpen = useBoundStore((s) => s.toggleIsPdfOpen)
  const toggleIs2DOpen = useBoundStore((s) => s.toggleIs2DOpen)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const viewMode = getViewMode(is2DOpen, isPdfOpen)
  const { isSmallScreenWidth, isMediumScreenWidth } = useMuiMediaQuery()
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const handleViewModeChange = (nextView: ViewMode) => {
    if (nextView === 'pdf') {
      toggleIsPdfOpen(true)
    } else {
      toggleIs2DOpen(nextView === '2d')
    }
  }
  const viewButtons: ViewMode[] = (['2d', '3d', 'pdf'] as const).filter(
    (mode) => mode !== viewMode && (!isSmallScreenWidth || mode !== 'pdf'),
  )
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
            flexGrow: 1,
            m: 0,
            p: 0,
            fontSize: fontSizeHeaderMapName,
          }}
        >
          {hexMap.name || 'Hexoscape Map Editor'}
        </Typography>

        {viewButtons.map((mode) => {
          const title =
            mode === '2d'
              ? 'View 2D Map'
              : mode === '3d'
                ? 'View 3D Map'
                : 'View pdf build instructions'
          return (
            <IconButton
              key={mode}
              size={
                isSmallScreenWidth
                  ? 'small'
                  : isMediumScreenWidth
                    ? undefined
                    : 'large'
              }
              aria-label={title}
              title={title}
              sx={{ mr: isSmallScreenWidth ? 0 : isMediumScreenWidth ? 1 : 2 }}
              onClick={() => handleViewModeChange(mode)}
            >
              {mode === '2d' ? (
                <Hexes2DIcon title={title} />
              ) : mode === '3d' ? (
                <World3DIcon title={title} />
              ) : (
                <FcPrint />
              )}
            </IconButton>
          )
        })}

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
        {isSmallScreenWidth && (
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
        )}
      </Toolbar>
    </AppBar>
  )
}
