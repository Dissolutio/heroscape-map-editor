import { type ChangeEvent, useMemo, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Divider,
  Paper,
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
import type { PieceInventory } from '../types'

const twoColumnGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
  },
  gap: 1,
} as const

const getPieceTitle = (pieceID: string) =>
  piecesSoFar[pieceID]?.title ?? pieceID

const sumInventory = (inventory: PieceInventory) =>
  Object.values(inventory).reduce((sum, count) => sum + (count ?? 0), 0)

const InventoryForm = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { clearPieceInventory, pieceInventory, setPieceInventory } =
    useLocalPieceInventory()

  // The builder is scratch space: nothing here touches the saved inventory
  // until the user submits it.
  const [draftInventory, setDraftInventory] =
    useState<PieceInventory>(pieceInventory)
  // Set counts only tally what the builder buttons added, since sets share
  // pieces and cannot be derived back out of a flat piece inventory.
  const [draftSetCounts, setDraftSetCounts] = useState<Record<string, number>>(
    {},
  )

  const inventoryPieceIDs = useMemo(
    () =>
      Object.keys(blankPieceInventory).sort((a, b) =>
        getPieceTitle(a).localeCompare(getPieceTitle(b)),
      ),
    [],
  )

  const pieceRows = inventoryPieceIDs.map((pieceID) => ({
    ID: pieceID,
    Title: getPieceTitle(pieceID),
    Count: pieceInventory[pieceID] ?? 0,
  }))

  const totalPieces = sumInventory(pieceInventory)
  const totalDraftPieces = sumInventory(draftInventory)
  const ownedPieceIDs = inventoryPieceIDs.filter(
    (pieceID) => (pieceInventory[pieceID] ?? 0) > 0,
  )
  const isDraftDifferent = inventoryPieceIDs.some(
    (pieceID) =>
      (draftInventory[pieceID] ?? 0) !== (pieceInventory[pieceID] ?? 0),
  )

  // Group the terrain set buttons by era while keeping the shared type/date ordering.
  const contemporaryTerrainSets = useMemo(
    () => getTerrainSetsForEra('contemporary'),
    [],
  )

  const classicTerrainSets = useMemo(() => getTerrainSetsForEra('classic'), [])

  // Convert a set inventory into readable tooltip lines so users can inspect
  // exactly what will be added or removed before clicking a button.
  const getTerrainContentsText = (
    terrainSetInventory: Record<string, number>,
  ) => {
    return Object.entries(terrainSetInventory)
      .filter(([, count]) => count > 0)
      .sort(([pieceIDA], [pieceIDB]) =>
        getPieceTitle(pieceIDA).localeCompare(getPieceTitle(pieceIDB)),
      )
      .map(([pieceID, count]) => `${count}x ${getPieceTitle(pieceID)}`)
      .join('\n')
  }

  const addDraftSet = (terrainSet: TerrainSet) => {
    setDraftInventory((previous) => {
      const next: PieceInventory = { ...previous }
      for (const [pieceID, count] of Object.entries(terrainSet.inventory)) {
        next[pieceID] = (previous[pieceID] ?? 0) + (count ?? 0)
      }
      return next
    })
    setDraftSetCounts((previous) => ({
      ...previous,
      [terrainSet.id]: (previous[terrainSet.id] ?? 0) + 1,
    }))
  }

  const removeDraftSet = (terrainSet: TerrainSet) => {
    if ((draftSetCounts[terrainSet.id] ?? 0) <= 0) {
      return
    }
    setDraftInventory((previous) => {
      const next: PieceInventory = { ...previous }
      for (const [pieceID, count] of Object.entries(terrainSet.inventory)) {
        next[pieceID] = Math.max((previous[pieceID] ?? 0) - (count ?? 0), 0)
      }
      return next
    })
    setDraftSetCounts((previous) => ({
      ...previous,
      [terrainSet.id]: Math.max((previous[terrainSet.id] ?? 0) - 1, 0),
    }))
  }

  const renderTerrainSetCard = (terrainSet: TerrainSet) => {
    const tooltipText = `${terrainSet.abbreviation}\n${getTerrainContentsText(terrainSet.inventory)}`
    const setCount = draftSetCounts[terrainSet.id] ?? 0

    return (
      <Paper
        key={terrainSet.id}
        variant="outlined"
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderColor: setCount > 0 ? 'primary.main' : undefined,
        }}
      >
        <Box
          sx={{
            minWidth: 44,
            textAlign: 'center',
            color: setCount > 0 ? 'primary.main' : 'text.disabled',
          }}
        >
          <Typography variant="h5" component="div" lineHeight={1}>
            {setCount}
          </Typography>
        </Box>
        <Tooltip
          title={<Box sx={{ whiteSpace: 'pre-line' }}>{tooltipText}</Box>}
          enterDelay={250}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap title={terrainSet.name}>
              {terrainSet.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {terrainSet.abbreviation} &middot; {terrainSet.setType}
            </Typography>
          </Box>
        </Tooltip>
        <ButtonGroup size="small" variant="outlined">
          <Button
            aria-label={`Remove one ${terrainSet.name} set`}
            disabled={setCount <= 0}
            onClick={() => removeDraftSet(terrainSet)}
          >
            &minus;
          </Button>
          <Button
            aria-label={`Add one ${terrainSet.name} set`}
            onClick={() => addDraftSet(terrainSet)}
          >
            +
          </Button>
        </ButtonGroup>
      </Paper>
    )
  }

  const updateDraftPieceCount = (pieceID: string, valueRaw: string) => {
    const nextCount = Number.parseInt(valueRaw, 10)
    setDraftInventory((previous) => ({
      ...previous,
      [pieceID]: Number.isNaN(nextCount) ? 0 : Math.max(0, nextCount),
    }))
  }

  const startDraftFromBlank = () => {
    setDraftInventory(blankPieceInventory)
    setDraftSetCounts({})
  }

  const startDraftFromCurrentInventory = () => {
    setDraftInventory(pieceInventory)
    setDraftSetCounts({})
  }

  const submitDraftInventory = () => {
    setPieceInventory(draftInventory)
    enqueueSnackbar({
      message: `Saved ${totalDraftPieces} pieces as your inventory`,
      variant: 'success',
    })
  }

  const handleClearCurrentInventory = () => {
    clearPieceInventory()
    enqueueSnackbar({
      message: 'Cleared your current inventory',
      variant: 'success',
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

      setDraftInventory(inventory)
      setDraftSetCounts({})
      enqueueSnackbar({
        message: `Loaded ${file.name} into the builder below, submit it to save`,
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
        <Typography variant="h6">Your Current Inventory</Typography>
        <Typography variant="body2" color="text.secondary">
          This is the collection the app uses right now: {totalPieces} pieces
          across {ownedPieceIDs.length} piece types.
        </Typography>

        <Paper variant="outlined" sx={{ p: 1 }}>
          {ownedPieceIDs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Your inventory is empty. Build one below and submit it.
            </Typography>
          ) : (
            <Box sx={twoColumnGridSx}>
              {ownedPieceIDs.map((pieceID) => (
                <Stack
                  key={pieceID}
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2" noWrap>
                    {getPieceTitle(pieceID)}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {pieceInventory[pieceID]}
                  </Typography>
                </Stack>
              ))}
            </Box>
          )}
        </Paper>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          <Button
            variant="outlined"
            color="warning"
            onClick={handleClearCurrentInventory}
          >
            Clear Current Inventory
          </Button>
        </Stack>

        <Divider />

        <Typography variant="h6">Build a New Inventory</Typography>
        <Typography variant="body2" color="text.secondary">
          Add terrain sets and fine-tune piece counts here. Nothing changes your
          current inventory until you submit.
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={startDraftFromBlank}>
            Start Blank
          </Button>
          <Button variant="outlined" onClick={startDraftFromCurrentInventory}>
            Start From Current Inventory
          </Button>
          <Button variant="outlined" component="label">
            Load CSV or TSV
            <input
              hidden
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={handleInventoryFileImport}
            />
          </Button>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 1,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="body2">
            Builder total: <strong>{totalDraftPieces}</strong> pieces
            {isDraftDifferent ? ' (unsaved changes)' : ' (matches current)'}
          </Typography>
          <Button
            variant="contained"
            disabled={!isDraftDifferent}
            onClick={submitDraftInventory}
          >
            Submit As My Inventory
          </Button>
        </Paper>

        <Typography variant="subtitle1">Add or Remove Terrain Sets</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Contemporary
        </Typography>
        <Box sx={twoColumnGridSx}>
          {contemporaryTerrainSets.map(renderTerrainSetCard)}
        </Box>

        <Typography variant="subtitle2" color="text.secondary">
          Classic
        </Typography>
        <Box sx={twoColumnGridSx}>
          {classicTerrainSets.map(renderTerrainSetCard)}
        </Box>

        <Divider />

        <Typography variant="subtitle1">Builder Piece Counts</Typography>
        <Box sx={{ ...twoColumnGridSx, pb: 2 }}>
          {inventoryPieceIDs.map((pieceID) => (
            <TextField
              key={pieceID}
              label={getPieceTitle(pieceID)}
              type="number"
              size="small"
              value={draftInventory[pieceID] ?? 0}
              onChange={(event) =>
                updateDraftPieceCount(pieceID, event.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,
                },
              }}
              helperText={pieceID}
            />
          ))}
        </Box>
      </Container>
    </div>
  )
}

export default InventoryForm
