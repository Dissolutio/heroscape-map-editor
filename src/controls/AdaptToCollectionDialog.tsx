import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { HexTerrain } from '../types'
import {
  analyzeMapTerrain,
  buildCollectionAdaptationMapping,
  getCollectionLandSupply,
  getMissingLandTerrains,
  getRemainingLandShortfalls,
  suggestBuriedFillTerrain,
  suggestTerrainTarget,
  type AdaptScope,
  type TerrainAdaptChoice,
} from '../utils/adaptToCollection'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'

const formatTerrainLabel = (terrain: string) =>
  terrain
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())

const genericTerrain = (fluid: boolean) =>
  fluid ? HexTerrain.genericFluid : HexTerrain.generic

const isGenericTerrain = (terrain: string) =>
  terrain === HexTerrain.generic || terrain === HexTerrain.genericFluid

const labelTarget = (terrain: string) =>
  isGenericTerrain(terrain)
    ? `Generic (${terrain === HexTerrain.genericFluid ? 'fluid' : 'solid'})`
    : formatTerrainLabel(terrain)

type AdaptSummary = {
  changed: number
  changedByTerrain: Record<string, number>
  missingTerrains: string[]
  quantityShortfalls: { inventoryID: string; shortfall: number }[]
  obstacles: number
  markers: number
  startZones: number
}

