import { Button, ButtonGroup, Tooltip, Typography } from '@mui/material'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { getPossibleRotationsForPenMode } from './getPossibleRotationsForPenMode'
import DeletePieceButton from './DeletePieceButton'

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
export function SelectedPieceControls() {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const movePiece = useBoundStore((s) => s.movePiece)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)

  const selectedBoardPieces = boardPieces.filter((bp) =>
    selectedPieceIDs.includes(bp.uid),
  )
  const firstBp = selectedBoardPieces[0]
  if (!firstBp) return null

  const isMulti = selectedBoardPieces.length > 1

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
      <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 1 }}>
        Alt: {altLabel} &nbsp; Rot: {rotLabel}
      </Typography>

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
    </>
  )
}
