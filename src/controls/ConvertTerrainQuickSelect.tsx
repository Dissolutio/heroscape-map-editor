import {
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  type SxProps,
  type Theme,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useCallback, useId, useMemo } from 'react'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { Pieces } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import {
  getConstrainedLandInventoryByTerrainAndSizeFromInventory,
  getEffectiveTerrainConstraintInventory,
  hasActiveTerrainConstraints,
} from '../utils/terrain-constraints'
import { hexTerrainColor, svgColors } from '../world/maphex/hexColors'

const startZoneInventoryIDs = [
  Pieces.startZone1,
  Pieces.startZone2,
  Pieces.startZone3,
  Pieces.startZone4,
  Pieces.startZone5,
  Pieces.startZone6,
  Pieces.startZone7,
  Pieces.startZone8,
]
const startZoneInventoryIDSet = new Set<string>(startZoneInventoryIDs)

function formatTerrainLabel(terrain: string) {
  console.log('🚀 ~ formatTerrainLabel ~ terrain:', terrain)
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
  const setsUsed = useBoundStore((s) => s.hexMap.setsUsed)
  const terrainConstraintSource = useBoundStore(
    (s) => s.terrainConstraintSource,
  )
  const customConstraintInventory = useBoundStore(
    (s) => s.customConstraintInventory,
  )
  const customConstraintInventoryFileName = useBoundStore(
    (s) => s.customConstraintInventoryFileName,
  )
  const userPieceInventory = useBoundStore((s) => s.userPieceInventory)
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
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
  const selectedBoardPieces = useMemo(
    () => boardPieces.filter((bp) => uidSet.has(bp.uid)),
    [boardPieces, uidSet],
  )

  const selectedLandPieces = useMemo(
    () =>
      selectedBoardPieces.flatMap((bp) => {
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
    [selectedBoardPieces, isLandTerrain],
  )

  const selectedStartZonePieces = useMemo(
    () =>
      selectedBoardPieces.filter((bp) =>
        startZoneInventoryIDSet.has(bp.inventoryID),
      ),
    [selectedBoardPieces],
  )
  const hasMixedStartZoneSelection =
    selectedStartZonePieces.length > 0 && selectedLandPieces.length > 0

  const constrainedInventory = useMemo(
    () =>
      getEffectiveTerrainConstraintInventory({
        setsUsed: setsUsed ?? [],
        terrainConstraintSource,
        customConstraintInventory,
        userPieceInventory,
      }),
    [
      customConstraintInventory,
      setsUsed,
      terrainConstraintSource,
      userPieceInventory,
    ],
  )
  const hasSetConstraints = hasActiveTerrainConstraints({
    setsUsed: setsUsed ?? [],
    terrainConstraintSource,
    customConstraintInventoryFileName,
  })
  const constrainedLandInventoryByTerrainAndSize = useMemo(
    () =>
      getConstrainedLandInventoryByTerrainAndSizeFromInventory(
        constrainedInventory,
      ),
    [constrainedInventory],
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
    !compact && (hiddenForSelectionCount > 0 || hiddenForConstraintsCount > 0)
  const constraintNoticeText =
    hiddenForSelectionCount > 0 && hiddenForConstraintsCount > 0
      ? 'Some terrain options are unavailable for the selected pieces or hidden by terrain set constraints.'
      : hiddenForSelectionCount > 0
        ? 'Some terrain options are unavailable for the selected pieces.'
        : 'Some terrain options are hidden because this map has active terrain constraints.'

  const handleChange = (event: SelectChangeEvent) => {
    const targetInventoryID = event.target.value
    console.log('🚀 ~ handleChange ~ targetInventoryID:', targetInventoryID)
    if (!targetInventoryID) return

    const isStartZoneTarget = startZoneInventoryIDSet.has(targetInventoryID)
    if (isStartZoneTarget && hasMixedStartZoneSelection) return

    let selectedUIDs: string[]
    let mapping: Record<string, string>
    if (isStartZoneTarget) {
      selectedUIDs = selectedStartZonePieces.map((piece) => piece.uid)
      mapping = Object.fromEntries(
        selectedStartZonePieces
          .filter((piece) => piece.inventoryID !== targetInventoryID)
          .map((piece) => [piece.inventoryID, targetInventoryID]),
      )
    } else {
      const targetBySize =
        landPieceInventoryByTerrainAndSize.get(targetInventoryID)
      if (!targetBySize) return
      selectedUIDs = selectedLandPieces.map((piece) => piece.id)
      mapping = selectedLandPieces.reduce(
        (acc, piece) => {
          const targetForSize = targetBySize.get(piece.pieceSize)
          if (targetForSize && targetForSize !== piece.inventoryID) {
            acc[piece.inventoryID] = targetForSize
          }
          return acc
        },
        {} as Record<string, string>,
      )
    }

    const convertedCount = convertTerrainForPieces({
      selectedUIDs,
      targetInventoryBySourceInventory: mapping,
    })

    if (convertedCount > 0) {
      const targetLabel = isStartZoneTarget
        ? piecesSoFar[targetInventoryID]?.title.replace('Start Zone: ', '')
        : formatTerrainLabel(piecesSoFar[targetInventoryID]?.terrain ?? '')
      enqueueSnackbar({
        message: isStartZoneTarget
          ? `Converted ${convertedCount} start zone${convertedCount === 1 ? '' : 's'} to ${targetLabel}.`
          : `Converted ${convertedCount} tile${convertedCount === 1 ? '' : 's'} to ${targetLabel}.`,
        variant: 'success',
      })
    } else {
      enqueueSnackbar({
        message: isStartZoneTarget
          ? 'No start zones were changed.'
          : 'No tiles were changed.',
        variant: 'info',
      })
    }
  }

  const hasAvailableLandTargets =
    selectedLandPieces.length > 0 && availableTerrains.length > 0
  const hasAvailableStartZoneTargets =
    selectedStartZonePieces.length > 0 && !hasMixedStartZoneSelection

  if (
    !alwaysRender &&
    !hasAvailableLandTargets &&
    selectedStartZonePieces.length === 0
  ) {
    return null
  }

  const isDisabled = !hasAvailableLandTargets && !hasAvailableStartZoneTargets
  const disabledMessage =
    selectedLandPieces.length === 0 && selectedStartZonePieces.length === 0
      ? 'No eligible pieces selected'
      : selectedLandPieces.length > 0 && availableTerrains.length === 0
        ? hasSetConstraints
          ? 'No constrained terrain options available'
          : 'No terrain options available'
        : 'No conversion options available'
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
      <InputLabel id={labelId} sx={{ fontSize: labelFontSize, top: labelTop }}>
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
        {selectedStartZonePieces.length > 0 && availableTerrains.length > 0 && (
          <Divider />
        )}
        {selectedStartZonePieces.length > 0 &&
          startZoneInventoryIDs.map((inventoryID) => (
            <MenuItem
              key={inventoryID}
              value={inventoryID}
              disabled={hasMixedStartZoneSelection}
              sx={{ display: 'flex', gap: 1, fontSize: menuItemFontSize }}
            >
              <span
                aria-hidden="true"
                style={{
                  backgroundColor: useLegacyStartZones
                    ? hexTerrainColor[inventoryID]
                    : svgColors[inventoryID],
                  border: '1px solid rgba(0, 0, 0, 0.25)',
                  borderRadius: useLegacyStartZones ? '50%' : 0,
                  clipPath: useLegacyStartZones
                    ? undefined
                    : 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)',
                  display: 'inline-block',
                  flex: '0 0 12px',
                  height: 12,
                  width: 12,
                }}
              />
              {piecesSoFar[inventoryID]?.title}
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
