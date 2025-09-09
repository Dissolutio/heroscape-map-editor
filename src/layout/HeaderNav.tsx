import { Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import { FcPrint } from 'react-icons/fc'
import { Hexes2DIcon, World3DIcon } from '../assets/EditedGameIcons'
import { ReactPdfDownloadLink } from '../pdf-map/ReactPdfDownloadLink'
import useBoundStore from '../store/store'
import { getSetsUsedText } from '../utils/map-utils'

type Props = {
  isMobileScreenLayout: boolean
  isPdfOpen: boolean
  toggleIsPdfOpen: (arg0: boolean) => void
  is2DOpen: boolean
  toggleIs2DOpen: (arg0: boolean) => void
}

export function HeaderNav({
  isMobileScreenLayout,
  isPdfOpen,
  toggleIsPdfOpen,
  is2DOpen,
  toggleIs2DOpen,
}: Props) {
  // AppBar height is 64px when screen > 600px
  // AppBar height is 56px when screen < 600px
  const hexMap = useBoundStore((s) => s.hexMap)
  const iconTitle = is2DOpen ? 'View 3D Map' : 'View 2D Map'
  const setsUsedText = getSetsUsedText(hexMap?.setsUsed ?? [])
  return (
    <AppBar
      position="static"
    // sx={{ backgroundColor: 'var(--black)' }}
    // sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} //drawer is 1200, appbar is 1100
    >
      <Toolbar>
        <Typography
          variant="h1"
          component="h1"
          sx={{ flexGrow: 0, m: 0, p: 0, fontSize: 18 }}
        >
          {hexMap.name || 'Hexoscape Map Editor'}

        </Typography>
        <Typography
          variant="subtitle1"
          component="span"
          sx={{
            flexGrow: 1,
            textAlign: 'left',
            fontSize: '0.6em',
            color: 'var(--sub-white)',
            px: 2,
            overflow: 'hidden',
            maxHeight: 68
          }}
        >
          {setsUsedText}
        </Typography>
        {isMobileScreenLayout ? (
          <ReactPdfDownloadLink>
            <IconButton
              size="large"
              title={'Download pdf build instructions'}
              aria-label={'Download pdf build instructions'}
              sx={{ mr: 2 }}
            >
              <FcPrint />
            </IconButton>
          </ReactPdfDownloadLink>
        ) : (
          <IconButton
            size="large"
            title={`${isPdfOpen ? 'Close' : 'View'} pdf build instructions`}
            aria-label={`${isPdfOpen ? 'Close' : 'View'} pdf build instructions`}
            sx={{ mr: 2 }}
            onClick={() => toggleIsPdfOpen(!isPdfOpen)}
          >
            <FcPrint />
          </IconButton>
        )}
        <IconButton
          size="large"
          aria-label={iconTitle}
          title={iconTitle}
          sx={{ mr: 2 }}
          onClick={() => toggleIs2DOpen(!is2DOpen)}
        >
          {is2DOpen ? (
            <World3DIcon title={iconTitle} />
          ) : (
            <Hexes2DIcon title={iconTitle} />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
