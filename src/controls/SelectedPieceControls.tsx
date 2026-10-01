import { Box, Button, ButtonGroup, Tooltip, Typography } from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import type { RefObject } from 'react'
import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import useBoundStore from '../store/store'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { zoomToPieces } from '../utils/camera-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import {
  genBoardHexID,
  getBoardHexesRectangularMapDimensions,
} from '../utils/map-utils'
import { ConvertTerrainQuickSelect } from './ConvertTerrainQuickSelect'
import DeletePieceButton from './DeletePieceButton'
import { getPossibleRotationsForPenMode } from './getPossibleRotationsForPenMode'

const FONT_SIZE = 8

function PieceInfo({
  title,
  tooltip,
  isMulti,
  altitude,
  rotation,
  hasStatus,
}: {
  title: string
  tooltip: string
  isMulti: boolean
  altitude: string
  rotation: string
  hasStatus: boolean
}) {
  return (
    <>
      <Tooltip
        title={
          isMulti ? (
            <span style={{ whiteSpace: 'pre-line' }}>{tooltip}</span>
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
          {title}
        </Typography>
      </Tooltip>
      <Typography
        sx={{ fontSize: 10, color: 'text.secondary', mb: hasStatus ? 0.25 : 1 }}
      >
        Alt: {altitude} &nbsp; Rot: {rotation}
      </Typography>
    </>
  )
}

function PieceStatusIndicators({
  isMulti,
  conflicted,
  buried,
  partiallyBuried,
  subBuried,
}: {
  isMulti: boolean
  conflicted: number
  buried: number
  partiallyBuried: number
  subBuried: number
}) {
  if (!conflicted && !buried && !partiallyBuried && !subBuried) return null

  return (
    <Box sx={{ mb: 0.75 }}>
      {conflicted > 0 && (
        <Typography
          title="Piece collides with other pieces"
          sx={{
            fontSize: 10,
            color: 'error.main',
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {isMulti ? `${conflicted} conflicted` : 'Conflicted'}
        </Typography>
      )}
      {buried > 0 && (
        <Typography
          title="No hexes from this piece show to the surface"
          sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}
        >
          {isMulti ? `${buried} buried` : 'Buried'}
        </Typography>
      )}
      {partiallyBuried > 0 && (isMulti || buried === 0) && (
        <Typography
          title="At least one hex from this piece is covered by land above it"
          sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}
        >
          {isMulti
            ? `${partiallyBuried - buried} partially buried`
            : 'Partially buried'}
        </Typography>
      )}
      {subBuried > 0 && (
        <Typography
          title="All sides of this piece are connected to other pieces"
          sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.4 }}
        >
          {isMulti ? `${subBuried} subterrain-buried` : 'Subterrain-buried'}
        </Typography>
      )}
    </Box>
  )
}

