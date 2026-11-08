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
import { useEffect, useMemo, useRef, useState } from 'react'
import { piecesSoFar } from '../data/pieces'
import { MapAuthorNotesFields } from '../layout/MapAuthorNotesFields'
import { MapNameField } from '../layout/MapNameField'
import useBoundStore from '../store/store'
import { HexTerrain } from '../types'
import { clearMapShareUrlParams } from '../utils/mapShareUrl'
import {
  analyzeMapTerrain,
  buildCollectionAdaptationPlan,
  getAdaptedMapName,
  getCollectionLandSupply,
  getMissingLandTerrains,
  getRemainingLandShortfalls,
  suggestBuriedFillTerrain,
  suggestTerrainTarget,
  type AdaptScope,
  type TerrainAdaptChoice,
  type UnconvertedLandPieceCount,
} from '../utils/adaptToCollection'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'

const formatTerrainLabel = (terrain: string) =>
  terrain
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())

type AdaptSummary = {
  changed: number
  changedByTerrain: Record<string, number>
  missingTerrains: string[]
  quantityShortfalls: { inventoryID: string; shortfall: number }[]
  unconvertedPieces: UnconvertedLandPieceCount[]
  obstacles: number
  markers: number
  startZones: number
}

const substituteRanks = ['1st', '2nd', '3rd']

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
  const hexMap = useBoundStore((state) => state.hexMap)
  const convertTerrainForPieces = useBoundStore(
    (state) => state.convertTerrainForPieces,
  )
  const { enqueueSnackbar } = useSnackbar()
  const [choices, setChoices] = useState<Record<string, TerrainAdaptChoice>>({})
  const [buriedFillByKind, setBuriedFillByKind] = useState<{
    solid: string
    fluid: string
  }>({ solid: '', fluid: '' })
  const [summary, setSummary] = useState<AdaptSummary | null>(null)
  const [step, setStep] = useState<'choices' | 'naming' | 'summary'>('choices')
  const [adaptedName, setAdaptedName] = useState('')
  const [adaptedAuthor, setAdaptedAuthor] = useState('')
  const [adaptedNotes, setAdaptedNotes] = useState('')

  const supply = useMemo(
    () => getCollectionLandSupply(userPieceInventory),
    [userPieceInventory],
  )
  const analysis = useMemo(
    () => analyzeMapTerrain(boardHexes, boardPieces),
    [boardHexes, boardPieces],
  )
  const terrains = useMemo(
    () => getMissingLandTerrains(analysis, supply),
    [analysis, supply],
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
        terrains.map((terrain) => [
          terrain,
          {
            targetTerrains: [suggestTerrainTarget(terrain, supply)],
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
    setStep('choices')
  }, [open, supply, terrains])

  const plan = useMemo(
    () =>
      buildCollectionAdaptationPlan({
        boardHexes,
        boardPieces,
        supply,
        choices,
        buriedFillByKind,
      }),
    [boardHexes, boardPieces, supply, choices, buriedFillByKind],
  )

  const optionsForTerrain = (terrain: string) => {
    const fluid = isFluidTerrainHex(terrain)
    return supply.ownedTerrains.filter((owned) =>
      fluid ? isFluidTerrainHex(owned) : isSolidTerrainHex(owned),
    )
  }

  const sharedRowsByTarget = useMemo(() => {
    const rowsByTarget = new Map<string, string[]>()
    for (const [source, choice] of Object.entries(choices)) {
      for (const target of choice.targetTerrains) {
        if (!target) continue
        const rows = rowsByTarget.get(target) ?? []
        rows.push(source)
        rowsByTarget.set(target, rows)
      }
    }
    return rowsByTarget
  }, [choices])

  const clearSummary = () => setSummary(null)

  const handleClose = () => {
    setStep('choices')
    setSummary(null)
    onClose()
  }

  const continueToNaming = () => {
    setAdaptedName(getAdaptedMapName(hexMap.name))
    setAdaptedAuthor(hexMap.author)
    setAdaptedNotes(hexMap.mapNotes ?? '')
    setStep('naming')
  }

  const handleApply = () => {
    const previous = useBoundStore.getState()
    const beforeByUID = new Map(
      boardPieces.map((piece) => [piece.uid, piece.inventoryID]),
    )
    const changed = convertTerrainForPieces({
      selectedUIDs: Object.keys(plan.mapping),
      targetInventoryBySourceInventory: {},
      targetInventoryByUID: plan.mapping,
      adaptToCollection: true,
      mapMetadata: {
        name: adaptedName,
        author: adaptedAuthor,
        ...(hexMap.mapNotes !== undefined || adaptedNotes
          ? { mapNotes: adaptedNotes }
          : {}),
      },
    })
    const current = useBoundStore.getState()
    if (
      current.hexMap !== previous.hexMap ||
      current.boardPieces !== previous.boardPieces
    ) {
      clearMapShareUrlParams()
    }
    const changedByTerrain: Record<string, number> = {}
    for (const [uid, targetID] of Object.entries(plan.mapping)) {
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
      unconvertedPieces: plan.unconvertedPieces,
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
    setStep('summary')

    const remainingCount =
      nextSummary.missingTerrains.length +
      nextSummary.quantityShortfalls.length +
      nextSummary.unconvertedPieces.length
    enqueueSnackbar({
      message: `Adapted ${changed} ${changed === 1 ? 'piece' : 'pieces'} to your collection.${
        remainingCount
          ? ` ${remainingCount} remaining terrain or quantity issue${remainingCount === 1 ? '' : 's'} are listed in the dialog.`
          : ''
      }`,
      variant: changed ? 'success' : 'info',
    })
  }

  const dialogID = 'adapt-to-collection'
  const dialogTitle =
    step === 'naming'
      ? 'Name adapted map'
      : step === 'summary'
        ? 'Adapted map to collection'
        : 'Adapt to my Collection'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      aria-labelledby={`${dialogID}-title`}
    >
      <DialogTitle id={`${dialogID}-title`}>{dialogTitle}</DialogTitle>
      <DialogContent>
        {step === 'choices' && (
          <>
            <Typography sx={{ mb: 2 }}>
              Adaptation creates a new map. Your original map stays unchanged
              until you name and confirm the adapted map. Undo restores the
              original map as one action.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Surface pieces are allocated first, in terrain-name order, then
              buried pieces. Pieces within each terrain are allocated by
              position; each swap keeps the same piece size.
            </Typography>

            <Typography variant="subtitle1">Missing land terrain</Typography>
            <Box sx={{ overflowX: 'auto', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Terrain</TableCell>
                    <TableCell align="right">Surface hexes</TableCell>
                    <TableCell align="right">Buried hexes</TableCell>
                    <TableCell>Substitutes and coverage</TableCell>
                    <TableCell>Scope</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {terrains.map((terrain) => {
                    const counts = analysis.find(
                      (row) => row.terrain === terrain,
                    )
                    const surfaceHexes = counts?.surfaceHexes ?? 0
                    const buriedHexes = counts?.buriedHexes ?? 0
                    const choice = choices[terrain] ?? {
                      targetTerrains: [''],
                      scope: 'wholeColumn' as const,
                    }
                    const coverage = plan.surfaceCoverageByTerrain[terrain] ?? [
                      0, 0, 0,
                    ]
                    const first = choice.targetTerrains[0] ?? ''
                    const second = choice.targetTerrains[1] ?? ''
                    const afterFirst = surfaceHexes - (coverage[0] ?? 0)
                    const afterSecond = afterFirst - (coverage[1] ?? 0)
                    const otherSharedRows = [
                      ...new Set(
                        choice.targetTerrains.flatMap((target) =>
                          target
                            ? (sharedRowsByTarget.get(target) ?? []).filter(
                                (source) => source !== terrain,
                              )
                            : [],
                        ),
                      ),
                    ]
                    const renderSubstitute = (
                      rank: number,
                      value: string,
                      excluded: string[],
                    ) => {
                      const rankName = substituteRanks[rank]
                      const selectID = `${dialogID}-${terrain}-${rankName}`
                      const options = optionsForTerrain(terrain).filter(
                        (candidate) => !excluded.includes(candidate),
                      )
                      const covered = coverage[rank] ?? 0
                      const coveredUnits = covered === 1 ? 'hex' : 'hexes'
                      const totalUnits = surfaceHexes === 1 ? 'hex' : 'hexes'
                      return (
                        <Box
                          key={rankName}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <FormControl
                            size="small"
                            sx={{ minWidth: 150 }}
                            disabled={!options.length}
                          >
                            <InputLabel id={`${selectID}-label`}>
                              {rankName} substitute
                            </InputLabel>
                            <Select
                              id={selectID}
                              labelId={`${selectID}-label`}
                              label={`${rankName} substitute`}
                              value={value}
                              inputProps={{
                                'aria-label': `${formatTerrainLabel(terrain)} ${rankName} substitute`,
                              }}
                              onChange={(event) => {
                                clearSummary()
                                setChoices((current) => {
                                  const currentTargets = current[terrain]
                                    ?.targetTerrains ?? ['']
                                  const targetTerrains = [...currentTargets]
                                  targetTerrains[rank] = event.target.value
                                  targetTerrains.splice(rank + 1)
                                  return {
                                    ...current,
                                    [terrain]: {
                                      ...choice,
                                      targetTerrains,
                                    },
                                  }
                                })
                              }}
                            >
                              {options.map((target) => (
                                <MenuItem key={target} value={target}>
                                  {formatTerrainLabel(target)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography variant="body2">
                            {rank === 0
                              ? `${covered} of ${surfaceHexes} surface ${totalUnits} covered`
                              : `${covered} more surface ${coveredUnits} covered`}
                          </Typography>
                        </Box>
                      )
                    }

                    return (
                      <TableRow key={terrain}>
                        <TableCell>{formatTerrainLabel(terrain)}</TableCell>
                        <TableCell align="right">{surfaceHexes}</TableCell>
                        <TableCell align="right">{buriedHexes}</TableCell>
                        <TableCell>
                          {renderSubstitute(0, first, [])}
                          {first &&
                            afterFirst > 0 &&
                            renderSubstitute(1, second, [first])}
                          {first &&
                            second &&
                            afterSecond > 0 &&
                            renderSubstitute(
                              2,
                              choice.targetTerrains[2] ?? '',
                              [first, second],
                            )}
                          {!optionsForTerrain(terrain).length && (
                            <Typography variant="body2">
                              No owned same-kind terrain is available.
                            </Typography>
                          )}
                          {otherSharedRows.length > 0 && (
                            <Typography variant="caption" display="block">
                              Shared supply with{' '}
                              {otherSharedRows
                                .map(formatTerrainLabel)
                                .join(', ')}
                              ; rows allocate in terrain-name order.
                            </Typography>
                          )}
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
                    )
                  })}
                  {!terrains.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        Your collection can already supply every land terrain in
                        this map. There is nothing to adapt.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {(['solid', 'fluid'] as const).map((kind) => {
                const options = supply.ownedTerrains.filter((terrain) =>
                  kind === 'fluid'
                    ? isFluidTerrainHex(terrain)
                    : isSolidTerrainHex(terrain),
                )
                const selectID = `${dialogID}-buried-fill-${kind}`
                return (
                  <FormControl
                    key={kind}
                    size="small"
                    sx={{ minWidth: 200 }}
                    disabled={!options.length}
                  >
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
                          {formatTerrainLabel(terrain)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )
              })}
            </Box>

            <Typography variant="body2">
              Buried fill is chosen separately for solid and fluid terrain. It
              uses only owned pieces and shares their remaining quantities with
              surface and whole-column substitutions.
            </Typography>
          </>
        )}

        {step === 'naming' && (
          <>
            <Typography sx={{ mb: 2 }}>
              Confirm the name and author for the new adapted map.
            </Typography>
            <MapNameField value={adaptedName} onChange={setAdaptedName} />
            <MapAuthorNotesFields
              authorName={adaptedAuthor}
              onAuthorNameChange={setAdaptedAuthor}
              mapNotes={adaptedNotes}
              onMapNotesChange={setAdaptedNotes}
            />
          </>
        )}

        {step === 'summary' && summary && (
          <Box component="output" aria-live="polite">
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
              Unconverted pieces:{' '}
              {summary.unconvertedPieces.length
                ? summary.unconvertedPieces
                    .map(
                      ({ terrain, size, count }) =>
                        `${formatTerrainLabel(terrain)}: ${count} × ${size}-hex pieces`,
                    )
                    .join('; ')
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
        {step === 'choices' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={continueToNaming}
              disabled={!terrains.length}
            >
              Continue to name adapted map
            </Button>
          </>
        )}
        {step === 'naming' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={!adaptedName.trim()}
            >
              Create adapted map
            </Button>
          </>
        )}
        {step === 'summary' && <Button onClick={handleClose}>Close</Button>}
      </DialogActions>
    </Dialog>
  )
}
