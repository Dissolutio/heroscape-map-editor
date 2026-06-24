import {
  Alert,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
  type IconButtonProps,
  Typography,
} from '@mui/material'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import * as React from 'react'
import { styled } from '@mui/material/styles'
import Card from '@mui/material/Card'
import { useSnackbar } from 'notistack'
import useBoundStore from '../store/store'
import { FcExpand } from 'react-icons/fc'
import { countStringInArrayLoop, getSetsUsedText } from '../utils/map-utils'
import { getTerrainSetsForEra } from '../utils/terrain-set-utils.ts'
import type { TerrainConstraintSource } from '../types'
import { parsePieceInventoryFile } from '../utils/piece-inventory'

export const setsUsedInputNameForFormData = 'terrainSet'
type Props = {
  isCreateNewMap?: boolean
}
export function InputSetsUsedCard({ isCreateNewMap }: Props) {
  const hexMap = useBoundStore((state) => state.hexMap)
  const setsUsed = hexMap?.setsUsed ?? []
  const setsUsedText = getSetsUsedText(hexMap?.setsUsed ?? [])
  const terrainConstraintSource = useBoundStore(
    (state) => state.terrainConstraintSource,
  )
  const customConstraintInventoryFileName = useBoundStore(
    (state) => state.customConstraintInventoryFileName,
  )
  const updateTerrainConstraintSource = useBoundStore(
    (state) => state.updateTerrainConstraintSource,
  )
  const updateCustomConstraintInventory = useBoundStore(
    (state) => state.updateCustomConstraintInventory,
  )
  const syncTerrainConstraintPenMode = useBoundStore(
    (state) => state.syncTerrainConstraintPenMode,
  )
  const [isSetUsedOpen, setIsSetUsedOpen] = React.useState(false)
  const { enqueueSnackbar } = useSnackbar()
  // Reuse the shared terrain set ordering so this dialog stays in sync with
  // the inventory screen.
  const contemporaryTerrainSets = React.useMemo(
    () => getTerrainSetsForEra('contemporary'),
    [],
  )
  const classicTerrainSets = React.useMemo(
    () => getTerrainSetsForEra('classic'),
    [],
  )
  const toggleIsSetsUsedOpen = () => {
    setIsSetUsedOpen(!isSetUsedOpen)
  }
  const handleChangeConstraintSource = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextSource = event.target.value as TerrainConstraintSource
    updateTerrainConstraintSource(nextSource)
    syncTerrainConstraintPenMode()
  }

  const handleConstraintInventoryFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
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

      updateCustomConstraintInventory({
        inventory,
        fileName: file.name,
      })
      updateTerrainConstraintSource('inventoryFile')
      syncTerrainConstraintPenMode()
      enqueueSnackbar({
        message: `Loaded terrain constraints from ${file.name}`,
        variant: 'success',
      })
    } catch (error) {
      enqueueSnackbar({
        message: `Failed to load terrain constraint file: ${(error as Error).message}`,
        variant: 'error',
      })
    }

    event.target.value = ''
  }

  const officialSetSourceActive = terrainConstraintSource === 'setsUsed'
  const constraintSummaryText =
    terrainConstraintSource === 'personalInventory'
      ? 'Personal inventory constraints active'
      : terrainConstraintSource === 'inventoryFile'
        ? customConstraintInventoryFileName
          ? `Constraint inventory: ${customConstraintInventoryFileName}`
          : 'Constraint inventory file not loaded'
        : setsUsedText
  // const { isSmallScreenWidth, isMediumScreenWidth } = useMuiMediaQuery()
  // const fontSizeHeaderMapName =
  //   isSmallScreenWidth && setsUsedText > 32
  //     ? '0.6em'
  //     : isSmallScreenWidth
  //       ? '0.9em'
  //       : hexMap.name.length > 32
  //         ? '0.8em'
  //         : '1em'

  return (
    <Card
      sx={{
        backgroundColor: 'transparent',
        border: '1px solid var(--sub-white)',
      }}
    >
      <CardContent sx={{ backgroundColor: 'transparent' }}>
        <Button onClick={toggleIsSetsUsedOpen}>
          {setsUsedText
            ? 'Edit terrain set constraints:'
            : 'Add terrain set constraints:'}
        </Button>
        {!isCreateNewMap && (
          <Typography
            variant="subtitle1"
            component="span"
            title="Terrain constraints for this map"
            noWrap
            sx={{
              flexGrow: 1,
              textAlign: 'left',
              // fontSize: `calc(${fontSizeHeaderMapName} * 0.7)`,
              color: 'var(--sub-white)',
              px: 2,
              overflow: 'hidden',
              maxHeight: 68,
            }}
          >
            {constraintSummaryText}
          </Typography>
        )}
        <Collapse in={isSetUsedOpen} timeout="auto">
          <FormControl sx={{ mt: 1 }}>
            <FormLabel>Constraint Source</FormLabel>
            <RadioGroup
              value={terrainConstraintSource}
              onChange={handleChangeConstraintSource}
            >
              <FormControlLabel
                value="none"
                control={<Radio />}
                label="No terrain constraints"
              />
              <FormControlLabel
                value="setsUsed"
                control={<Radio />}
                label="Use official terrain sets"
              />
              <FormControlLabel
                value="personalInventory"
                control={<Radio />}
                label="Use my personal inventory"
              />
              <FormControlLabel
                value="inventoryFile"
                control={<Radio />}
                label="Use an inventory file (.csv or .tsv)"
              />
            </RadioGroup>
          </FormControl>

          {terrainConstraintSource === 'personalInventory' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Terrain limits will follow your saved personal inventory and will
              not be added to the map&apos;s official set list.
            </Alert>
          )}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Button variant="outlined" component="label">
              Load Constraint Inventory
              <input
                hidden
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                onChange={handleConstraintInventoryFileImport}
              />
            </Button>
            {customConstraintInventoryFileName ? (
              <Typography variant="body2" color="text.secondary">
                {customConstraintInventoryFileName}
              </Typography>
            ) : null}
          </Stack>

          {terrainConstraintSource === 'inventoryFile' &&
            !customConstraintInventoryFileName && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Load a `.csv` or `.tsv` inventory file to activate file-based
                terrain constraints.
              </Alert>
            )}

          {!officialSetSourceActive && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Official terrain set counts are ignored while inventory-based
              constraints are active.
            </Alert>
          )}

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Contemporary
          </Typography>
          {contemporaryTerrainSets.map((set) => (
            <TextField
              key={set.id}
              variant="outlined"
              margin="dense"
              defaultValue={
                isCreateNewMap ? 0 : countStringInArrayLoop(setsUsed, set.id)
              }
              slotProps={{
                htmlInput: { min: 0 },
              }}
              color={
                !isCreateNewMap && countStringInArrayLoop(setsUsed, set.id) > 0
                  ? 'success'
                  : undefined
              }
              focused
              disabled={!officialSetSourceActive}
              name={`${setsUsedInputNameForFormData}${set.id}`}
              label={`${set.name} - ${set.abbreviation}`}
              title={`${set.name} - ${set.abbreviation}`}
              type="number"
            />
          ))}

          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Classic
          </Typography>
          {classicTerrainSets.map((set) => (
            <TextField
              key={set.id}
              variant="outlined"
              margin="dense"
              defaultValue={
                isCreateNewMap ? 0 : countStringInArrayLoop(setsUsed, set.id)
              }
              slotProps={{
                htmlInput: { min: 0 },
              }}
              color={
                !isCreateNewMap && countStringInArrayLoop(setsUsed, set.id) > 0
                  ? 'success'
                  : undefined
              }
              focused
              disabled={!officialSetSourceActive}
              name={`${setsUsedInputNameForFormData}${set.id}`}
              label={`${set.name} - ${set.abbreviation}`}
              title={`${set.name} - ${set.abbreviation}`}
              type="number"
            />
          ))}
        </Collapse>
      </CardContent>
      <CardActions disableSpacing>
        <ExpandMore
          expand={isSetUsedOpen}
          onClick={toggleIsSetsUsedOpen}
          aria-expanded={isSetUsedOpen}
          aria-label="show more"
        >
          <FcExpand />
        </ExpandMore>
      </CardActions>
    </Card>
  )
}

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean
}

export const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props
  return <IconButton {...other} />
})(({ theme }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: ({ expand }) => !expand,
      style: {
        transform: 'rotate(0deg)',
      },
    },
    {
      props: ({ expand }) => !!expand,
      style: {
        transform: 'rotate(180deg)',
      },
    },
  ],
}))
