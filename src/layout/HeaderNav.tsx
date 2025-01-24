import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import { MdMenu } from 'react-icons/md'

type Props = {
  isNavOpen: boolean
  toggleIsNavOpen: (arg0: boolean) => void
}

export default function HeaderNav({ isNavOpen, toggleIsNavOpen }: Props) {
  return (
    <AppBar
      position="fixed"
    // sx={{ backgroundColor: 'var(--black)' }}
    // sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} //drawer is 1200, appbar is 1100
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={() => toggleIsNavOpen(!isNavOpen)}
        >
          <MdMenu />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
