import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  useMediaQuery,
} from '@mui/material'
import type React from 'react'
import type { CameraControls } from '@react-three/drei'
import useBoundStore from '../store/store'
import { DIALOGS } from './dialogNames'
import { piecesSoFar } from '../data/pieces'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { zoomToPiece } from '../utils/camera-utils'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'
import { pieceGroups } from '../data/pieceGroups'

interface PieceRow {
  id: string
  pieceName: string
  isConflicted: boolean
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

export default function PiecesGridDialog({
  cameraControlsRef,
}: Props) {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const conflictedPieceUIDs = useBoundStore((s) => s.conflictedPieceUIDs)
  const currentDialog = useBoundStore((s) => s.currentDialog)
  const toggleCurrentDialog = useBoundStore((s) => s.toggleCurrentDialog)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const fullScreen = useMediaQuery('(max-width:900px)')
  const { width: mapWidth, length: mapLength } = getBoardHexesRectangularMapDimensions(boardHexes)
  const isOpen = currentDialog === DIALOGS.viewPiecesGrid
  const conflictedUIDSet = new Set(conflictedPieceUIDs)

  const pieceOrderByInventoryID = new Map<string, number>()
  pieceGroups.forEach((group, groupIndex) => {
    group.pieces.forEach((pieceID, pieceIndex) => {
      pieceOrderByInventoryID.set(pieceID, groupIndex * 1000 + pieceIndex)
    })
  })

  const handleClose = () => {
    toggleCurrentDialog('')
  }

  const handleZoomToPiece = (row: PieceRow) => {
    zoomToPiece({
      cameraControlsRef,
      boardHexes,
      targetUID: row.id,
      mapWidth,
      mapLength
    })
    toggleSelectedPieceID(row.id)
    handleClose()
  }

  // Build rows: one per unique board piece with its data
  const rows: PieceRow[] = boardPieces
    .map((bp) => {
      const piece = piecesSoFar[bp.inventoryID]
      const pieceName = piece?.title ?? 'Unknown Piece'
      return {
        id: bp.uid,
        pieceName,
        isConflicted: conflictedUIDSet.has(bp.uid),
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
    })

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
      flex: 1.5,
      minWidth: 150,
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
      type: 'number',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box
          component="span"
        >
          {params.row.altitude + 1}
        </Box>
      ),
    },
    {
      field: 'isConflicted',
      headerName: 'Conflicted',
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
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleZoomToPiece(params.row as PieceRow)}
        >
          Zoom To
        </Button>
      ),
    },
  ]

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 100, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            sx={{
              flex: 1,
              '& .MuiDataGrid-root': {
                border: 'none',
              },
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
