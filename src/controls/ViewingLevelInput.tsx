import { Box, Grid2, Input, Typography } from '@mui/material'
import useBoundStore from '../store/store'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'
import { useHotkeyConfig } from './useHotkeyConfig'
import { useEffect } from 'react'

export default function ViewingLevelInput() {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const is2DOverlayLevelEnabled = useBoundStore(
    (s) => s.is2DOverlayLevelEnabled,
  )
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)
  const overlayLevel = (maxLevel ?? 0) + 1
  const allowedMaxLevel = is2DOverlayLevelEnabled && (is2DOpen && !isPdfOpen) ? overlayLevel : maxLevel
  const { hotkeyLookup } = useHotkeyConfig()
  // Adjust viewing level down when it's over the allowed max (allow overlay level when toggle is enabled)
  useEffect(() => {
    if (viewingLevel > (allowedMaxLevel ?? 0)) {
      toggleViewingLevel(allowedMaxLevel ?? 0)
    }
  }, [viewingLevel, allowedMaxLevel, toggleViewingLevel])

  return (
    <Box
      sx={{
        width: 250,
        padding: '0.5em',
        border: '1px solid',
        borderColor:
          // show user when they are viewing a lower level, highlight input yellow
          viewingLevel < maxLevel
            ? 'warning.main'
            : 'var(--transparent-border)',
        boxShadow:
          viewingLevel < maxLevel
            ? '3px 0 3px #ffeb3b, -3px 0 3px  #ffeb3b'
            : '',
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
              max: is2DOverlayLevelEnabled ? overlayLevel : maxLevel ?? 0,
              type: 'number',
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 4 }}>
          <Typography id="input-slider">{`of ${maxLevel}${is2DOverlayLevelEnabled ? ` (overlay ${overlayLevel})` : ''}`}</Typography>
        </Grid2>
      </Grid2>
    </Box>
  )
}
