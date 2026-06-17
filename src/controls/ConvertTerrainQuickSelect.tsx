import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SxProps,
  type Theme,
  type SelectChangeEvent,
} from '@mui/material'
import { useCallback, useId, useMemo } from 'react'
import { useSnackbar } from 'notistack'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'

function formatTerrainLabel(terrain: string) {
  if (!terrain) return 'Unknown'
  return terrain
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
}

/**
 * Compact inline terrain converter for the SelectedPieceReadout card.
 * Selecting a terrain immediately applies the conversion — no submit step.
 */
export function ConvertTerrainQuickSelect({
  pieceUIDs,
  label = 'Convert terrain',
  compact = false,
  alwaysRender = false,
  sx,
}: {
  pieceUIDs: string[]
  label?: string
  compact?: boolean
  alwaysRender?: boolean
  sx?: SxProps<Theme>
}) {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const convertTerrainForPieces = useBoundStore(
    (s) => s.convertTerrainForPieces,
  )
  const { enqueueSnackbar } = useSnackbar()
  const id = useId()

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

  const selectedLandPieces = useMemo(
    () =>
      boardPieces
        .filter((bp) => uidSet.has(bp.uid))
        .flatMap((bp) => {
          const piece = piecesSoFar[bp.inventoryID]
          if (!isLandTerrain(piece?.terrain ?? '')) return []
          return [
            {
              id: bp.uid,
              inventoryID: bp.inventoryID,
              terrain: piece?.terrain ?? '',
              pieceSize: piece?.size ?? 0,
            },
          ]
        }),
    [boardPieces, uidSet, isLandTerrain],
  )

  const availableTerrains = useMemo(
    () =>
      Array.from(landPieceInventoryByTerrainAndSize.keys())
        .filter((terrain) => terrain !== '')
        .sort((a, b) =>
          formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)),
        ),
    [landPieceInventoryByTerrainAndSize],
  )

  const handleChange = (event: SelectChangeEvent) => {
    const targetTerrain = event.target.value
    if (!targetTerrain) return

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

    if (convertedCount > 0) {
      enqueueSnackbar({
        message: `Converted ${convertedCount} tile${convertedCount === 1 ? '' : 's'} to ${formatTerrainLabel(targetTerrain)}.`,
        variant: 'success',
      })
    } else {
      enqueueSnackbar({
        message: 'No tiles were changed.',
        variant: 'info',
      })
    }
  }

  if (!alwaysRender && (selectedLandPieces.length === 0 || availableTerrains.length === 0)) {
    return null
  }

  const isDisabled = selectedLandPieces.length === 0 || availableTerrains.length === 0
  const labelId = `quick-convert-terrain-label-${id}`

  return (
    <FormControl fullWidth size="small" sx={{ mt: compact ? 0 : 0.5, ...sx }}>
      <InputLabel
        id={labelId}
        sx={{ fontSize: compact ? 9 : 10, top: compact ? '-4px' : '-2px' }}
      >
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        // Always empty — selecting immediately fires conversion and resets
        value=""
        onChange={handleChange}
        disabled={isDisabled}
        sx={{ fontSize: compact ? 9 : 10 }}
      >
        {isDisabled && (
          <MenuItem value="" disabled sx={{ fontSize: compact ? 10 : 12 }}>
            No eligible land selected
          </MenuItem>
        )}
        {availableTerrains.map((terrain) => (
          <MenuItem
            key={terrain}
            value={terrain}
            sx={{ fontSize: compact ? 10 : 12 }}
          >
            {formatTerrainLabel(terrain)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
