import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import {
  getObjectiveMarkerContentError,
  type ObjectiveMarker,
  type ObjectiveMarkerContent,
  type ObjectiveMarkerDraft,
} from '../data/objectiveMarkers'
import { getObjectiveMarkerPlacementStatus } from '../data/objectiveMarkerPlacement'
import { mapTableHexes } from '../data/fitMapToPieces'
import useBoundStore from '../store/store'

export default function ObjectiveMarkerControls({
  marker,
}: {
  marker?: ObjectiveMarker
}) {
  const isEditing = marker !== undefined
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const markers = useBoundStore((state) => state.hexMap.objectiveMarkers ?? [])
  const draft = useBoundStore((state) => state.objectiveMarkerDraft)
  const updateDraft = useBoundStore((state) => state.updateObjectiveMarkerDraft)
  const updateMarker = useBoundStore((state) => state.updateObjectiveMarker)
  const removeMarker = useBoundStore((state) => state.removeObjectiveMarker)
  const tableHexIDs = useMemo(() => mapTableHexes(hexMap), [hexMap])
  const [contentValue, setContentValue] = useState('')
  const [contentError, setContentError] = useState('')
  const [placementError, setPlacementError] = useState('')
  const current: ObjectiveMarkerDraft = marker ?? draft
  const content = current.content

  useEffect(() => {
    setContentValue(String(content.value))
    setContentError('')
  }, [content.value])

  const updatePlacementField = (
    updates: Pick<Partial<ObjectiveMarker>, 'size' | 'rotation'>,
  ) => {
    if (!marker) {
      updateDraft(updates as Partial<ObjectiveMarkerDraft>)
      return
    }
    const candidate = { ...marker, ...updates }
    const placement = getObjectiveMarkerPlacementStatus({
      marker: candidate,
      boardHexes,
      mapHexIDs: tableHexIDs,
      markers,
    })
    if (placement.status !== 'ok') {
      setPlacementError(
        placement.reason === 'overlap'
          ? 'This marker would overlap another marker.'
          : 'Every marker hex must remain on a supported map cap.',
      )
      return
    }
    setPlacementError('')
    updateMarker(marker.uid, updates)
  }

  const saveContent = (nextContent: ObjectiveMarkerContent) => {
    const error = getObjectiveMarkerContentError(nextContent)
    if (error) {
      setContentError(error)
      return
    }
    setContentError('')
    setPlacementError('')
    if (marker) updateMarker(marker.uid, { content: nextContent })
    else updateDraft({ content: nextContent })
  }

  const handleContentChange = (value: string) => {
    setContentValue(value)
    if (content.kind === 'number') {
      if (!/^\d+$/u.test(value)) {
        setContentError('Enter a whole number from 1 to 99.')
        return
      }
      saveContent({ kind: 'number', value: Number(value) })
      return
    }
    saveContent({ kind: 'text', value })
  }

  const changeContentKind = (kind: ObjectiveMarkerContent['kind']) => {
    if (kind === content.kind) return
    const nextContent: ObjectiveMarkerContent =
      kind === 'number'
        ? { kind: 'number', value: 1 }
        : { kind: 'text', value: String(content.value) }
    setContentValue(String(nextContent.value))
    saveContent(nextContent)
  }

  const updateSimpleField = (
    updates: Pick<Partial<ObjectiveMarker>, 'style'>,
  ) => {
    setPlacementError('')
    if (marker) updateMarker(marker.uid, updates)
    else updateDraft(updates as Partial<ObjectiveMarkerDraft>)
  }

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>
          {isEditing ? 'Selected Objective Marker' : 'Objective Marker'}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 11, mb: 0.25 }}>Size</Typography>
          <ToggleButtonGroup
            value={String(current.size)}
            exclusive
            size="small"
            aria-label="Marker size"
            onChange={(_, value: string | null) => {
              if (value) updatePlacementField({ size: Number(value) as 1 | 2 })
            }}
          >
            <ToggleButton value="1" aria-label="1-hex marker">
              1 hex
            </ToggleButton>
            <ToggleButton value="2" aria-label="2-hex marker">
              2 hexes
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 11, mb: 0.25 }}>Style</Typography>
          <ToggleButtonGroup
            value={current.style}
            exclusive
            size="small"
            aria-label="Marker style"
            onChange={(_, value: 'black' | 'white' | null) => {
              if (value) updateSimpleField({ style: value })
            }}
          >
            <ToggleButton value="black">Black</ToggleButton>
            <ToggleButton value="white">White</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <FormControl error={Boolean(contentError)} fullWidth sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 11, mb: 0.25 }}>Content</Typography>
          <ToggleButtonGroup
            value={content.kind}
            exclusive
            size="small"
            aria-label="Marker content kind"
            onChange={(_, value: ObjectiveMarkerContent['kind'] | null) => {
              if (value) changeContentKind(value)
            }}
            sx={{ mb: 0.75, width: 'fit-content' }}
          >
            <ToggleButton value="number">Number</ToggleButton>
            <ToggleButton value="text">Text</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small"
            label={content.kind === 'number' ? 'Number (1–99)' : 'Text (1–3 chars)'}
            type={content.kind}
            inputProps={{
              'aria-label':
                content.kind === 'number' ? 'Marker number' : 'Marker text',
              inputMode: content.kind === 'number' ? 'numeric' : 'text',
              maxLength: content.kind === 'text' ? 3 : undefined,
              ...(content.kind === 'number'
                ? { min: 1, max: 99, step: 1 }
                : {}),
            }}
            value={contentValue}
            onChange={(event) => handleContentChange(event.target.value)}
            error={Boolean(contentError)}
          />
          {contentError && <FormHelperText>{contentError}</FormHelperText>}
        </FormControl>
        {isEditing && (
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 11, mb: 0.25 }}>Rotation</Typography>
            <ToggleButtonGroup
              value={String(marker.rotation)}
              exclusive
              size="small"
              aria-label="Marker rotation"
              onChange={(_, value: string | null) => {
                if (value !== null) {
                  updatePlacementField({ rotation: Number(value) as 0 | 1 | 2 | 3 | 4 | 5 })
                }
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((rotation) => (
                <ToggleButton
                  key={rotation}
                  value={String(rotation)}
                  aria-label={`Rotate marker ${rotation} steps`}
                >
                  {rotation}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}
        {placementError && (
          <Typography color="error" sx={{ fontSize: 10, mb: 0.75 }}>
            {placementError}
          </Typography>
        )}
        {marker && (
          <Button
            size="small"
            color="error"
            onClick={() => removeMarker(marker.uid)}
            aria-label="Delete objective marker"
          >
            Delete Marker
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
