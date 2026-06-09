import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Stack,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
  Chip,
  Paper,
  useMediaQuery,
} from '@mui/material'
import type React from 'react'
import type { CameraControls } from '@react-three/drei'
import { useSnackbar } from 'notistack'
import useBoundStore from '../store/store'
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
import { hexTerrainColor } from '../world/maphex/hexColors'

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

function formatTerrainLabel(terrain: string) {
  if (!terrain) return 'Unknown'
  return terrain
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
}

function TerrainStackPreview({
  title,
  counts,
}: {
  title: string
  counts: Record<string, number>
}) {
  const tiles = Object.entries(counts)
    .flatMap(([terrain, count]) =>
      Array(Math.min(5, count))
        .fill(null)
        .map((_, i) => ({ terrain, i })),
    )
    .slice(0, 12)

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        minWidth: 180,
        background:
          'linear-gradient(140deg, rgba(255,255,255,0.9), rgba(245,248,252,0.9))',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          height: 88,
          mt: 0.5,
          overflow: 'hidden',
          borderRadius: 1,
          background:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8), rgba(235,240,248,0.85))',
        }}
      >
        {tiles.map((tile, idx) => (
          <Box
            // eslint-disable-next-line react/no-array-index-key
            key={`${tile.terrain}-${idx}`}
            sx={{
              position: 'absolute',
              width: 34,
              height: 30,
              left: 8 + ((idx * 17) % 120),
              top: 8 + Math.floor((idx * 17) / 120) * 16,
              clipPath:
                'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              bgcolor:
                hexTerrainColor[tile.terrain as keyof typeof hexTerrainColor] ||
                '#999999',
              border: '1px solid rgba(0,0,0,0.35)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </Box>
      <Stack direction="row" gap={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
        {Object.entries(counts)
          .slice(0, 4)
          .map(([terrain, count]) => (
            <Chip
              key={terrain}
              size="small"
              label={`${formatTerrainLabel(terrain)} x${count}`}
            />
          ))}
      </Stack>
    </Paper>
  )
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
  const convertTerrainForPieces = useBoundStore((s) => s.convertTerrainForPieces)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)
  const pushPendingUndoSelectionRestore = useBoundStore(
    (s) => s.pushPendingUndoSelectionRestore,
  )
  // const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([])
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [targetTerrain, setTargetTerrain] = useState('')
  const { enqueueSnackbar } = useSnackbar()
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

  const landPieceInventoryByTerrainAndSize = useMemo(() => {
    const lookup = new Map<string, Map<number, string>>()
    for (const piece of Object.values(piecesSoFar)) {
      if (!piece?.isHexTerrainPiece || !isLandTerrain(piece.terrain)) {
        continue
      }
      if (!lookup.has(piece.terrain)) {
        lookup.set(piece.terrain, new Map<number, string>())
      }
      lookup.get(piece.terrain)?.set(piece.size, piece.id)
    }
    return lookup
  }, [isLandTerrain])

  const getLandFootprintAtTopAltitude = useCallback(
    (inventoryID: string, pieceCoords: { q: number; r: number; s: number }, rotation: number) => {
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
    (inventoryID: string, pieceCoords: { q: number; r: number; s: number }, rotation: number, pieceAltitude: number) => {
      const piece = piecesSoFar[inventoryID]
      if (!piece) return false
      const footprint = getLandFootprintAtTopAltitude(inventoryID, pieceCoords, rotation)
      if (!footprint?.length) return false

      const topAltitude = pieceAltitude + 1
      const isFluidPiece = isFluidTerrainHex(piece.terrain)
      const footprintIds = new Set(
        footprint.map((coord) => genBoardHexID({ ...coord, altitude: topAltitude })),
      )

      return footprint.every((coord) => {
        return Object.values(HEX_DIRECTIONS).every((direction) => {
          const neighborCoord = hexUtilsAdd(coord, direction)
          const neighborID = genBoardHexID({ ...neighborCoord, altitude: topAltitude })

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
    (inventoryID: string, pieceCoords: { q: number; r: number; s: number }, rotation: number, pieceAltitude: number) => {
      const footprint = getLandFootprintAtTopAltitude(inventoryID, pieceCoords, rotation)
      if (!footprint?.length) return false

      const topAltitude = pieceAltitude + 1
      return footprint.every((coord) => {
        const aboveHex = boardHexes[
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
  const rows: PieceRow[] = useMemo(() => boardPieces
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
    }), [
    boardPieces,
    conflictedUIDSet,
    isBuriedForPiece,
    isLandTerrain,
    isSubterrainBuriedForPiece,
    pieceOrderByInventoryID,
  ])

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
      description: 'If this is a land tile, is it surrounded by adjacent land tiles such that you cannot see the sides of this piece',
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
      description: 'If this is a land tile, is each hex above it occupied by other land tiles such that no hexes from this piece show to the surface',
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
            fontSize: '8px'
          }}
        >
          Zoom To
        </Button>
      ),
    },
  ]

  const selectedRows = useMemo(() => {
    const selectedIds = new Set(rowSelectionModel.map(String))
    return rows.filter((row) => selectedIds.has(row.id))
  }, [rowSelectionModel, rows])

  const selectedLandRows = useMemo(
    () => selectedRows.filter((row) => row.isLandPiece),
    [selectedRows],
  )
  const selectedNonLandRows = useMemo(
    () => selectedRows.filter((row) => !row.isLandPiece),
    [selectedRows],
  )

  const selectedLandCountsByTerrain = useMemo(
    () =>
      selectedLandRows.reduce(
        (acc, row) => {
          acc[row.terrain] = (acc[row.terrain] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    [selectedLandRows],
  )

  const selectedNonLandCountsByPieceName = useMemo(
    () =>
      selectedNonLandRows.reduce(
        (acc, row) => {
          acc[row.pieceName] = (acc[row.pieceName] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    [selectedNonLandRows],
  )

  const compatibleTargetTerrains = useMemo(() => {
    if (selectedLandRows.length === 0) {
      return []
    }
    const selectedSizes = new Set(selectedLandRows.map((row) => row.pieceSize))
    return Array.from(landPieceInventoryByTerrainAndSize.entries())
      .filter(([terrain, bySize]) => {
        const supportsAllSizes = Array.from(selectedSizes).every((size) =>
          bySize.has(size),
        )
        if (!supportsAllSizes) {
          return false
        }
        const wouldChangeAtLeastOne = selectedLandRows.some((row) => {
          const targetInventoryID = bySize.get(row.pieceSize)
          return targetInventoryID && targetInventoryID !== row.inventoryID
        })
        return Boolean(wouldChangeAtLeastOne) && terrain !== ''
      })
      .map(([terrain]) => terrain)
      .sort((a, b) => formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)))
  }, [landPieceInventoryByTerrainAndSize, selectedLandRows])

  const previewTargetTerrainCounts = useMemo(() => {
    if (!targetTerrain) {
      return selectedLandCountsByTerrain
    }
    const targetBySize = landPieceInventoryByTerrainAndSize.get(targetTerrain)
    if (!targetBySize) {
      return selectedLandCountsByTerrain
    }
    return selectedLandRows.reduce((acc, row) => {
      const targetInventoryID = targetBySize.get(row.pieceSize)
      const targetPiece = targetInventoryID
        ? piecesSoFar[targetInventoryID]
        : undefined
      const terrain = targetPiece?.terrain ?? row.terrain
      acc[terrain] = (acc[terrain] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [
    landPieceInventoryByTerrainAndSize,
    selectedLandCountsByTerrain,
    selectedLandRows,
    targetTerrain,
  ])

  const openConvertDialog = () => {
    setIsConvertDialogOpen(true)
    setTargetTerrain((prev) => {
      if (prev && compatibleTargetTerrains.includes(prev)) {
        return prev
      }
      return compatibleTargetTerrains[0] ?? ''
    })
  }

  const handleConvertTerrain = () => {
    if (!targetTerrain || selectedLandRows.length === 0) {
      return
    }
    const targetBySize = landPieceInventoryByTerrainAndSize.get(targetTerrain)
    if (!targetBySize) {
      return
    }

    const mapping = selectedLandRows.reduce((acc, row) => {
      const targetInventoryID = targetBySize.get(row.pieceSize)
      if (targetInventoryID && targetInventoryID !== row.inventoryID) {
        acc[row.inventoryID] = targetInventoryID
      }
      return acc
    }, {} as Record<string, string>)

    const convertedCount = convertTerrainForPieces({
      selectedUIDs: selectedLandRows.map((row) => row.id),
      targetInventoryBySourceInventory: mapping,
    })

    setIsConvertDialogOpen(false)
    if (convertedCount > 0) {
      enqueueSnackbar({
        message: `Converted ${convertedCount} selected terrain tiles to ${formatTerrainLabel(targetTerrain)}.`,
        variant: 'success',
      })
    } else {
      enqueueSnackbar({
        message: 'No selected land tiles were changed.',
        variant: 'info',
      })
    }
  }

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
            <Button
              variant="contained"
              onClick={openConvertDialog}
              disabled={rowSelectionModel.length === 0}
              title="Change selected pieces from one terrain to another"
              sx={{ mb: 1.5 }}
            >
              Convert Terrain ({rowSelectionModel.length})
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              disabled={rowSelectionModel.length === 0}
              title="Delete the selected pieces"
              sx={{ mb: 2 }}
            >
              Delete Selected ({rowSelectionModel.length})
            </Button>
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
          </>
        )}
      </DialogContent>
      <Dialog
        open={isConvertDialogOpen}
        onClose={() => setIsConvertDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Convert Terrain</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Convert selected land tiles to another terrain while preserving piece size, rotation, altitude, and structure.
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
              <Paper variant="outlined" sx={{ p: 1.25, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Selection Findings
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Selected rows: {selectedRows.length}
                </Typography>
                <Typography variant="body2">
                  Land tiles affected: {selectedLandRows.length}
                </Typography>
                <Typography variant="body2">
                  Non-land (unchanged): {selectedNonLandRows.length}
                </Typography>
                <Stack direction="row" gap={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                  {Object.entries(selectedLandCountsByTerrain).map(
                    ([terrain, count]) => (
                      <Chip
                        key={terrain}
                        size="small"
                        label={`${formatTerrainLabel(terrain)} x${count}`}
                      />
                    ),
                  )}
                </Stack>
                <Stack direction="row" gap={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                  {Object.entries(selectedNonLandCountsByPieceName).map(
                    ([pieceName, count]) => (
                      <Chip
                        key={pieceName}
                        size="small"
                        variant="outlined"
                        label={`${pieceName} x${count}`}
                      />
                    ),
                  )}
                </Stack>
              </Paper>
              <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                <InputLabel id="convert-terrain-select-label">
                  Target Terrain
                </InputLabel>
                <Select
                  labelId="convert-terrain-select-label"
                  label="Target Terrain"
                  value={targetTerrain}
                  onChange={(event: SelectChangeEvent) =>
                    setTargetTerrain(event.target.value)
                  }
                >
                  {compatibleTargetTerrains.map((terrain) => (
                    <MenuItem key={terrain} value={terrain}>
                      {formatTerrainLabel(terrain)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              gap={1.5}
              alignItems="center"
              justifyContent="center"
              sx={{ py: 0.75 }}
            >
              <TerrainStackPreview
                title="Current Terrain Mix"
                counts={selectedLandCountsByTerrain}
              />
              <Typography variant="h4" sx={{ opacity: 0.7 }}>
                {'->'}
              </Typography>
              <TerrainStackPreview
                title="Converted Terrain Mix"
                counts={previewTargetTerrainCounts}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConvertDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConvertTerrain}
            disabled={selectedLandRows.length === 0 || !targetTerrain}
          >
            Submit Conversion
          </Button>
        </DialogActions>
      </Dialog>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