export function AdaptToCollectionDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const userPieceInventory = useBoundStore((state) => state.userPieceInventory)
  const convertTerrainForPieces = useBoundStore(
    (state) => state.convertTerrainForPieces,
  )
  const { enqueueSnackbar } = useSnackbar()
  const [choices, setChoices] = useState<Record<string, TerrainAdaptChoice>>({})
  const [buriedFillByKind, setBuriedFillByKind] = useState<{
    solid: string
    fluid: string
  }>({
    solid: HexTerrain.generic,
    fluid: HexTerrain.genericFluid,
  })
  const [summary, setSummary] = useState<AdaptSummary | null>(null)

  const supply = useMemo(
    () => getCollectionLandSupply(userPieceInventory),
    [userPieceInventory],
  )
  const analysis = useMemo(
    () => analyzeMapTerrain(boardHexes, boardPieces),
    [boardHexes, boardPieces],
  )
  const terrains = useMemo(
    () => analysis.filter(({ terrain }) => !isGenericTerrain(terrain)),
    [analysis],
  )
  const hasInitializedChoices = useRef(false)

  useEffect(() => {
    if (!open) {
      hasInitializedChoices.current = false
      return
    }
    if (hasInitializedChoices.current) return
    hasInitializedChoices.current = true
    setChoices(
      Object.fromEntries(
        terrains.map(({ terrain }) => [
          terrain,
          {
            targetTerrain: suggestTerrainTarget(terrain, supply),
            scope: 'wholeColumn' as const,
          },
        ]),
      ),
    )
    setBuriedFillByKind({
      solid: suggestBuriedFillTerrain(supply, false),
      fluid: suggestBuriedFillTerrain(supply, true),
    })
    setSummary(null)
  }, [open, supply, terrains])

  const mapping = useMemo(
    () =>
      buildCollectionAdaptationMapping({
        boardHexes,
        boardPieces,
        supply,
        choices,
        buriedFillByKind,
      }),
    [boardHexes, boardPieces, supply, choices, buriedFillByKind],
  )

  const targetOptions = (terrain: string) => {
    const fluid = isFluidTerrainHex(terrain)
    return [
      ...supply.ownedTerrains.filter((owned) =>
        fluid ? isFluidTerrainHex(owned) : isSolidTerrainHex(owned),
      ),
      genericTerrain(fluid),
    ]
  }

  const handleApply = () => {
    const beforeByUID = new Map(
      boardPieces.map((piece) => [piece.uid, piece.inventoryID]),
    )
    const changed = convertTerrainForPieces({
      selectedUIDs: Object.keys(mapping),
      targetInventoryBySourceInventory: {},
      targetInventoryByUID: mapping,
      adaptToCollection: true,
    })
    const current = useBoundStore.getState()
    const changedByTerrain: Record<string, number> = {}
    for (const [uid, targetID] of Object.entries(mapping)) {
      if (beforeByUID.get(uid) === targetID) continue
      const sourceID = beforeByUID.get(uid)
      const terrain = sourceID ? piecesSoFar[sourceID]?.terrain : undefined
      if (terrain)
        changedByTerrain[terrain] = (changedByTerrain[terrain] ?? 0) + 1
    }

    const nextAnalysis = analyzeMapTerrain(
      current.boardHexes,
      current.boardPieces,
    )
    const nextSupply = getCollectionLandSupply(current.userPieceInventory)
    const untouchedPieces = current.boardPieces.map(
      (piece) => piecesSoFar[piece.inventoryID],
    )
    const nextSummary: AdaptSummary = {
      changed,
      changedByTerrain,
      missingTerrains: getMissingLandTerrains(nextAnalysis, nextSupply),
      quantityShortfalls: getRemainingLandShortfalls(
        current.boardPieces,
        current.userPieceInventory,
      ),
      obstacles: untouchedPieces.filter(
        (piece) =>
          piece?.isObstaclePiece &&
          !isSolidTerrainHex(piece.terrain) &&
          !isFluidTerrainHex(piece.terrain) &&
          piece.terrain !== HexTerrain.startZone,
      ).length,
      markers: current.hexMap.objectiveMarkers?.length ?? 0,
      startZones: untouchedPieces.filter(
        (piece) => piece?.terrain === HexTerrain.startZone,
      ).length,
    }
    setSummary(nextSummary)

    const remainingCount =
      nextSummary.missingTerrains.length + nextSummary.quantityShortfalls.length
    enqueueSnackbar({
      message: `Adapted ${changed} ${changed === 1 ? 'piece' : 'pieces'} to your collection.${
        remainingCount
          ? ` ${remainingCount} remaining terrain or quantity issue${remainingCount === 1 ? '' : 's'} are listed in the dialog.`
          : ''
      }`,
      variant: changed ? 'success' : 'info',
    })
  }

  const clearSummary = () => setSummary(null)
  const dialogID = 'adapt-to-collection'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby={`${dialogID}-title`}
    >
      <DialogTitle id={`${dialogID}-title`}>Adapt to my Collection</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          This edits the map to use land terrain in your personal inventory.
          Undo reverses the entire adaptation as one action. Obstacles, markers,
          start zones, and other non-land pieces are not changed.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          In Surface only mode, a piece with any uncovered cap is converted as a
          surface piece; a tile is never split. Heights and positions stay the
          same.
        </Typography>

        <Typography variant="subtitle1">Terrain in this map</Typography>
        <Box sx={{ overflowX: 'auto', mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Terrain</TableCell>
                <TableCell align="right">Surface hexes</TableCell>
                <TableCell align="right">Buried hexes</TableCell>
                <TableCell>You own it</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Scope</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.map(({ terrain, surfaceHexes, buriedHexes }) => {
                if (isGenericTerrain(terrain)) {
                  return (
                    <Fragment key={terrain}>
                      <TableRow>
                        <TableCell>{labelTarget(terrain)}</TableCell>
                        <TableCell align="right">{surfaceHexes}</TableCell>
                        <TableCell align="right">{buriedHexes}</TableCell>
                        <TableCell>Yes</TableCell>
                        <TableCell colSpan={2}>Not changed</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6}>
                          Generic terrain is always available and is left
                          unchanged.
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )
                }
                const choice = choices[terrain] ?? {
                  targetTerrain: suggestTerrainTarget(terrain, supply),
                  scope: 'wholeColumn' as const,
                }
                const options = targetOptions(terrain)
                const nextSurface = labelTarget(choice.targetTerrain)
                const nextBuried =
                  choice.scope === 'surfaceOnly'
                    ? labelTarget(
                        isFluidTerrainHex(terrain)
                          ? buriedFillByKind.fluid
                          : buriedFillByKind.solid,
                      )
                    : labelTarget(choice.targetTerrain)
                const labelID = `${dialogID}-${terrain}-target`
                const selectID = `${dialogID}-${terrain}-select`
                return (
                  <Fragment key={terrain}>
                    <TableRow>
                      <TableCell>{formatTerrainLabel(terrain)}</TableCell>
                      <TableCell align="right">{surfaceHexes}</TableCell>
                      <TableCell align="right">{buriedHexes}</TableCell>
                      <TableCell>
                        {supply.byTerrainAndSize.has(terrain) ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <InputLabel id={labelID}>Target</InputLabel>
                          <Select
                            id={selectID}
                            labelId={labelID}
                            label="Target"
                            value={choice.targetTerrain}
                            inputProps={{
                              'aria-label': `${formatTerrainLabel(terrain)} target terrain`,
                            }}
                            onChange={(event) => {
                              clearSummary()
                              setChoices((current) => ({
                                ...current,
                                [terrain]: {
                                  ...choice,
                                  targetTerrain: event.target.value,
                                },
                              }))
                            }}
                          >
                            {options.map((target) => (
                              <MenuItem key={target} value={target}>
                                {labelTarget(target)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <RadioGroup
                          aria-label={`${formatTerrainLabel(terrain)} scope`}
                          value={choice.scope}
                          onChange={(event) => {
                            clearSummary()
                            setChoices((current) => ({
                              ...current,
                              [terrain]: {
                                ...choice,
                                scope: event.target.value as AdaptScope,
                              },
                            }))
                          }}
                        >
                          <FormControlLabel
                            value="wholeColumn"
                            control={<Radio size="small" />}
                            label="Whole column"
                          />
                          <FormControlLabel
                            value="surfaceOnly"
                            control={<Radio size="small" />}
                            label="Surface only"
                          />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6}>
                        {`${formatTerrainLabel(terrain)}: ${surfaceHexes} surface, ${buriedHexes} buried → ${nextSurface} surface, ${nextBuried} buried`}
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })}
              {!analysis.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    This map has no convertible land terrain.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {(['solid', 'fluid'] as const).map((kind) => {
            const options = [
              ...supply.ownedTerrains.filter((terrain) =>
                kind === 'fluid'
                  ? isFluidTerrainHex(terrain)
                  : isSolidTerrainHex(terrain),
              ),
              genericTerrain(kind === 'fluid'),
            ]
            const selectID = `${dialogID}-buried-fill-${kind}`
            return (
              <FormControl key={kind} size="small" sx={{ minWidth: 200 }}>
                <InputLabel id={`${selectID}-label`}>
                  Buried fill ({kind})
                </InputLabel>
                <Select
                  id={selectID}
                  labelId={`${selectID}-label`}
                  label={`Buried fill (${kind})`}
                  value={buriedFillByKind[kind]}
                  onChange={(event) => {
                    clearSummary()
                    setBuriedFillByKind((current) => ({
                      ...current,
                      [kind]: event.target.value,
                    }))
                  }}
                >
                  {options.map((terrain) => (
                    <MenuItem key={terrain} value={terrain}>
                      {labelTarget(terrain)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )
          })}
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Buried fill is chosen separately for solid and fluid terrain so fluid
          tiles never become solid, or vice versa.
        </Typography>

        {summary && (
          <Box
            component="output"
            aria-live="polite"
            sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}
          >
            <Typography variant="subtitle1">
              Adapted {summary.changed}{' '}
              {summary.changed === 1 ? 'piece' : 'pieces'}
            </Typography>
            {Object.entries(summary.changedByTerrain).map(
              ([terrain, count]) => (
                <Typography key={terrain} variant="body2">
                  {formatTerrainLabel(terrain)}: {count} changed
                </Typography>
              ),
            )}
            <Typography variant="body2">
              Remaining missing terrains:{' '}
              {summary.missingTerrains.length
                ? summary.missingTerrains.map(formatTerrainLabel).join(', ')
                : 'none'}
            </Typography>
            <Typography variant="body2">
              Collection quantity shortfalls:{' '}
              {summary.quantityShortfalls.length
                ? summary.quantityShortfalls
                    .map(
                      ({ inventoryID, shortfall }) =>
                        `${shortfall} × ${piecesSoFar[inventoryID]?.title ?? inventoryID}`,
                    )
                    .join(', ')
                : 'none'}
            </Typography>
            <Typography variant="body2">
              Left untouched: {summary.obstacles} obstacles, {summary.markers}{' '}
              markers, {summary.startZones} start zones.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!terrains.length}
        >
          Apply adaptation
        </Button>
      </DialogActions>
    </Dialog>
  )
}
