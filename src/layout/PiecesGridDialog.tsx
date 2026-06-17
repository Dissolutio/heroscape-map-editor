import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  useMediaQuery,
} from '@mui/material'
import type React from 'react'
import type { CameraControls } from '@react-three/drei'
import useBoundStore from '../store/store'
import { ConvertTerrainQuickSelect } from '../controls/ConvertTerrainQuickSelect'
import { DIALOGS } from './dialogNames'
import { piecesSoFar } from '../data/pieces'
import {
  DataGrid,
  GridToolbar,
  type GridColDef,
  type GridRowSelectionModel,
} from '@mui/x-data-grid'
import { zoomToPiece } from '../utils/camera-utils'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'
import { pieceGroups } from '../data/pieceGroups'
import { useCallback, useMemo, useState } from 'react'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { genBoardHexID } from '../utils/map-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'

interface PieceRow {
  id: string
  pieceName: string
  isConflicted: boolean
  isLandPiece: boolean
  isSubterrainBuried: boolean
  isBuried: boolean
  inventoryID: string
  terrain: string
  pieceSize: number
  q: number
  r: number
  s: number
  altitude: number
  rotation: number
  count: number
}

type Props = {
  cameraControlsRef: React.RefObject<CameraControls>
}

export default function PiecesGridDialog({ cameraControlsRef }: Props) {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const conflictedPieceUIDs = useBoundStore((s) => s.conflictedPieceUIDs)
  const currentDialog = useBoundStore((s) => s.currentDialog)
  const toggleCurrentDialog = useBoundStore((s) => s.toggleCurrentDialog)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)
  const pushPendingUndoSelectionRestore = useBoundStore(
    (s) => s.pushPendingUndoSelectionRestore,
  )
  // const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([])
  const fullScreen = useMediaQuery('(max-width:900px)')
  const { width: mapWidth, length: mapLength } =
    getBoardHexesRectangularMapDimensions(boardHexes)
  const isOpen = currentDialog === DIALOGS.viewPiecesGrid
  const conflictedUIDSet = new Set(conflictedPieceUIDs)

  const pieceOrderByInventoryID = new Map<string, number>()

  pieceGroups.forEach((group, groupIndex) => {
    group.pieces.forEach((pieceID, pieceIndex) => {
      pieceOrderByInventoryID.set(pieceID, groupIndex * 1000 + pieceIndex)
    })
  })

  const handleClose = useCallback(() => {
    toggleCurrentDialog('')
    setRowSelectionModel([])
  }, [toggleCurrentDialog])
  const handleZoomToPiece = useCallback(
    (row: PieceRow) => {
      zoomToPiece({
        cameraControlsRef,
        boardHexes,
        targetUID: row.id,
        mapWidth,
        mapLength,
      })
      toggleSelectedPieceID(row.id)
      handleClose()
    },
    [
      cameraControlsRef,
      boardHexes,
      mapWidth,
      mapLength,
      toggleSelectedPieceID,
      handleClose,
    ],
  )

  const isLandTerrain = useCallback((terrain: string) => {
    return isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)
  }, [])

  const getLandFootprintAtTopAltitude = useCallback(
    (
      inventoryID: string,
      pieceCoords: { q: number; r: number; s: number },
      rotation: number,
    ) => {
      const piece = piecesSoFar[inventoryID]
      if (!piece) return null
      const isLandPiece = isLandTerrain(piece.terrain)
      if (!isLandPiece) return null

      return getPieceTemplateCoords({
        clickedHex: pieceCoords,
        rotation,
        template: piece.template,
        isVsTile: false,
      })
    },
    [isLandTerrain],
  )

  const isSubterrainBuriedForPiece = useCallback(
    (
      inventoryID: string,
      pieceCoords: { q: number; r: number; s: number },
      rotation: number,
      pieceAltitude: number,
    ) => {
      const piece = piecesSoFar[inventoryID]
      if (!piece) return false
      const footprint = getLandFootprintAtTopAltitude(
        inventoryID,
        pieceCoords,
        rotation,
      )
      if (!footprint?.length) return false

      const topAltitude = pieceAltitude + 1
      const isFluidPiece = isFluidTerrainHex(piece.terrain)
      const footprintIds = new Set(
        footprint.map((coord) =>
          genBoardHexID({ ...coord, altitude: topAltitude }),
        ),
      )

      return footprint.every((coord) => {
        return Object.values(HEX_DIRECTIONS).every((direction) => {
          const neighborCoord = hexUtilsAdd(coord, direction)
          const neighborID = genBoardHexID({
            ...neighborCoord,
            altitude: topAltitude,
          })

          if (footprintIds.has(neighborID)) {
            return true
          }

          const neighborHex = boardHexes[neighborID]
          const neighborTerrain = neighborHex?.terrain ?? ''
          return isFluidPiece
            ? isLandTerrain(neighborTerrain)
            : isSolidTerrainHex(neighborTerrain)
        })
      })
    },
    [boardHexes, getLandFootprintAtTopAltitude, isLandTerrain],
  )

  const isBuriedForPiece = useCallback(
    (
      inventoryID: string,
      pieceCoords: { q: number; r: number; s: number },
      rotation: number,
      pieceAltitude: number,
    ) => {
      const footprint = getLandFootprintAtTopAltitude(
        inventoryID,
        pieceCoords,
        rotation,
      )
      if (!footprint?.length) return false

      const topAltitude = pieceAltitude + 1
      return footprint.every((coord) => {
        const aboveHex =
          boardHexes[
            genBoardHexID({
              ...coord,
              altitude: topAltitude + 1,
            })
          ]
        const aboveTerrain = aboveHex?.terrain ?? ''
        return isLandTerrain(aboveTerrain)
      })
    },
    [boardHexes, getLandFootprintAtTopAltitude, isLandTerrain],
  )

  // Build rows: one per unique board piece with its data
  const rows: PieceRow[] = useMemo(
    () =>
      boardPieces
        .map((bp) => {
          const piece = piecesSoFar[bp.inventoryID]
          const pieceName = piece?.title ?? 'Unknown Piece'
          const isLandPiece = isLandTerrain(piece?.terrain ?? '')
          return {
            id: bp.uid,
            pieceName,
            isConflicted: conflictedUIDSet.has(bp.uid),
            isLandPiece,
            isSubterrainBuried: isSubterrainBuriedForPiece(
              bp.inventoryID,
              bp.pieceCoords,
              bp.rotation,
              bp.altitude,
            ),
            isBuried: isBuriedForPiece(
              bp.inventoryID,
              bp.pieceCoords,
              bp.rotation,
              bp.altitude,
            ),
            inventoryID: bp.inventoryID,
            terrain: piece?.terrain ?? 'unknown',
            pieceSize: piece?.size ?? 0,
            q: bp.pieceCoords.q,
            r: bp.pieceCoords.r,
            s: bp.pieceCoords.s,
            altitude: bp.altitude,
            rotation: bp.rotation,
            count: 1, // each row is one piece instance
          }
        })
        .sort((a, b) => {
          if (a.isConflicted !== b.isConflicted) {
            return a.isConflicted ? -1 : 1
          }

          const aGroupOrder = pieceOrderByInventoryID.get(a.inventoryID)
          const bGroupOrder = pieceOrderByInventoryID.get(b.inventoryID)
          const aHasGroupOrder = aGroupOrder !== undefined
          const bHasGroupOrder = bGroupOrder !== undefined

          if (aHasGroupOrder && bHasGroupOrder && aGroupOrder !== bGroupOrder) {
            return aGroupOrder - bGroupOrder
          }
          if (aHasGroupOrder !== bHasGroupOrder) {
            return aHasGroupOrder ? -1 : 1
          }

          // Fallback grouping keeps same terrain and size variants adjacent.
          if (a.terrain !== b.terrain) {
            return a.terrain.localeCompare(b.terrain)
          }
          if (a.pieceSize !== b.pieceSize) {
            return a.pieceSize - b.pieceSize
          }
          if (a.pieceName !== b.pieceName) {
            return a.pieceName.localeCompare(b.pieceName)
          }
          if (a.altitude !== b.altitude) {
            return a.altitude - b.altitude
          }
          if (a.q !== b.q) {
            return a.q - b.q
          }
          if (a.r !== b.r) {
            return a.r - b.r
          }
          return a.s - b.s
        }),
    [
      boardPieces,
      conflictedUIDSet,
      isBuriedForPiece,
      isLandTerrain,
      isSubterrainBuriedForPiece,
      pieceOrderByInventoryID,
    ],
  )

  // Count pieces by type for summary
  const pieceCountsByType = boardPieces.reduce(
    (acc, bp) => {
      const piece = piecesSoFar[bp.inventoryID]
      const pieceName = piece?.title ?? 'Unknown'
      acc[pieceName] = (acc[pieceName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const columns: GridColDef<PieceRow>[] = [
    {
      field: 'pieceName',
      headerName: 'Piece Name',
      description: 'The name of this type of piece',
      width: 200,
      renderCell: (params) => (
        <Box
          component="span"
          sx={{
            color: params.row.isConflicted ? 'error.main' : 'text.secondary',
            fontWeight: params.row.isConflicted ? 700 : 400,
          }}
        >
          {params.row.pieceName}
        </Box>
      ),
    },
    {
      field: 'altitude',
      headerName: 'Altitude',
      description: 'The level this piece is on',
      type: 'number',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box component="span">{params.row.altitude + 1}</Box>
      ),
    },
    {
      field: 'isConflicted',
      headerName: 'Conflicted',
      description: 'Does this piece have errors in its placement',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box
          component="span"
          sx={{
            color: params.row.isConflicted ? 'error.main' : 'text.secondary',
            fontWeight: params.row.isConflicted ? 700 : 400,
          }}
        >
          {params.row.isConflicted ? 'Yes' : 'No'}
        </Box>
      ),
    },
    {
      field: 'isSubterrainBuried',
      headerName: 'Is Subterrain Buried',
      description:
        'If this is a land tile, is it surrounded by adjacent land tiles such that you cannot see the sides of this piece',
      width: 170,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box component="span">
          {params.row.isLandPiece
            ? params.row.isSubterrainBuried
              ? 'Yes'
              : 'No'
            : '-'}
        </Box>
      ),
    },
    {
      field: 'isBuried',
      headerName: 'Is Buried',
      description:
        'If this is a land tile, is each hex above it occupied by other land tiles such that no hexes from this piece show to the surface',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box component="span">
          {params.row.isLandPiece ? (params.row.isBuried ? 'Yes' : 'No') : '-'}
        </Box>
      ),
    },
    {
      field: 'quickConvert',
      headerName: 'Quick Convert',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          sx={{ width: '100%' }}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {params.row.isLandPiece ? (
            <ConvertTerrainQuickSelect
              pieceUIDs={[params.row.id]}
              compact
              label="Convert"
            />
          ) : (
            <Box component="span">-</Box>
          )}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          title="Move the camera over to this piece, and briefly lower the opacity of all other pieces"
          variant="outlined"
          onClick={() => handleZoomToPiece(params.row as PieceRow)}
          sx={{
            fontSize: '8px',
          }}
        >
          Zoom To
        </Button>
      ),
    },
  ]

  const handleBulkDelete = () => {
    setPiecePreviews(null)
    // Save the IDs so undo() can re-select them
    pushPendingUndoSelectionRestore(rowSelectionModel.map(String))
    // Zundo batching: let the first delete run normally so zundo records the
    // pre-batch snapshot into history, then pause so intermediate deletes are
    // not individually tracked. resume() after the loop collapses everything
    // into a single undo step.
    for (const [i, id] of rowSelectionModel.entries()) {
      if (i === 1) useBoundStore.temporal.getState().pause()
      unpaintTile(String(id))
    }
    if (rowSelectionModel.length > 1) useBoundStore.temporal.getState().resume()
    toggleSelectedPieceID('')
  }
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: fullScreen ? '100%' : '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle>
        Pieces Grid ({boardPieces.length} pieces,{' '}
        {Object.keys(pieceCountsByType).length} types)
      </DialogTitle>
      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {boardPieces.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 100, page: 0 },
                },
                filter: {
                  filterModel: {
                    items: [],
                    quickFilterExcludeHiddenColumns: true,
                  },
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(newRowSelectionModel) => {
                setRowSelectionModel(newRowSelectionModel)
              }}
              rowSelectionModel={rowSelectionModel}
              disableColumnSelector
              disableDensitySelector
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  csvOptions: { disableToolbarButton: true },
                  printOptions: { disableToolbarButton: true },
                  showQuickFilter: true,
                },
              }}
              sx={{
                flex: 1,
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
              }}
            />
            <Box
              sx={{
                mt: 1,
                mb: 1,
                px: 1.25,
                py: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                backgroundColor: 'action.hover',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1,
                  alignItems: { xs: 'stretch', sm: 'center' },
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    minWidth: { sm: 'auto' },
                    pt: { sm: 0.25 },
                  }}
                >
                  Bulk Actions
                </Typography>
                <ConvertTerrainQuickSelect
                  pieceUIDs={rowSelectionModel.map(String)}
                  label={`Convert Terrain (${rowSelectionModel.length})`}
                  prominent
                  alwaysRender
                  sx={{ flex: 1, mt: 0 }}
                />
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkDelete}
                  disabled={rowSelectionModel.length === 0}
                  title="Delete the selected pieces"
                  sx={{
                    minHeight: 44,
                    fontWeight: 600,
                    px: 2.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Delete Selected ({rowSelectionModel.length})
                </Button>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
