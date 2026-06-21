import { Box, Button, ButtonGroup, Tooltip, Typography } from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import type { RefObject } from 'react'
import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import useBoundStore from '../store/store'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { genBoardHexID, getBoardHexesRectangularMapDimensions } from '../utils/map-utils'
import { zoomToPieces } from '../utils/camera-utils'
import { getPossibleRotationsForPenMode } from './getPossibleRotationsForPenMode'
import DeletePieceButton from './DeletePieceButton'
import { ConvertTerrainQuickSelect } from './ConvertTerrainQuickSelect'

const FONT_SIZE = 8

/**
 * All controls for manipulating the currently selected piece(s):
 * - title / alt / rot readout
 * - translate (6 directions)
 * - rotate (CW / CCW)
 * - raise / lower altitude
 * - delete
 *
 * Designed to live inside SelectedPieceReadout so it floats over the 3D view.
 */
export function SelectedPieceControls({
  cameraControlsRef,
}: {
  cameraControlsRef: RefObject<CameraControls>
}) {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const conflictedPieceUIDs = useBoundStore((s) => s.conflictedPieceUIDs)
  const movePiece = useBoundStore((s) => s.movePiece)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)
  const { width: mapWidth, length: mapLength } =
    getBoardHexesRectangularMapDimensions(boardHexes)

  const selectedBoardPieces = boardPieces.filter((bp) =>
    selectedPieceIDs.includes(bp.uid),
  )
  const firstBp = selectedBoardPieces[0]
  if (!firstBp) return null

  const isMulti = selectedBoardPieces.length > 1

  // --- Status computations ---
  const conflictedUIDSet = new Set(conflictedPieceUIDs)
  const isLandTerrain = (terrain: string) =>
    isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)

  type BP = (typeof selectedBoardPieces)[number]
  const getLandFootprint = (bp: BP) => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece || !isLandTerrain(piece.terrain)) return null
    return getPieceTemplateCoords({
      clickedHex: bp.pieceCoords,
      rotation: bp.rotation,
      template: piece.template,
      isVsTile: false,
    })
  }
  const checkSubterrainBuried = (bp: BP) => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece) return false
    const footprint = getLandFootprint(bp)
    if (!footprint?.length) return false
    const topAlt = bp.altitude + 1
    const isFluid = isFluidTerrainHex(piece.terrain)
    const footprintIds = new Set(
      footprint.map((c) => genBoardHexID({ ...c, altitude: topAlt })),
    )
    return footprint.every((c) =>
      Object.values(HEX_DIRECTIONS).every((dir) => {
        const nID = genBoardHexID({ ...hexUtilsAdd(c, dir), altitude: topAlt })
        if (footprintIds.has(nID)) return true
        const nTerrain = boardHexes[nID]?.terrain ?? ''
        return isFluid ? isLandTerrain(nTerrain) : isSolidTerrainHex(nTerrain)
      }),
    )
  }
  const checkBuried = (bp: BP) => {
    const footprint = getLandFootprint(bp)
    if (!footprint?.length) return false
    const topAlt = bp.altitude + 1
    return footprint.every((c) => {
      const aboveTerrain =
        boardHexes[genBoardHexID({ ...c, altitude: topAlt + 1 })]?.terrain ?? ''
      return isLandTerrain(aboveTerrain)
    })
  }
  const pieceStatuses = selectedBoardPieces.map((bp) => ({
    isConflicted: conflictedUIDSet.has(bp.uid),
    isLandPiece: isLandTerrain(piecesSoFar[bp.inventoryID]?.terrain ?? ''),
    isSubterrainBuried: checkSubterrainBuried(bp),
    isBuried: checkBuried(bp),
  }))
  const conflictedCount = pieceStatuses.filter((s) => s.isConflicted).length
  const buriedCount = pieceStatuses.filter(
    (s) => s.isLandPiece && s.isBuried,
  ).length
  const subBuriedCount = pieceStatuses.filter(
    (s) => s.isLandPiece && s.isSubterrainBuried,
  ).length

  // --- Info readout ---
  const titleLabel = isMulti
    ? `${selectedBoardPieces.length} pieces selected`
    : (piecesSoFar[firstBp.inventoryID]?.title ?? firstBp.inventoryID)

  const tooltipLines = isMulti
    ? selectedBoardPieces
      .map(
        (bp) =>
          `${piecesSoFar[bp.inventoryID]?.title ?? bp.inventoryID}  alt:${bp.altitude + 1}  rot:${bp.rotation}`,
      )
      .join('\n')
    : ''

  const altitudes = selectedBoardPieces.map((bp) => bp.altitude + 1)
  const rotations = selectedBoardPieces.map((bp) => bp.rotation)
  const minAlt = Math.min(...altitudes)
  const maxAlt = Math.max(...altitudes)
  const altLabel = minAlt === maxAlt ? String(minAlt) : `${minAlt}–${maxAlt}`
  const rotLabel = rotations.every((r) => r === rotations[0])
    ? String(rotations[0])
    : 'mixed'

  // --- Preview helpers ---
  const previewMove = (direction: number) => {
    setPiecePreviews(
      selectedBoardPieces.map((bp) => ({
        ...bp,
        pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })),
    )
  }
  const previewRotate = (direction: 1 | -1) => {
    setPiecePreviews(
      selectedBoardPieces.map((bp) => {
        const possibleRotations = getPossibleRotationsForPenMode(bp.inventoryID)
        const currentIdx = possibleRotations.findIndex((r) => r === bp.rotation)
        const baseIdx = currentIdx === -1 ? 0 : currentIdx
        const nextIdx =
          (baseIdx + direction + possibleRotations.length) %
          possibleRotations.length
        return { ...bp, rotation: possibleRotations[nextIdx] }
      }),
    )
  }
  const previewAltitude = (delta: 1 | -1) => {
    setPiecePreviews(
      selectedBoardPieces
        .filter((bp) => bp.altitude + delta >= 0)
        .map((bp) => ({ ...bp, altitude: bp.altitude + delta })),
    )
  }
  const clearPreview = () => setPiecePreviews(null)

  // --- Action handlers ---
  const moveSelectedPiece = (direction: number) => {
    setPiecePreviews(null)
    for (const [i, bp] of selectedBoardPieces.entries()) {
      if (i === 1) useBoundStore.temporal.getState().pause()
      movePiece({
        uid: bp.uid,
        newPieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })
    }
    if (selectedBoardPieces.length > 1)
      useBoundStore.temporal.getState().resume()
    const movedPieces = selectedBoardPieces.map((bp) => ({
      ...bp,
      pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
    }))
    setPiecePreviews(
      movedPieces.map((bp) => ({
        ...bp,
        pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })),
    )
  }

  const rotateSelectedPiece = (direction: 1 | -1) => {
    setPiecePreviews(null)
    for (const [i, bp] of selectedBoardPieces.entries()) {
      if (i === 1) useBoundStore.temporal.getState().pause()
      const possibleRotations = getPossibleRotationsForPenMode(bp.inventoryID)
      const currentIdx = possibleRotations.findIndex((r) => r === bp.rotation)
      const baseIdx = currentIdx === -1 ? 0 : currentIdx
      const nextIdx =
        (baseIdx + direction + possibleRotations.length) %
        possibleRotations.length
      movePiece({
        uid: bp.uid,
        newPieceCoords: bp.pieceCoords,
        newRotation: possibleRotations[nextIdx],
      })
    }
    if (selectedBoardPieces.length > 1)
      useBoundStore.temporal.getState().resume()
    setPiecePreviews(
      selectedBoardPieces.map((bp) => {
        const possibleRotations = getPossibleRotationsForPenMode(bp.inventoryID)
        const currentIdx = possibleRotations.findIndex((r) => r === bp.rotation)
        const baseIdx = currentIdx === -1 ? 0 : currentIdx
        const nextIdx =
          (baseIdx + direction * 2 + possibleRotations.length * 2) %
          possibleRotations.length
        return { ...bp, rotation: possibleRotations[nextIdx] }
      }),
    )
  }

  const moveSelectedPieceAltitude = (delta: 1 | -1) => {
    setPiecePreviews(null)
    let maxNewAltitude = 0
    let paused = false
    for (const [i, bp] of selectedBoardPieces.entries()) {
      const newAltitude = bp.altitude + delta
      if (newAltitude < 0) continue
      if (i === 1) {
        useBoundStore.temporal.getState().pause()
        paused = true
      }
      maxNewAltitude = Math.max(maxNewAltitude, newAltitude)
      movePiece({ uid: bp.uid, newPieceCoords: bp.pieceCoords, newAltitude })
    }
    if (paused) useBoundStore.temporal.getState().resume()
    if (delta === 1 && maxNewAltitude + 1 > viewingLevel) {
      toggleViewingLevel(maxNewAltitude + 1)
    }
    const movedPieces = selectedBoardPieces
      .filter((bp) => bp.altitude + delta >= 0)
      .map((bp) => ({ ...bp, altitude: bp.altitude + delta }))
    setPiecePreviews(
      movedPieces
        .filter((bp) => bp.altitude + delta >= 0)
        .map((bp) => ({ ...bp, altitude: bp.altitude + delta })),
    )
  }

  const handleZoomToSelected = () => {
    zoomToPieces({
      cameraControlsRef,
      boardHexes,
      targetUIDs: selectedPieceIDs,
      mapWidth,
      mapLength,
    })
  }

  return (
    <>
      {/* Info readout */}
      <Tooltip
        title={
          isMulti ? (
            <span style={{ whiteSpace: 'pre-line' }}>{tooltipLines}</span>
          ) : (
            ''
          )
        }
        placement="left"
        arrow
        disableHoverListener={!isMulti}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            cursor: isMulti ? 'help' : 'default',
            mb: 0.5,
          }}
        >
          {titleLabel}
        </Typography>
      </Tooltip>
      <Typography
        sx={{
          fontSize: 10,
          color: 'text.secondary',
          mb: conflictedCount + buriedCount + subBuriedCount > 0 ? 0.25 : 1,
        }}
      >
        Alt: {altLabel} &nbsp; Rot: {rotLabel}
      </Typography>

      {/* Status indicators */}
      {(conflictedCount > 0 || buriedCount > 0 || subBuriedCount > 0) && (
        <Box sx={{ mb: 0.75 }}>
          {conflictedCount > 0 && (
            <Typography
              title="Piece collides with other pieces"
              sx={{
                fontSize: 10,
                color: 'error.main',
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {isMulti ? `${conflictedCount} conflicted` : 'Conflicted'}
            </Typography>
          )}
          {buriedCount > 0 && (
            <Typography
              title="No hexes from this piece show to the surface"
              sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}
            >
              {isMulti ? `${buriedCount} buried` : 'Buried'}
            </Typography>
          )}
          {subBuriedCount > 0 && (
            <Typography
              title="The sides of this piece do not show to the outside"
              sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}
            >
              {isMulti
                ? `${subBuriedCount} subterrain-buried`
                : 'Subterrain-buried'}
            </Typography>
          )}
        </Box>
      )}

      <Button
        size="small"
        title={`Zoom to selected terrain${selectedPieceIDs.length > 1 ? 's' : ''}`}
        onClick={handleZoomToSelected}
        sx={{ fontSize: FONT_SIZE, mt: 0.25, mb: 0.5, width: '100%' }}
      >
        {`Zoom To Selected${selectedPieceIDs.length > 1 ? ' Pieces' : ' Piece'}`}
      </Button>

      {/* Translate */}
      <ButtonGroup aria-label="Move selected piece row 1" size="small">
        <Button
          title="Move selected piece 1 hex left"
          onClick={() => moveSelectedPiece(3)}
          onMouseEnter={() => previewMove(3)}
          onMouseLeave={clearPreview}
          onFocus={() => previewMove(3)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ←
        </Button>
        <Button
          title="Move selected piece 1 hex up-left"
          onClick={() => moveSelectedPiece(4)}
          onMouseEnter={() => previewMove(4)}
          onMouseLeave={clearPreview}
          onFocus={() => previewMove(4)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↖
        </Button>
        <Button
          title="Move selected piece 1 hex up-right"
          onClick={() => moveSelectedPiece(5)}
          onMouseEnter={() => previewMove(5)}
          onMouseLeave={clearPreview}
          onFocus={() => previewMove(5)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↗
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Move selected piece row 2" size="small">
        <Button
          title="Move selected piece 1 hex right"
          onClick={() => moveSelectedPiece(0)}
          onMouseEnter={() => previewMove(0)}
          onMouseLeave={clearPreview}
          onFocus={() => previewMove(0)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          →
        </Button>
        <Button
          title="Move selected piece 1 hex down-right"
          onClick={() => moveSelectedPiece(1)}
          onMouseEnter={() => previewMove(1)}
          onMouseLeave={clearPreview}
          onFocus={() => previewMove(1)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↘
        </Button>
        <Button
          title="Move selected piece 1 hex down-left"
          onClick={() => moveSelectedPiece(2)}
          onMouseEnter={() => previewMove(2)}
          onMouseLeave={clearPreview}
          onFocus={() => previewMove(2)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↙
        </Button>
      </ButtonGroup>

      {/* Rotate */}
      <ButtonGroup
        aria-label="Rotate selected piece"
        size="small"
        sx={{ mt: 0.5 }}
      >
        <Button
          title="Rotate selected piece counter-clockwise"
          onClick={() => rotateSelectedPiece(-1)}
          onMouseEnter={() => previewRotate(-1)}
          onMouseLeave={clearPreview}
          onFocus={() => previewRotate(-1)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↺ CCW
        </Button>
        <Button
          title="Rotate selected piece clockwise"
          onClick={() => rotateSelectedPiece(1)}
          onMouseEnter={() => previewRotate(1)}
          onMouseLeave={clearPreview}
          onFocus={() => previewRotate(1)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          CW ↻
        </Button>
      </ButtonGroup>

      {/* Altitude */}
      <ButtonGroup
        aria-label="Move selected piece altitude"
        size="small"
        sx={{ mt: 0.5 }}
      >
        <Button
          title="Move selected piece up one level"
          onClick={() => moveSelectedPieceAltitude(1)}
          onMouseEnter={() => previewAltitude(1)}
          onMouseLeave={clearPreview}
          onFocus={() => previewAltitude(1)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↑ Up
        </Button>
        <Button
          title="Move selected piece down one level"
          disabled={selectedBoardPieces.every((bp) => bp.altitude <= 0)}
          onClick={() => moveSelectedPieceAltitude(-1)}
          onMouseEnter={() => previewAltitude(-1)}
          onMouseLeave={clearPreview}
          onFocus={() => previewAltitude(-1)}
          onBlur={clearPreview}
          sx={{ fontSize: FONT_SIZE }}
        >
          ↓ Down
        </Button>
      </ButtonGroup>

      {/* Delete */}
      <ButtonGroup size="small" sx={{ mt: 0.5 }}>
        <DeletePieceButton />
      </ButtonGroup>

      {/* Convert Terrain */}
      <ConvertTerrainQuickSelect pieceUIDs={selectedPieceIDs} />
    </>
  )
}
