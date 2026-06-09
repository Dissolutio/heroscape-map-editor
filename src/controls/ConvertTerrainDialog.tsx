import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Paper,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { hexTerrainColor } from '../world/maphex/hexColors'

function formatTerrainLabel(terrain: string) {
  if (!terrain) return 'Unknown'
  return terrain
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
}

function TerrainStackPreview({
  title,
  counts,
}: {
  title: string
  counts: Record<string, number>
}) {
  const tiles = Object.entries(counts)
    .flatMap(([terrain, count]) =>
      Array(Math.min(5, count))
        .fill(null)
        .map((_, i) => ({ terrain, i })),
    )
    .slice(0, 12)

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        minWidth: 180,
        background:
          'linear-gradient(140deg, rgba(255,255,255,0.9), rgba(245,248,252,0.9))',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          height: 88,
          mt: 0.5,
          overflow: 'hidden',
          borderRadius: 1,
          background:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8), rgba(235,240,248,0.85))',
        }}
      >
        {tiles.map((tile, idx) => (
          <Box
            // eslint-disable-next-line react/no-array-index-key
            key={`${tile.terrain}-${idx}`}
            sx={{
              position: 'absolute',
              width: 34,
              height: 30,
              left: 8 + ((idx * 17) % 120),
              top: 8 + Math.floor((idx * 17) / 120) * 16,
              clipPath:
                'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              bgcolor:
                hexTerrainColor[tile.terrain as keyof typeof hexTerrainColor] ||
                '#999999',
              border: '1px solid rgba(0,0,0,0.35)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </Box>
      <Stack direction="row" gap={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
        {Object.entries(counts)
          .slice(0, 4)
          .map(([terrain, count]) => (
            <Chip
              key={terrain}
              size="small"
              label={`${formatTerrainLabel(terrain)} x${count}`}
            />
          ))}
      </Stack>
    </Paper>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  pieceUIDs: string[]
}

export function ConvertTerrainDialog({ open, onClose, pieceUIDs }: Props) {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const convertTerrainForPieces = useBoundStore((s) => s.convertTerrainForPieces)
  const { enqueueSnackbar } = useSnackbar()
  const [targetTerrain, setTargetTerrain] = useState('')

  const isLandTerrain = useCallback((terrain: string) => {
    return isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)
  }, [])

  const landPieceInventoryByTerrainAndSize = useMemo(() => {
    const lookup = new Map<string, Map<number, string>>()
    for (const piece of Object.values(piecesSoFar)) {
      if (!piece?.isHexTerrainPiece || !isLandTerrain(piece.terrain)) continue
      if (!lookup.has(piece.terrain)) {
        lookup.set(piece.terrain, new Map<number, string>())
      }
      lookup.get(piece.terrain)?.set(piece.size, piece.id)
    }
    return lookup
  }, [isLandTerrain])

  const uidSet = useMemo(() => new Set(pieceUIDs), [pieceUIDs])

  const selectedPieces = useMemo(
    () =>
      boardPieces
        .filter((bp) => uidSet.has(bp.uid))
        .map((bp) => {
          const piece = piecesSoFar[bp.inventoryID]
          return {
            id: bp.uid,
            pieceName: piece?.title ?? 'Unknown',
            inventoryID: bp.inventoryID,
            terrain: piece?.terrain ?? '',
            pieceSize: piece?.size ?? 0,
            isLandPiece: isLandTerrain(piece?.terrain ?? ''),
          }
        }),
    [boardPieces, uidSet, isLandTerrain],
  )

  const selectedLandPieces = useMemo(
    () => selectedPieces.filter((p) => p.isLandPiece),
    [selectedPieces],
  )
  const selectedNonLandPieces = useMemo(
    () => selectedPieces.filter((p) => !p.isLandPiece),
    [selectedPieces],
  )

  const selectedLandCountsByTerrain = useMemo(
    () =>
      selectedLandPieces.reduce(
        (acc, p) => {
          acc[p.terrain] = (acc[p.terrain] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    [selectedLandPieces],
  )

  const selectedNonLandCountsByPieceName = useMemo(
    () =>
      selectedNonLandPieces.reduce(
        (acc, p) => {
          acc[p.pieceName] = (acc[p.pieceName] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    [selectedNonLandPieces],
  )

  const compatibleTargetTerrains = useMemo(() => {
    if (selectedLandPieces.length === 0) return []
    const selectedSizes = new Set(selectedLandPieces.map((p) => p.pieceSize))
    return Array.from(landPieceInventoryByTerrainAndSize.entries())
      .filter(([terrain, bySize]) => {
        const supportsAllSizes = Array.from(selectedSizes).every((size) =>
          bySize.has(size),
        )
        if (!supportsAllSizes) return false
        const wouldChangeAtLeastOne = selectedLandPieces.some((p) => {
          const targetInventoryID = bySize.get(p.pieceSize)
          return targetInventoryID && targetInventoryID !== p.inventoryID
        })
        return Boolean(wouldChangeAtLeastOne) && terrain !== ''
      })
      .map(([terrain]) => terrain)
      .sort((a, b) =>
        formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)),
      )
  }, [landPieceInventoryByTerrainAndSize, selectedLandPieces])

  const previewTargetTerrainCounts = useMemo(() => {
    if (!targetTerrain) return selectedLandCountsByTerrain
    const targetBySize = landPieceInventoryByTerrainAndSize.get(targetTerrain)
    if (!targetBySize) return selectedLandCountsByTerrain
    return selectedLandPieces.reduce(
      (acc, p) => {
        const targetInventoryID = targetBySize.get(p.pieceSize)
        const targetPiece = targetInventoryID
          ? piecesSoFar[targetInventoryID]
          : undefined
        const terrain = targetPiece?.terrain ?? p.terrain
        acc[terrain] = (acc[terrain] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [
    landPieceInventoryByTerrainAndSize,
    selectedLandCountsByTerrain,
    selectedLandPieces,
    targetTerrain,
  ])

  // Initialise targetTerrain to a compatible value whenever the dialog opens
  useEffect(() => {
    if (open) {
      setTargetTerrain((prev) => {
        if (prev && compatibleTargetTerrains.includes(prev)) return prev
        return compatibleTargetTerrains[0] ?? ''
      })
    }
  }, [open, compatibleTargetTerrains])

  const handleConvert = () => {
    if (!targetTerrain || selectedLandPieces.length === 0) return
    const targetBySize = landPieceInventoryByTerrainAndSize.get(targetTerrain)
    if (!targetBySize) return

    const mapping = selectedLandPieces.reduce(
      (acc, p) => {
        const targetInventoryID = targetBySize.get(p.pieceSize)
        if (targetInventoryID && targetInventoryID !== p.inventoryID) {
          acc[p.inventoryID] = targetInventoryID
        }
        return acc
      },
      {} as Record<string, string>,
    )

    const convertedCount = convertTerrainForPieces({
      selectedUIDs: selectedLandPieces.map((p) => p.id),
      targetInventoryBySourceInventory: mapping,
    })

    onClose()
    if (convertedCount > 0) {
      enqueueSnackbar({
        message: `Converted ${convertedCount} terrain tiles to ${formatTerrainLabel(targetTerrain)}.`,
        variant: 'success',
      })
    } else {
      enqueueSnackbar({
        message: 'No selected land tiles were changed.',
        variant: 'info',
      })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Convert Terrain</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Convert selected land tiles to another terrain while preserving
            piece size, rotation, altitude, and structure.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
            <Paper variant="outlined" sx={{ p: 1.25, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Selection Findings
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Selected pieces: {selectedPieces.length}
              </Typography>
              <Typography variant="body2">
                Land tiles affected: {selectedLandPieces.length}
              </Typography>
              <Typography variant="body2">
                Non-land (unchanged): {selectedNonLandPieces.length}
              </Typography>
              <Stack
                direction="row"
                gap={0.5}
                sx={{ mt: 0.75, flexWrap: 'wrap' }}
              >
                {Object.entries(selectedLandCountsByTerrain).map(
                  ([terrain, count]) => (
                    <Chip
                      key={terrain}
                      size="small"
                      label={`${formatTerrainLabel(terrain)} x${count}`}
                    />
                  ),
                )}
              </Stack>
              <Stack
                direction="row"
                gap={0.5}
                sx={{ mt: 0.75, flexWrap: 'wrap' }}
              >
                {Object.entries(selectedNonLandCountsByPieceName).map(
                  ([pieceName, count]) => (
                    <Chip
                      key={pieceName}
                      size="small"
                      variant="outlined"
                      label={`${pieceName} x${count}`}
                    />
                  ),
                )}
              </Stack>
            </Paper>
            <FormControl fullWidth size="small" sx={{ flex: 1 }}>
              <InputLabel id="convert-terrain-select-label">
                Target Terrain
              </InputLabel>
              <Select
                labelId="convert-terrain-select-label"
                label="Target Terrain"
                value={targetTerrain}
                onChange={(event: SelectChangeEvent) =>
                  setTargetTerrain(event.target.value)
                }
              >
                {compatibleTargetTerrains.map((terrain) => (
                  <MenuItem key={terrain} value={terrain}>
                    {formatTerrainLabel(terrain)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            gap={1.5}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 0.75 }}
          >
            <TerrainStackPreview
              title="Current Terrain Mix"
              counts={selectedLandCountsByTerrain}
            />
            <Typography variant="h4" sx={{ opacity: 0.7 }}>
              {'->'}
            </Typography>
            <TerrainStackPreview
              title="Converted Terrain Mix"
              counts={previewTargetTerrainCounts}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={selectedLandPieces.length === 0 || !targetTerrain}
        >
          Submit Conversion
        </Button>
      </DialogActions>
    </Dialog>
  )
}
