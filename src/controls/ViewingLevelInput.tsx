import { Box, Grid2, Input, Typography } from '@mui/material'
import useBoundStore from '../store/store'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'
import { useHotkeyConfig } from './useHotkeyConfig'

export default function ViewingLevelInput() {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)
  const { hotkeyLookup } = useHotkeyConfig()

  return (
    <Box
      sx={{
        width: 250,
        border: '1px solid var(--transparent-border)',
        padding: '0.5em',
      }}
    >
      <Grid2 container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid2 size={{ xs: 5 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span title={`Use "page up"/"page down" hotkeys to change`}>
              Viewing level:
            </span>
            <span
              style={{
                fontSize: '0.6em',
                color: 'var(--sub-white)',
              }}
            >
              Hotkeys:{' '}
              {`${(hotkeyLookup.incrementViewingLevel)?.toUpperCase()}`},{' '}
              {`${(hotkeyLookup.decrementViewingLevel)?.toUpperCase()}`}
            </span>
          </div>
        </Grid2>
        <Grid2 size={{ xs: 3 }}>
          <Input
            value={viewingLevel}
            size="small"
            onChange={(event) =>
              toggleViewingLevel(Number.parseInt(event.target.value))
            }
            inputProps={{
              step: 1,
              min: 0,
              max: maxLevel ?? 0,
              type: 'number',
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 4 }}>
          <Typography id="input-slider">{`of ${maxLevel}`}</Typography>
        </Grid2>
      </Grid2>
    </Box>
  )
}