function PieceTransformControls({
  selectedPieceIDs,
  canMoveDown,
  allHalfLevelFluid,
  onZoom,
  onMove,
  onRotate,
  onAltitude,
  onPreviewMove,
  onPreviewRotate,
  onPreviewAltitude,
  onClearPreview,
}: {
  selectedPieceIDs: string[]
  canMoveDown: boolean
  allHalfLevelFluid: boolean
  onZoom: () => void
  onMove: (direction: number) => void
  onRotate: (direction: 1 | -1) => void
  onAltitude: (delta: number) => void
  onPreviewMove: (direction: number) => void
  onPreviewRotate: (direction: 1 | -1) => void
  onPreviewAltitude: (delta: number) => void
  onClearPreview: () => void
}) {
  const moveButton = (direction: number, title: string, label: string) => (
    <Button
      key={direction}
      title={title}
      onClick={() => onMove(direction)}
      onMouseEnter={() => onPreviewMove(direction)}
      onMouseLeave={onClearPreview}
      onFocus={() => onPreviewMove(direction)}
      onBlur={onClearPreview}
      sx={{ fontSize: FONT_SIZE }}
    >
      {label}
    </Button>
  )
  const rotateButton = (direction: 1 | -1, title: string, label: string) => (
    <Button
      key={direction}
      title={title}
      onClick={() => onRotate(direction)}
      onMouseEnter={() => onPreviewRotate(direction)}
      onMouseLeave={onClearPreview}
      onFocus={() => onPreviewRotate(direction)}
      onBlur={onClearPreview}
      sx={{ fontSize: FONT_SIZE }}
    >
      {label}
    </Button>
  )
  const altitudeButton = (delta: number, title: string, label: string) => (
    <Button
      key={delta}
      title={title}
      disabled={delta < 0 && !canMoveDown}
      onClick={() => onAltitude(delta)}
      onMouseEnter={() => onPreviewAltitude(delta)}
      onMouseLeave={onClearPreview}
      onFocus={() => onPreviewAltitude(delta)}
      onBlur={onClearPreview}
      sx={{ fontSize: FONT_SIZE }}
    >
      {label}
    </Button>
  )

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        title={`Zoom to selected terrain${selectedPieceIDs.length > 1 ? 's' : ''}`}
        onClick={onZoom}
        sx={{ fontSize: FONT_SIZE, mt: 0.25, mb: 0.5, width: '100%' }}
      >
        {`Zoom To Selected${selectedPieceIDs.length > 1 ? ' Pieces' : ' Piece'}`}
      </Button>
      <ButtonGroup aria-label="Move selected piece row 1" size="small">
        {moveButton(3, 'Move selected piece 1 hex left', '←')}
        {moveButton(4, 'Move selected piece 1 hex up-left', '↖')}
        {moveButton(5, 'Move selected piece 1 hex up-right', '↗')}
      </ButtonGroup>
      <ButtonGroup aria-label="Move selected piece row 2" size="small">
        {moveButton(0, 'Move selected piece 1 hex right', '→')}
        {moveButton(1, 'Move selected piece 1 hex down-right', '↘')}
        {moveButton(2, 'Move selected piece 1 hex down-left', '↙')}
      </ButtonGroup>
      <ButtonGroup
        aria-label="Rotate selected piece"
        size="small"
        sx={{ mt: 0.5 }}
      >
        {rotateButton(-1, 'Rotate selected piece counter-clockwise', '↺ CCW')}
        {rotateButton(1, 'Rotate selected piece clockwise', 'CW ↻')}
      </ButtonGroup>
      <ButtonGroup
        aria-label="Move selected piece altitude"
        size="small"
        sx={{ mt: 0.5 }}
      >
        {altitudeButton(1, 'Move selected piece up one level', '↑ Up')}
        {altitudeButton(-1, 'Move selected piece down one level', '↓ Down')}
      </ButtonGroup>
      {allHalfLevelFluid && (
        <ButtonGroup
          aria-label="Move selected piece half-level"
          size="small"
          sx={{ mt: 0.5 }}
        >
          {altitudeButton(0.5, 'Move selected piece up half a level', '↑ Up ½')}
          {altitudeButton(
            -0.5,
            'Move selected piece down half a level',
            '↓ Down ½',
          )}
        </ButtonGroup>
      )}
      <ButtonGroup size="small" sx={{ mt: 0.5 }}>
        <DeletePieceButton />
      </ButtonGroup>
      <ConvertTerrainQuickSelect pieceUIDs={selectedPieceIDs} />
    </>
  )
}

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
  // The real surface altitude a piece was written at (only ever bp.altitude + 0.5 for a
  // stacked fluid, or + 1 otherwise) - found by checking which candidate hex it actually owns.
  const getSurfaceAltitude = (bp: BP): number | null => {
    const footprint = getLandFootprint(bp)
    if (!footprint?.length) return null
    const origin = footprint[0]
    for (const candidate of [bp.altitude + 0.5, bp.altitude + 1]) {
      const hex = boardHexes[genBoardHexID({ ...origin, altitude: candidate })]
      if (hex?.boardPieceUID === bp.uid) return candidate
    }
    return null
  }
  const isHalfLevelFluidPiece = (bp: BP) => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece || !isFluidTerrainHex(piece.terrain)) return false
    const surfaceAltitude = getSurfaceAltitude(bp)
    return surfaceAltitude !== null && !Number.isInteger(surfaceAltitude)
  }
  // Only offer the half-level nudge when every selected piece is itself a half-level fluid
  // tile (a fluid stacked on another fluid) - not encouraged for regular fluid/land pieces.
  const allHalfLevelFluid = selectedBoardPieces.every(isHalfLevelFluidPiece)
  const checkSubterrainBuried = (bp: BP) => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece) return false
    const footprint = getLandFootprint(bp)
    if (!footprint?.length) return false
    const topAlt = getSurfaceAltitude(bp) ?? bp.altitude + 1
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
    const topAlt = getSurfaceAltitude(bp) ?? bp.altitude + 1
    const aboveAlt = Number.isInteger(topAlt) ? topAlt + 1 : topAlt + 0.5
    return footprint.every((c) => {
      const aboveTerrain =
        boardHexes[genBoardHexID({ ...c, altitude: aboveAlt })]?.terrain ?? ''
      return isLandTerrain(aboveTerrain)
    })
  }
  const checkPartiallyBuried = (bp: BP) => {
    const footprint = getLandFootprint(bp)
    if (!footprint?.length) return false
    const topAlt = getSurfaceAltitude(bp) ?? bp.altitude + 1
    const aboveAlt = Number.isInteger(topAlt) ? topAlt + 1 : topAlt + 0.5
    return footprint.some((c) => {
      const aboveTerrain =
        boardHexes[genBoardHexID({ ...c, altitude: aboveAlt })]?.terrain ?? ''
      return isLandTerrain(aboveTerrain)
    })
  }
  const pieceStatuses = selectedBoardPieces.map((bp) => ({
    isConflicted: conflictedUIDSet.has(bp.uid),
    isLandPiece: isLandTerrain(piecesSoFar[bp.inventoryID]?.terrain ?? ''),
    isSubterrainBuried: checkSubterrainBuried(bp),
    isBuried: checkBuried(bp),
    isPartiallyBuried: checkPartiallyBuried(bp),
  }))
  const conflictedCount = pieceStatuses.filter((s) => s.isConflicted).length
  const buriedCount = pieceStatuses.filter(
    (s) => s.isLandPiece && s.isBuried,
  ).length
  const partiallyBuriedCount = pieceStatuses.filter(
    (s) => s.isLandPiece && s.isPartiallyBuried,
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
            `${piecesSoFar[bp.inventoryID]?.title ?? bp.inventoryID}  alt:${getSurfaceAltitude(bp) ?? bp.altitude + 1}  rot:${bp.rotation}`,
        )
        .join('\n')
    : ''

  const altitudes = selectedBoardPieces.map(
    (bp) => getSurfaceAltitude(bp) ?? bp.altitude + 1,
  )
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
  const previewAltitude = (delta: number) => {
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

  const moveSelectedPieceAltitude = (delta: number) => {
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
    if (delta > 0 && maxNewAltitude + 1 > viewingLevel) {
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
      <PieceInfo
        title={titleLabel}
        tooltip={tooltipLines}
        isMulti={isMulti}
        altitude={altLabel}
        rotation={rotLabel}
        hasStatus={Boolean(
          conflictedCount ||
            buriedCount ||
            partiallyBuriedCount ||
            subBuriedCount,
        )}
      />
      <PieceStatusIndicators
        isMulti={isMulti}
        conflicted={conflictedCount}
        buried={buriedCount}
        partiallyBuried={partiallyBuriedCount}
        subBuried={subBuriedCount}
      />
      <PieceTransformControls
        selectedPieceIDs={selectedPieceIDs}
        canMoveDown={selectedBoardPieces.some((bp) => bp.altitude > 0)}
        allHalfLevelFluid={allHalfLevelFluid}
        onZoom={handleZoomToSelected}
        onMove={moveSelectedPiece}
        onRotate={rotateSelectedPiece}
        onAltitude={moveSelectedPieceAltitude}
        onPreviewMove={previewMove}
        onPreviewRotate={previewRotate}
        onPreviewAltitude={previewAltitude}
        onClearPreview={clearPreview}
      />
    </>
  )
}
