import { Box, Grid2, Input, Typography } from '@mui/material'
import { useEffect } from 'react'
import useBoundStore from '../store/store'
import {
  getBoardPiecesMaxLevel,
  getCycleableLevels,
  getOverlayLevel,
} from '../utils/map-utils'
import { useHotkeyConfig } from './useHotkeyConfig'

export default function ViewingLevelInput() {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const is2DOverlayLevelEnabled = useBoundStore(
    (s) => s.is2DOverlayLevelEnabled,
  )
  const maxLevel = getBoardPiecesMaxLevel(boardPieces, boardHexes)
  const overlayLevel = getOverlayLevel(boardPieces, boardHexes)
  const allowedMaxLevel =
    is2DOverlayLevelEnabled && is2DOpen && !isPdfOpen ? overlayLevel : maxLevel
  const cycleableLevels = getCycleableLevels(boardPieces, boardHexes).filter(
    (level) => level <= allowedMaxLevel,
  )
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
            onChange={(event) => {
              const entered = Number.parseFloat(event.target.value)
              if (Number.isNaN(entered)) return
              // snap freeform/step input to the nearest valid whole or half-fluid level
              const nearest = cycleableLevels.reduce(
                (best, level) =>
                  Math.abs(level - entered) < Math.abs(best - entered)
                    ? level
                    : best,
                cycleableLevels[0] ?? 0,
              )
              toggleViewingLevel(nearest)
            }}
            inputProps={{
              step: 0.5,
              min: 0,
              max: is2DOverlayLevelEnabled ? overlayLevel : (maxLevel ?? 0),
              type: 'number',
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 4 }}>
          <Typography id="input-slider">{`of ${maxLevel}${is2DOverlayLevelEnabled && is2DOpen ? ` (overlay ${overlayLevel})` : ''}`}</Typography>
        </Grid2>
      </Grid2>
    </Box>
  )
}
