import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import {
  DEFAULT_LOOK_SETTINGS,
  LOOK_SETTING_RANGES,
  type ToneMapping,
} from '../data/lookSettings'
import useBoundStore from '../store/store'

const numericSettings = [
  ['exposure', 'Exposure'],
  ['ambientIntensity', 'Ambient intensity'],
  ['hemisphereIntensity', 'Hemisphere intensity'],
  ['pointLightIntensity', 'Point light intensity'],
  ['shine', 'Shine'],
] as const

const colorSettings = [
  ['lightColor', 'Light color'],
  ['backgroundColor', 'Background color'],
  ['tableColor', 'Table color'],
] as const

export default function LookSettingsDialog() {
  const isOpen = useBoundStore((state) => state.isLookSettingsDialogOpen)
  const setIsOpen = useBoundStore((state) => state.setIsLookSettingsDialogOpen)
  const lookSettings = useBoundStore((state) => state.lookSettings)
  const setLookSettings = useBoundStore((state) => state.setLookSettings)
  const { enqueueSnackbar } = useSnackbar()

  if (!isOpen) return null

  const copySettings = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(lookSettings, null, 2))
      enqueueSnackbar('3D look settings copied', { variant: 'success' })
    } catch {
      enqueueSnackbar('Could not copy 3D look settings', { variant: 'error' })
    }
  }

  return (
    <Paper
      component="dialog"
      open
      aria-label="3D look settings"
      elevation={8}
      sx={{
        position: 'absolute',
        zIndex: 5,
        top: 12,
        right: 12,
        m: 0,
        width: 'min(360px, calc(100% - 24px))',
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
        p: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">3D look</Typography>
          <Button
            size="small"
            aria-label="Close 3D look settings"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </Box>
        <FormControl size="small" fullWidth>
          <InputLabel id="look-tone-mapping-label">Tone mapping</InputLabel>
          <Select
            labelId="look-tone-mapping-label"
            label="Tone mapping"
            value={lookSettings.toneMapping}
            onChange={(event) =>
              setLookSettings({
                toneMapping: event.target.value as ToneMapping,
              })
            }
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="neutral">Neutral</MenuItem>
            <MenuItem value="aces">ACES Filmic</MenuItem>
            <MenuItem value="agx">AgX</MenuItem>
          </Select>
        </FormControl>
        {numericSettings.map(([key, label]) => {
          const range = LOOK_SETTING_RANGES[key]
          const value = lookSettings[key]
          return (
            <Box key={key}>
              <Typography id={`look-${key}-label`} variant="body2">
                {label}: {Number(value.toFixed(2))}
              </Typography>
              <Slider
                aria-label={label}
                value={value}
                min={range.min}
                max={range.max}
                step={range.step}
                onChange={(_, nextValue) =>
                  setLookSettings({ [key]: nextValue as number })
                }
              />
            </Box>
          )
        })}
        {colorSettings.map(([key, label]) => (
          <TextField
            key={key}
            label={label}
            type="color"
            size="small"
            value={lookSettings[key]}
            onChange={(event) => setLookSettings({ [key]: event.target.value })}
            slotProps={{ htmlInput: { 'aria-label': label } }}
          />
        ))}
        <Tooltip
          describeChild
          title="Takes the picture with no background so you can drop the map onto your own artwork."
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={lookSettings.transparentPictureBackground}
                onChange={(event) =>
                  setLookSettings({
                    transparentPictureBackground: event.target.checked,
                  })
                }
              />
            }
            label="Transparent background"
          />
        </Tooltip>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setLookSettings(DEFAULT_LOOK_SETTINGS)}
          >
            Reset to defaults
          </Button>
          <Button size="small" variant="contained" onClick={copySettings}>
            Copy settings as JSON
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
