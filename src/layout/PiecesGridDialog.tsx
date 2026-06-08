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
import type { Group, Object3DEventMap } from 'three'
import useBoundStore from '../store/store'
import { DIALOGS } from './dialogNames'
import { piecesSoFar } from '../data/pieces'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { zoomToPiece } from '../utils/camera-utils'

interface PieceRow {
  id: string
  pieceName: string
  inventoryID: string
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
  const currentDialog = useBoundStore((s) => s.currentDialog)
  const toggleCurrentDialog = useBoundStore((s) => s.toggleCurrentDialog)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const fullScreen = useMediaQuery('(max-width:900px)')

  const isOpen = currentDialog === DIALOGS.viewPiecesGrid

  const handleClose = () => {
    toggleCurrentDialog('')
  }

  const handleZoomToPiece = (row: PieceRow) => {
    zoomToPiece({
      cameraControlsRef,
      boardHexes,
      targetUID: row.id,
    })
    toggleSelectedPieceID(row.id)
    handleClose()
  }

  // Build rows: one per unique board piece with its data
  const rows: PieceRow[] = boardPieces.map((bp) => {
    const piece = piecesSoFar[bp.inventoryID]
    const pieceName = piece?.title ?? 'Unknown Piece'
    return {
      id: bp.uid,
      pieceName,
      inventoryID: bp.inventoryID,
      q: bp.pieceCoords.q,
      r: bp.pieceCoords.r,
      s: bp.pieceCoords.s,
      altitude: bp.altitude,
      rotation: bp.rotation,
      count: 1, // each row is one piece instance
    }
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
    },
    {
      field: 'q',
      headerName: 'Q',
      type: 'number',
      width: 60,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'r',
      headerName: 'R',
      type: 'number',
      width: 60,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 's',
      headerName: 'S',
      type: 'number',
      width: 60,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'altitude',
      headerName: 'Altitude',
      type: 'number',
      width: 90,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'rotation',
      headerName: 'Rotation',
      type: 'number',
      width: 90,
      align: 'center',
      headerAlign: 'center',
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
