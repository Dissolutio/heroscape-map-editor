import { Box, Typography } from '@mui/material'
import { useMemo } from 'react'
import {
  formatMapPhysicalSize,
  getMapPhysicalSize,
  type MapPhysicalSizeInput,
} from '../utils/mapPhysicalSize'
import { MapSizeDiagram } from './MapSizeDiagram'

export function MapSizeDisplay({
  hexMap,
  showDiagram = false,
  hint,
}: {
  hexMap: MapPhysicalSizeInput
  showDiagram?: boolean
  hint?: string
}) {
  const size = useMemo(() => getMapPhysicalSize(hexMap), [hexMap])
  const summary = formatMapPhysicalSize(size)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography
        aria-live="polite"
        data-testid="map-size-summary"
        variant="body2"
      >
        {summary}
      </Typography>
      {showDiagram && (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <MapSizeDiagram
            ariaLabel={summary}
            isHexagon={hexMap.shape === 'hexagon'}
            size={size}
          />
        </Box>
      )}
      {hint && (
        <Typography color="text.secondary" variant="caption">
          {hint}
        </Typography>
      )}
    </Box>
  )
}
