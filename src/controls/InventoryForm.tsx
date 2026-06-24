import { type ChangeEvent, useMemo } from 'react'
import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { unparse } from 'papaparse'
import { piecesSoFar } from '../data/pieces'
import { blankPieceInventory } from '../inventory/blankInventory'
import { useLocalPieceInventory } from '../local-storage/useLocalPieceInventory'
import {
  getTerrainSetsForEra,
  type TerrainSet,
} from '../utils/terrain-set-utils.ts'
import { parsePieceInventoryFile } from '../utils/piece-inventory'

const InventoryForm = () => {
  const { enqueueSnackbar } = useSnackbar()
  const {
    addSet,
    removeSet,
    clearPieceInventory,
    pieceInventory,
    setPieceInventory,
  } = useLocalPieceInventory()

  const inventoryPieceIDs = useMemo(
    () =>
      Object.keys(blankPieceInventory).sort((a, b) => {
        const titleA = piecesSoFar[a]?.title ?? a
        const titleB = piecesSoFar[b]?.title ?? b
        return titleA.localeCompare(titleB)
      }),
    [],
  )

  const pieceRows = inventoryPieceIDs.map((pieceID) => ({
    ID: pieceID,
    Title: piecesSoFar[pieceID]?.title ?? pieceID,
    Count: pieceInventory[pieceID] ?? 0,
  }))

  const totalPieces = pieceRows.reduce((sum, row) => sum + row.Count, 0)

  // Group the terrain set buttons by era while keeping the shared type/date ordering.
  const contemporaryTerrainSets = useMemo(
    () => getTerrainSetsForEra('contemporary'),
    [],
  )

  const classicTerrainSets = useMemo(
    () => getTerrainSetsForEra('classic'),
    [],
  )

  // Convert a set inventory into readable tooltip lines so users can inspect
  // exactly what will be added or removed before clicking a button.
  const getTerrainContentsText = (terrainSetInventory: Record<string, number>) => {
    return Object.entries(terrainSetInventory)
      .filter(([, count]) => count > 0)
      .sort(([pieceIDA], [pieceIDB]) => {
        const titleA = piecesSoFar[pieceIDA]?.title ?? pieceIDA
        const titleB = piecesSoFar[pieceIDB]?.title ?? pieceIDB
        return titleA.localeCompare(titleB)
      })
      .map(([pieceID, count]) => {
        const pieceTitle = piecesSoFar[pieceID]?.title ?? pieceID
        return `${count}x ${pieceTitle}`
      })
      .join('\n')
  }

  const renderTerrainSetButtons = (terrainSet: TerrainSet) => {
    const tooltipText = `${terrainSet.abbreviation}\n${getTerrainContentsText(terrainSet.inventory)}`

    return (
      <Stack direction="row" spacing={1} key={terrainSet.id}>
        <Tooltip
          title={<Box sx={{ whiteSpace: 'pre-line' }}>{tooltipText}</Box>}
          enterDelay={250}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => addSet(terrainSet.inventory)}
            sx={{ textTransform: 'none' }}
          >
            + {terrainSet.name}
          </Button>
        </Tooltip>
        <Tooltip
          title={<Box sx={{ whiteSpace: 'pre-line' }}>{tooltipText}</Box>}
          enterDelay={250}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => removeSet(terrainSet.inventory)}
            sx={{ textTransform: 'none' }}
          >
            - {terrainSet.name}
          </Button>
        </Tooltip>
      </Stack>
    )
  }

  const updateSinglePieceCount = (pieceID: string, valueRaw: string) => {
    const nextCount = Number.parseInt(valueRaw, 10)
    setPieceInventory({
      ...pieceInventory,
      [pieceID]: Number.isNaN(nextCount) ? 0 : Math.max(0, nextCount),
    })
  }

  const handleDownloadInventory = (delimiter: ',' | '\t') => {
    const fileSuffix = delimiter === '\t' ? 'tsv' : 'csv'
    const serialized = unparse(pieceRows, {
      header: true,
      delimiter,
      newline: '\n',
    })
    const blobType =
      delimiter === '\t' ? 'text/tab-separated-values' : 'text/csv'
    const blob = new Blob([serialized], { type: `${blobType};charset=utf-8;` })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `hexoscape-piece-inventory.${fileSuffix}`
    anchor.click()
    URL.revokeObjectURL(objectUrl)
    enqueueSnackbar({
      message: `Downloaded personal inventory as .${fileSuffix.toUpperCase()}`,
      variant: 'success',
    })
  }

  const handleInventoryFileImport = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const { inventory, importedRows } = await parsePieceInventoryFile(file)

      if (importedRows === 0) {
        enqueueSnackbar({
          message: 'No valid inventory rows found in file',
          variant: 'warning',
        })
        return
      }

      setPieceInventory(inventory)
      enqueueSnackbar({
        message: `Loaded personal inventory from ${file.name}`,
        variant: 'success',
      })
    } catch (error) {
      enqueueSnackbar({
        message: `Failed to load inventory file: ${(error as Error).message}`,
        variant: 'error',
      })
    }

    event.target.value = ''
  }

  return (
    <div>
      <Container
        sx={{
          padding: 1,
          display: 'grid',
          gap: 2,
        }}
      >
        <Typography variant="h6">Personal Piece Inventory</Typography>
        <Typography variant="body2" color="text.secondary">
          Add or subtract full sets, then fine-tune individual piece counts.
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={clearPieceInventory}>
            Reset to Blank Inventory
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleDownloadInventory(',')}
          >
            Download CSV
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleDownloadInventory('\t')}
          >
            Download TSV
          </Button>
          <Button variant="contained" component="label">
            Load CSV or TSV
            <input
              hidden
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={handleInventoryFileImport}
            />
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Tracked piece types: {inventoryPieceIDs.length} | Total pieces: {totalPieces}
        </Typography>

        <Divider />

        <Typography variant="subtitle1">Add or Remove Full Terrain Sets</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Contemporary
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {contemporaryTerrainSets.map(renderTerrainSetButtons)}
        </Stack>

        <Typography variant="subtitle2" color="text.secondary">
          Classic
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {classicTerrainSets.map(renderTerrainSetButtons)}
        </Stack>

        <Divider />

        <Typography variant="subtitle1">Piece Counts</Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 1,
            pb: 2,
          }}
        >
          {inventoryPieceIDs.map((pieceID) => {
            const piece = piecesSoFar[pieceID]
            return (
              <TextField
                key={pieceID}
                label={piece?.title ?? pieceID}
                type="number"
                size="small"
                value={pieceInventory[pieceID] ?? 0}
                onChange={(event) =>
                  updateSinglePieceCount(pieceID, event.target.value)
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
                helperText={pieceID}
              />
            )
          })}
        </Box>
      </Container>
    </div>
  )
}

export default InventoryForm
