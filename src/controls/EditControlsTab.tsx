import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import type { BoardPiece } from '../types'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { FcVlc } from 'react-icons/fc'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'
import { getPossibleRotationsForPenMode } from './getPossibleRotationsForPenMode'

const shiftInDirectionBoardPieces = (
  direction: number,
  boardPieces: BoardPiece[],
) => {
  const newBoardPieces = boardPieces.map((boardPiece) => {
    const { pieceCoords } = boardPiece
    const newPieceCoords = hexUtilsAdd(pieceCoords, HEX_DIRECTIONS[direction])
    return {
      ...boardPiece,
      pieceCoords: newPieceCoords,
    }
  })
  return newBoardPieces
}
export const EditControlsTab = () => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const conflictedPieceUIDs = useBoundStore((s) => s.conflictedPieceUIDs)
  const loadMap = useBoundStore((s) => s.loadMap)
  const movePiece = useBoundStore((s) => s.movePiece)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)
  const {
    // isLargeScreenWidth,
    isSmallScreenWidth,
    isMediumScreenWidth,
  } = useMuiMediaQuery()
  // const inventory = useLocalPieceInventory()

  const selectedBoardPieces = boardPieces.filter((bp) =>
    selectedPieceIDs.includes(bp.uid),
  )
  const selectedBoardPiece = selectedBoardPieces[0]
  const selectedPiece = selectedBoardPiece
    ? piecesSoFar[selectedBoardPiece.inventoryID]
    : undefined

  // --- Preview helpers (compute what the pieces look like after an operation) ---
  const previewAllPiecesMove = (direction: number) => {
    setPiecePreviews(
      boardPieces.map((bp) => ({
        ...bp,
        pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })),
    )
  }
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

  // Zundo batching pattern used in moveSelectedPiece, rotateSelectedPiece, and
  // moveSelectedPieceAltitude: the first action (i===0) runs normally so zundo
  // records the pre-batch snapshot into history. We pause on i===1 so all
  // subsequent actions are not individually tracked, then resume() after the
  // loop. This collapses the entire multi-piece operation into a single undo step.
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
  }
  const rotateSelectedPiece = (direction: 1 | -1) => {
    setPiecePreviews(null)
    for (const [i, bp] of selectedBoardPieces.entries()) {
      if (i === 1) useBoundStore.temporal.getState().pause()
      const possibleRotations = getPossibleRotationsForPenMode(bp.inventoryID)
      const currentIdx = possibleRotations.findIndex((r) => r === bp.rotation)
      // if current rotation is somehow not in the list, snap to 0
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
  }
  const moveSelectedPieceAltitude = (delta: 1 | -1) => {
    setPiecePreviews(null)
    let maxNewAltitude = 0
    // paused tracks whether pause() was called, since pieces at altitude 0
    // are skipped and i===1 alone doesn't reliably identify the second processed piece.
    let paused = false
    for (const [i, bp] of selectedBoardPieces.entries()) {
      const newAltitude = bp.altitude + delta
      if (newAltitude < 0) continue
      if (i === 1) {
        useBoundStore.temporal.getState().pause()
        paused = true
      }
      maxNewAltitude = Math.max(maxNewAltitude, newAltitude)
      movePiece({
        uid: bp.uid,
        newPieceCoords: bp.pieceCoords,
        newAltitude,
      })
    }
    if (paused) useBoundStore.temporal.getState().resume()
    // piece top is at newAltitude + 1; raise viewing level if it would be hidden
    if (delta === 1 && maxNewAltitude + 1 > viewingLevel) {
      toggleViewingLevel(maxNewAltitude + 1)
    }
  }

  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const handleClickLogState = () => {
    console.log('🚀 ~ Controls ~ boardHexes:', boardHexes)
    console.log('🚀 ~ Controls ~ boardPieces:', boardPieces)
    console.log('🚀 ~ Controls ~ hexMap:', hexMap)
    console.log('🚀 ~ Controls ~ conflictedPieceUIDs:', conflictedPieceUIDs)
  }
  // const handleTrimMap = (boardHexesToTrim: BoardHexes): BoardHexes => {
  //   // const boardHexArr = Object.values(boardHexes)
  //   const boardHexArr = Object.values(boardHexesToTrim)
  //   const maxX = Math.max(...boardHexArr.map((bh) => bh.q - bh.s))
  //   const rightColumn = boardHexArr.filter(
  //     (bh) => bh.q - bh.s === maxX || bh.q - bh.s === maxX - 1,
  //   )
  //   const isRightSideEmpty = rightColumn.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   const leftColumn = boardHexArr.filter(
  //     (bh) => bh.s - bh.q === -1 || bh.s - bh.q === 0,
  //   )
  //   const isLeftSideEmpty = leftColumn.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   const maxY = Math.max(...boardHexArr.map((bh) => bh.r - bh.s - bh.q))
  //   const bottomRow = boardHexArr.filter(
  //     (bh) => bh.r - bh.s - bh.q === maxY || bh.r - bh.s - bh.q === maxY - 2,
  //   )
  //   const isBottomRowEmpty = bottomRow.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   const top2Rows = boardHexArr.filter(
  //     (bh) => bh.q + bh.s - bh.r === 0 || bh.q + bh.s - bh.r === -2,
  //   )
  //   const isTop2RowsEmpty = top2Rows.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   return keyBy(boardHexArr, 'id')
  // }
  const movePieces = (direction: number) => {
    const newBoardPieces = shiftInDirectionBoardPieces(direction, boardPieces)
    const newMap = buildupJsonFileMap(newBoardPieces, hexMap)
    loadMap(newMap)
    // Refresh the preview from the new positions so hovering while clicking
    // always shows the correct next-step arrow (not a zero-length one).
    setPiecePreviews(
      newBoardPieces.map((bp) => ({
        ...bp,
        pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })),
    )
  }
  const handleClickAddMapLengthX = () => {
    const newHexMap = {
      ...hexMap,
      length: hexMap.length + 1,
      width: hexMap.shape === 'hexagon' ? hexMap.width + 1 : hexMap.width,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedEastPieces = shiftInDirectionBoardPieces(0, boardPieces)
      const shiftedSouthEastPieces = shiftInDirectionBoardPieces(
        1,
        shiftedEastPieces,
      )
      const newMap = buildupJsonFileMap(shiftedSouthEastPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const handleClickRemoveMapLengthX = () => {
    const newHexMap = {
      ...hexMap,
      length: hexMap.length - 1,
      width: hexMap.shape !== 'hexagon' ? hexMap.width : hexMap.width - 1,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedWestPieces = shiftInDirectionBoardPieces(3, boardPieces)
      const shiftedNorthWestPieces = shiftInDirectionBoardPieces(
        4,
        shiftedWestPieces,
      )
      const newMap = buildupJsonFileMap(shiftedNorthWestPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const handleClickAddMapWidthY = () => {
    const newHexMap = {
      ...hexMap,
      width: hexMap.width + 1,
      length: hexMap.shape === 'hexagon' ? hexMap.length + 1 : hexMap.length,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedEastPieces = shiftInDirectionBoardPieces(0, boardPieces)
      const shiftedSouthEastPieces = shiftInDirectionBoardPieces(
        1,
        shiftedEastPieces,
      )
      const newMap = buildupJsonFileMap(shiftedSouthEastPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const handleClickRemoveMapWidthY = () => {
    const newHexMap = {
      ...hexMap,
      width: hexMap.width - 1,
      length: hexMap.shape !== 'hexagon' ? hexMap.length : hexMap.length - 1,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedWestPieces = shiftInDirectionBoardPieces(3, boardPieces)
      const shiftedNorthWestPieces = shiftInDirectionBoardPieces(
        4,
        shiftedWestPieces,
      )
      const newMap = buildupJsonFileMap(shiftedNorthWestPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const buttonFontSize = isSmallScreenWidth ? 8 : isMediumScreenWidth ? 8 : 8
  return (
    <Box sx={{ p: 0 }}>
      {/* <div style={{ padding: '0px 20px' }}>
        {isUseInventory && !Number.isNaN(remainingCount)
          ? `${remainingCount} remaining`
          : ''}
      </div> */}
      {/* <MapLensToggles /> */}
      {/* <LocalStorageList /> */}
      <List>
        {/* OPEN EDIT MAP DETAILS DIALOG */}
        <ControlTabsListItemButton
          title={
            'Edit map details (i.e. name, author, sets used, map pictures, notes)'
          }
          primary={'Edit Map Details'}
          onClick={() => toggleIsEditMapDialogOpen(true)}
          icon={<FcVlc />}
        />
      </List>

      <Card>
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 14 }}
          >
            Adjust map dimensions
          </Typography>
          <ButtonGroup
            // variant="contained"
            aria-label="Adjust map dimensions button group"
            size="small"
          >
            <Button
              size="small"
              disabled={
                (hexMap.shape === 'hexagon' &&
                  hexMap.length >= MAX_HEXAGON_MAP_DIMENSION) ||
                (hexMap.shape === 'rectangle' &&
                  hexMap.length >= MAX_RECTANGLE_MAP_DIMENSION)
              }
              title={
                hexMap.shape === 'hexagon'
                  ? 'Add one outer ring of hexes'
                  : 'Add one row of hexes to bottom'
              }
              onClick={handleClickAddMapLengthX}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              + length
            </Button>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' && hexMap.length <= 1) ||
                (hexMap.shape === 'rectangle' && hexMap.length <= 1)
              }
              title={
                hexMap.shape === 'hexagon'
                  ? 'Remove one outer ring of hexes'
                  : 'Remove one row of hexes from bottom'
              }
              onClick={handleClickRemoveMapLengthX}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              - length
            </Button>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' &&
                  hexMap.width >= MAX_HEXAGON_MAP_DIMENSION) ||
                (hexMap.shape === 'rectangle' &&
                  hexMap.width >= MAX_RECTANGLE_MAP_DIMENSION)
              }
              title="Add one column of hexes to right side"
              onClick={handleClickAddMapWidthY}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              + width
            </Button>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' && hexMap.width <= 1) ||
                (hexMap.shape === 'rectangle' && hexMap.width <= 1)
              }
              title="Remove one column of hexes from right side"
              onClick={handleClickRemoveMapWidthY}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              - width
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 14 }}
          >
            Shift all pieces in 1 direction
          </Typography>
          <ButtonGroup aria-label="Shift map button group" size="small">
            <Button
              title="Move all pieces 1 hex left"
              onClick={() => movePieces(3)}
              onMouseEnter={() => previewAllPiecesMove(3)}
              onMouseLeave={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Left
            </Button>
            <Button
              title="Move all pieces 1 hex up-left"
              onClick={() => movePieces(4)}
              onMouseEnter={() => previewAllPiecesMove(4)}
              onMouseLeave={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Up Left
            </Button>
            <Button
              title="Move all pieces 1 hex up-right"
              onClick={() => movePieces(5)}
              onMouseEnter={() => previewAllPiecesMove(5)}
              onMouseLeave={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Up Right
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button
              title="Move all pieces 1 hex right"
              onClick={() => movePieces(0)}
              onMouseEnter={() => previewAllPiecesMove(0)}
              onMouseLeave={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Right
            </Button>
            <Button
              title="Move all pieces 1 hex down-right"
              onClick={() => movePieces(1)}
              onMouseEnter={() => previewAllPiecesMove(1)}
              onMouseLeave={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Down Right
            </Button>
            <Button
              title="Move all pieces 1 hex down-left"
              onClick={() => movePieces(2)}
              onMouseEnter={() => previewAllPiecesMove(2)}
              onMouseLeave={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Down Left
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      {selectedBoardPiece && (
        <Card>
          <CardContent>
            <Typography
              gutterBottom
              sx={{ color: 'text.secondary', fontSize: 14 }}
            >
              Selected: {selectedPiece?.title ?? selectedBoardPiece.inventoryID}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>
              Altitude: {selectedBoardPiece.altitude + 1} &nbsp; Rotation:{' '}
              {selectedBoardPiece.rotation}
            </Typography>
            <ButtonGroup aria-label="Move selected piece" size="small">
              <Button
                title="Move selected piece 1 hex left"
                onClick={() => moveSelectedPiece(3)}
                onMouseEnter={() => previewMove(3)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                Left
              </Button>
              <Button
                title="Move selected piece 1 hex up-left"
                onClick={() => moveSelectedPiece(4)}
                onMouseEnter={() => previewMove(4)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                Up L
              </Button>
              <Button
                title="Move selected piece 1 hex up-right"
                onClick={() => moveSelectedPiece(5)}
                onMouseEnter={() => previewMove(5)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                Up R
              </Button>
            </ButtonGroup>
            <ButtonGroup aria-label="Move selected piece 2" size="small">
              <Button
                title="Move selected piece 1 hex right"
                onClick={() => moveSelectedPiece(0)}
                onMouseEnter={() => previewMove(0)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                Right
              </Button>
              <Button
                title="Move selected piece 1 hex down-right"
                onClick={() => moveSelectedPiece(1)}
                onMouseEnter={() => previewMove(1)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                Dn R
              </Button>
              <Button
                title="Move selected piece 1 hex down-left"
                onClick={() => moveSelectedPiece(2)}
                onMouseEnter={() => previewMove(2)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                Dn L
              </Button>
            </ButtonGroup>
            <ButtonGroup
              aria-label="Rotate selected piece"
              size="small"
              sx={{ mt: 1 }}
            >
              <Button
                title="Rotate selected piece counter-clockwise"
                onClick={() => rotateSelectedPiece(-1)}
                onMouseEnter={() => previewRotate(-1)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                ↺ CCW
              </Button>
              <Button
                title="Rotate selected piece clockwise"
                onClick={() => rotateSelectedPiece(1)}
                onMouseEnter={() => previewRotate(1)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                CW ↻
              </Button>
            </ButtonGroup>
            <ButtonGroup
              aria-label="Move selected piece altitude"
              size="small"
              sx={{ mt: 1 }}
            >
              <Button
                title="Move selected piece up one level"
                onClick={() => moveSelectedPieceAltitude(1)}
                onMouseEnter={() => previewAltitude(1)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                ↑ Up
              </Button>
              <Button
                title="Move selected piece down one level"
                disabled={selectedBoardPieces.every((bp) => bp.altitude <= 0)}
                onClick={() => moveSelectedPieceAltitude(-1)}
                onMouseEnter={() => previewAltitude(-1)}
                onMouseLeave={clearPreview}
                sx={{ fontSize: buttonFontSize }}
              >
                ↓ Down
              </Button>
            </ButtonGroup>
          </CardContent>
        </Card>
      )}

      {import.meta.env.DEV && (
        <Button onClick={handleClickLogState}>Log state</Button>
      )}
    </Box>
  )
}
