import { Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import { FcPrint } from 'react-icons/fc'
import { MdMenu } from 'react-icons/md'
import { Hexes2DIcon, World3DIcon } from '../assets/EditedGameIcons'
import { ReactPdfDownloadLink } from '../pdf-map/ReactPdfDownloadLink'
import useBoundStore from '../store/store'

type Props = {
  isMobileScreenLayout: boolean
  isNavOpen: boolean
  toggleIsNavOpen: (arg0: boolean) => void
  isPdfOpen: boolean
  toggleIsPdfOpen: (arg0: boolean) => void
  is2DOpen: boolean
  toggleIs2DOpen: (arg0: boolean) => void
}

export function HeaderNav({
  isMobileScreenLayout,
  isNavOpen,
  toggleIsNavOpen,
  isPdfOpen,
  toggleIsPdfOpen,
  is2DOpen,
  toggleIs2DOpen,
}: Props) {
  // AppBar height is 64px when screen > 600px
  // AppBar height is 56px when screen < 600px
  const hexMap = useBoundStore((s) => s.hexMap)
  return (
    <AppBar
      position="static"
      // sx={{ backgroundColor: 'var(--black)' }}
      // sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} //drawer is 1200, appbar is 1100
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          aria-label="File menu"
          sx={{ mr: 2 }}
          onClick={() => toggleIsNavOpen(!isNavOpen)}
        >
          <MdMenu />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
          aria-label={`Map name: ${hexMap.name}`}
        >
          {hexMap.name || 'Hexoscape Map Editor'}
        </Typography>
        {isMobileScreenLayout ? (
          <ReactPdfDownloadLink>
            <IconButton
              size="large"
              title={`Download pdf build instructions`}
              aria-label={`Download pdf build instructions`}
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
          aria-label={is2DOpen ? 'View 3D Map' : 'View 2D Map'}
          title={is2DOpen ? 'View 3D Map' : 'View 2D Map'}
          sx={{ mr: 2 }}
          onClick={() => toggleIs2DOpen(!is2DOpen)}
        >
          {is2DOpen ? <World3DIcon /> : <Hexes2DIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
