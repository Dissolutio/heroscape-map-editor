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
import { useId, useMemo } from 'react'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { hexTerrainColor, svgColors } from '../world/maphex/hexColors'
import {
  formatTerrainLabel,
  getConvertTerrainAvailability,
  startZoneInventoryIDs,
  startZoneInventoryIDSet,
} from './convertTerrainAvailability'

export function useConvertTerrainAvailability(
  selectedPieceIDs: readonly string[],
  compact = false,
) {
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

  return useMemo(
    () =>
      getConvertTerrainAvailability({
        boardPieces,
        selectedPieceIDs,
        setsUsed,
        terrainConstraintSource,
        customConstraintInventory,
        customConstraintInventoryFileName,
        userPieceInventory,
        compact,
      }),
    [
      boardPieces,
      compact,
      customConstraintInventory,
      customConstraintInventoryFileName,
      selectedPieceIDs,
      setsUsed,
      terrainConstraintSource,
      userPieceInventory,
    ],
  )
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
  onConvert,
}: {
  pieceUIDs: string[]
  label?: string
  compact?: boolean
  prominent?: boolean
  alwaysRender?: boolean
  sx?: SxProps<Theme>
  onConvert?: () => void
}) {
  const availability = useConvertTerrainAvailability(pieceUIDs, compact)
  const {
    availableTerrains,
    constraintNoticeText,
    disabledMessage,
    hasSetConstraints,
    hasMixedStartZoneSelection,
    isDisabled,
    landPieceInventoryByTerrainAndSize,
    selectedLandPieces,
    selectedStartZonePieces,
    showConstraintNotice,
    shouldRender,
  } = availability
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const toggleIsEditMapDialogOpen = useBoundStore(
    (s) => s.toggleIsEditMapDialogOpen,
  )
  const convertTerrainForPieces = useBoundStore(
    (s) => s.convertTerrainForPieces,
  )
  const { enqueueSnackbar } = useSnackbar()
  const id = useId()

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
    onConvert?.()
  }

  if (!alwaysRender && !shouldRender) return null
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
