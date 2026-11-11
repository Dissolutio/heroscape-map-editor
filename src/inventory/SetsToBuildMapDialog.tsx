import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { DIALOGS } from '../layout/dialogNames'
import useBoundStore from '../store/store'
import { getCollectionLandSupply } from '../utils/adaptToCollection'
import {
  DEFAULT_VISIBLE_OPTION_COUNT,
  formatSetKindTotals,
  getPiecesMissingFromCollection,
  getSetsToBuildMapCatalog,
} from '../utils/setsToBuildMap'

const SetsToBuildMapDialog = () => {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const currentDialog = useBoundStore((state) => state.currentDialog)
  const isDialogOpen = currentDialog === DIALOGS.setsToBuildMap
  const toggleCurrentDialog = useBoundStore(
    (state) => state.toggleCurrentDialog,
  )
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const userPieceInventory = useBoundStore((state) => state.userPieceInventory)
  const objectiveMarkerCount = useBoundStore(
    (state) => state.hexMap.objectiveMarkers?.length ?? 0,
  )

  const catalog = React.useMemo(
    () => (isDialogOpen ? getSetsToBuildMapCatalog(boardPieces) : undefined),
    [boardPieces, isDialogOpen],
  )
  const missingFromCollection = React.useMemo(
    () =>
      isDialogOpen
        ? getPiecesMissingFromCollection(boardPieces, userPieceInventory)
        : [],
    [boardPieces, isDialogOpen, userPieceInventory],
  )
  const collectionSupply = React.useMemo(
    () => getCollectionLandSupply(userPieceInventory),
    [userPieceInventory],
  )
  const [expandedCategories, setExpandedCategories] = React.useState<
    Record<string, boolean>
  >({})
  const handleClose = () => toggleCurrentDialog('')

  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth={!fullScreen}
    >
      <DialogTitle>Sets to build this map</DialogTitle>
      <DialogContent>
        {catalog?.categories.map((category) => {
          const expanded = expandedCategories[category.id] ?? false
          const visibleOptions = expanded
            ? category.options
            : category.options.slice(0, DEFAULT_VISIBLE_OPTION_COUNT)
          return (
            <Box
              key={category.id}
              component="section"
              aria-label={category.title}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" component="h2">
                {category.title}
              </Typography>
              {category.reason && (
                <Typography variant="body2">{category.reason}</Typography>
              )}
              {visibleOptions.map((option, index) => {
                const sets = option.sets
                  .map(
                    (set) => `${set.count}× ${set.name} (${set.abbreviation})`,
                  )
                  .join(' + ')
                const total = formatSetKindTotals(option.sets)
                return (
                  <Typography key={`${category.id}-${index}`} variant="body2">
                    {sets || 'No terrain set boxes needed'}
                    {total && ` — ${total}`}
                  </Typography>
                )
              })}
              {category.approximate && (
                <Typography variant="body2">Approximate</Typography>
              )}
              {category.options.length > DEFAULT_VISIBLE_OPTION_COUNT && (
                <Button
                  size="small"
                  onClick={() =>
                    setExpandedCategories((current) => ({
                      ...current,
                      [category.id]: !expanded,
                    }))
                  }
                >
                  {expanded
                    ? 'Show fewer'
                    : `Show ${
                        category.options.length - DEFAULT_VISIBLE_OPTION_COUNT
                      } more`}
                </Button>
              )}
            </Box>
          )
        })}
        {catalog?.notInAnySet.length ? (
          <Typography variant="body2">
            Not in any set:{' '}
            {catalog.notInAnySet
              .map((piece) => `${piece.count}× ${piece.title}`)
              .join(', ')}
          </Typography>
        ) : null}
        {catalog?.ignored.length ? (
          <Typography variant="body2" color="text.secondary">
            Not counted (generic, start zones, or glyphs):{' '}
            {catalog.ignored
              .map((piece) => `${piece.count}× ${piece.title}`)
              .join(', ')}
          </Typography>
        ) : null}
        {objectiveMarkerCount > 0 && (
          <Typography variant="body2" color="text.secondary">
            Objective markers: {objectiveMarkerCount} (not counted)
          </Typography>
        )}
        {collectionSupply.hasAnyPieces && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1">
              Missing from your inventory to build this map:
            </Typography>
            {missingFromCollection.length > 0 ? (
              missingFromCollection.map((piece) => (
                <Typography key={piece.inventoryID} variant="body2">
                  {piece.count}× {piece.title}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">
                Nothing is missing from your inventory.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default SetsToBuildMapDialog
