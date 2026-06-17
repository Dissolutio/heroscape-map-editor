import {
  Button,
  Divider,
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
import { getConstrainedLandInventoryByTerrainAndSize } from '../utils/terrain-constraints'

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
  prominent = false,
  alwaysRender = false,
  sx,
}: {
  pieceUIDs: string[]
  label?: string
  compact?: boolean
  prominent?: boolean
  alwaysRender?: boolean
  sx?: SxProps<Theme>
}) {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const setsUsed = useBoundStore((s) => s.hexMap?.setsUsed ?? [])
  const toggleIsEditMapDialogOpen = useBoundStore(
    (s) => s.toggleIsEditMapDialogOpen,
  )
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

  const hasSetConstraints = setsUsed.length > 0
  const constrainedLandInventoryByTerrainAndSize = useMemo(
    () => getConstrainedLandInventoryByTerrainAndSize(setsUsed),
    [setsUsed],
  )
  const allTerrains = useMemo(
    () =>
      Array.from(landPieceInventoryByTerrainAndSize.keys()).filter(
        (terrain) => terrain !== '',
      ),
    [landPieceInventoryByTerrainAndSize],
  )

  const selectedPieceSizes = useMemo(
    () => new Set(selectedLandPieces.map((piece) => piece.pieceSize)),
    [selectedLandPieces],
  )

  const terrainsValidForSelectedPieces = useMemo(
    () =>
      Array.from(landPieceInventoryByTerrainAndSize.entries())
        .filter(([terrain, targetBySize]) => {
          if (terrain === '') {
            return false
          }

          return Array.from(selectedPieceSizes).some((pieceSize) => {
            return targetBySize.has(pieceSize)
          })
        })
        .map(([terrain]) => terrain)
        .sort((a, b) =>
          formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)),
        ),
    [landPieceInventoryByTerrainAndSize, selectedPieceSizes],
  )

  const availableTerrains = useMemo(
    () =>
      Array.from(
        (hasSetConstraints
          ? constrainedLandInventoryByTerrainAndSize
          : landPieceInventoryByTerrainAndSize
        ).entries(),
      )
        .filter(([terrain, targetBySize]) => {
          if (terrain === '') {
            return false
          }

          return Array.from(selectedPieceSizes).some((pieceSize) => {
            return targetBySize.has(pieceSize)
          })
        })
        .map(([terrain]) => terrain)
        .sort((a, b) =>
          formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)),
        ),
    [
      hasSetConstraints,
      constrainedLandInventoryByTerrainAndSize,
      landPieceInventoryByTerrainAndSize,
      selectedPieceSizes,
    ],
  )
  const hiddenForSelectionCount =
    allTerrains.length - terrainsValidForSelectedPieces.length
  const hiddenForConstraintsCount =
    terrainsValidForSelectedPieces.length - availableTerrains.length
  const showConstraintNotice =
    !compact &&
    (hiddenForSelectionCount > 0 || hiddenForConstraintsCount > 0)
  const constraintNoticeText =
    hiddenForSelectionCount > 0 && hiddenForConstraintsCount > 0
      ? 'Some terrain options are unavailable for the selected pieces or hidden by terrain set constraints.'
      : hiddenForSelectionCount > 0
        ? 'Some terrain options are unavailable for the selected pieces.'
        : 'Some terrain options are hidden because this map has terrain set constraints.'

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
  const disabledMessage =
    selectedLandPieces.length === 0
      ? 'No eligible land selected'
      : hasSetConstraints
        ? 'No constrained terrain options available'
        : 'No terrain options available'
  const labelId = `quick-convert-terrain-label-${id}`
  const controlSize = compact ? 'small' : prominent ? 'medium' : 'small'
  const labelFontSize = compact ? 9 : prominent ? 12 : 10
  const labelTop = compact ? '-4px' : prominent ? undefined : '-2px'
  const selectFontSize = compact ? 9 : prominent ? 12 : 10
  const menuItemFontSize = compact ? 10 : prominent ? 12 : 12

  return (
    <FormControl
      fullWidth
      size={controlSize}
      sx={{
        mt: compact ? 0 : 0.5,
        ...sx,
        '& .MuiOutlinedInput-root': prominent
          ? {
            minHeight: 44,
            borderRadius: 1.5,
            backgroundColor: 'background.paper',
          }
          : undefined,
      }}
    >
      <InputLabel
        id={labelId}
        sx={{ fontSize: labelFontSize, top: labelTop }}
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
        sx={{ fontSize: selectFontSize }}
      >
        {isDisabled && (
          <MenuItem value="" disabled sx={{ fontSize: menuItemFontSize }}>
            {disabledMessage}
          </MenuItem>
        )}
        {availableTerrains.map((terrain) => (
          <MenuItem
            key={terrain}
            value={terrain}
            sx={{ fontSize: menuItemFontSize }}
          >
            {formatTerrainLabel(terrain)}
          </MenuItem>
        ))}
        {showConstraintNotice && (
          <>
            <Divider />
            <MenuItem
              disableRipple
              disableTouchRipple
              onClick={(event) => event.preventDefault()}
              sx={{
                alignItems: 'flex-start',
                cursor: 'default',
                display: 'block',
                py: 1,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.8em',
                  marginBottom: '0.35rem',
                  whiteSpace: 'normal',
                }}
              >
                {constraintNoticeText}
              </span>
              {hasSetConstraints && (
                <Button
                  size="small"
                  variant="outlined"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleIsEditMapDialogOpen(true)
                  }}
                >
                  Edit Constraints
                </Button>
              )}
            </MenuItem>
          </>
        )}
      </Select>
    </FormControl>
  )
}
