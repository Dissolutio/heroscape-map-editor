import {
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Switch,
} from '@mui/material'
import useBoundStore from '../store/store'

const MapLensToggles = () => {
  const isShowStartZones = useBoundStore((s) => s.isShowStartZones)
  const toggleIsShowStartZones = useBoundStore((s) => s.toggleIsShowStartZones)
  return (
    <Container disableGutters sx={{ mt: 1 }}>
      <FormControl component="fieldset">
        <FormLabel component="legend">Map Lenses</FormLabel>
        <FormGroup aria-label="map lens toggles" row>
          <FormControlLabel
            value={isShowStartZones}
            control={
              <Switch
                color="primary"
                checked={isShowStartZones}
                onChange={() => toggleIsShowStartZones(!isShowStartZones)}
              />
            }
            label="Show Start Zones"
            labelPlacement="start"
          />
        </FormGroup>
        <FormHelperText>
          Hides start zones in the 3D view only. 2D and PDF exports are not
          affected.
        </FormHelperText>
      </FormControl>
    </Container>
  )
}

export default MapLensToggles
