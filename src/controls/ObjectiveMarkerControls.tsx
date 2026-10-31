import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  TextField,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { mapTableHexes } from '../data/fitMapToPieces'
import {
  getObjectiveMarkerNameSuggestions,
  loadObjectiveMarkerUnitNames,
} from '../data/objectiveMarkerNameSuggestions'
import { getObjectiveMarkerPlacementStatus } from '../data/objectiveMarkerPlacement'
import {
  MAX_OBJECTIVE_MARKER_NAME_LENGTH,
  type ObjectiveMarker,
  type ObjectiveMarkerContent,
  type ObjectiveMarkerDraft,
  getEffectiveObjectiveMarkerNumber,
  getObjectiveMarkerContentError,
  normalizeObjectiveMarkerName,
} from '../data/objectiveMarkers'
import useBoundStore from '../store/store'
import { useHotkeyConfig } from './useHotkeyConfig'

const EMPTY_MARKERS: ObjectiveMarker[] = []

export default function ObjectiveMarkerControls({
  marker,
}: {
  marker?: ObjectiveMarker
}) {
  const isEditing = marker !== undefined
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const markers = useBoundStore(
    (state) => state.hexMap.objectiveMarkers ?? EMPTY_MARKERS,
  )
  const draft = useBoundStore((state) => state.objectiveMarkerDraft)
  const updateDraft = useBoundStore((state) => state.updateObjectiveMarkerDraft)
  const updateMarker = useBoundStore((state) => state.updateObjectiveMarker)
  const removeMarker = useBoundStore((state) => state.removeObjectiveMarker)
  const { hotkeyLookup } = useHotkeyConfig()
  const tableHexIDs = useMemo(() => mapTableHexes(hexMap), [hexMap])
  const [contentInput, setContentInput] = useState({
    source: '',
    value: '',
    error: '',
  })
  const [placementErrorState, setPlacementErrorState] = useState({
    source: '',
    value: '',
  })
  const [nameInput, setNameInput] = useState(() => ({
    source: marker?.uid ?? 'draft',
    value: marker?.name ?? draft.name ?? '',
  }))
  const [unitNames, setUnitNames] = useState<string[]>([])
  const current: ObjectiveMarkerDraft | ObjectiveMarker = marker ?? draft
  const content =
    !marker && draft.content.kind === 'number' && !draft.pinNumber
      ? {
          kind: 'number' as const,
          value: getEffectiveObjectiveMarkerNumber(
            markers,
            draft.style,
            draft.content.value,
          ),
        }
      : current.content
  const nameSource = marker?.uid ?? 'draft'
  const contentSource = `${nameSource}:${content.kind}:${content.value}`
  const contentValue =
    contentInput.source === contentSource
      ? contentInput.value
      : String(content.value)
  const contentError =
    contentInput.source === contentSource ? contentInput.error : ''
  const placementError =
    placementErrorState.source === nameSource ? placementErrorState.value : ''
  const nameValue =
    nameInput.source === nameSource ? nameInput.value : (current.name ?? '')

  const saveName = (value: string) => {
    const name = normalizeObjectiveMarkerName(value)
    const normalizedValue = name ?? ''
    setNameInput((previous) =>
      previous.source === nameSource && previous.value === normalizedValue
        ? previous
        : { source: nameSource, value: normalizedValue },
    )
    if (name === current.name) return
    if (marker) updateMarker(marker.uid, { name })
    else updateDraft({ name })
  }

  const loadUnitNames = () => {
    void loadObjectiveMarkerUnitNames()
      .then(setUnitNames)
      .catch(() => setUnitNames([]))
  }

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
      setPlacementErrorState({
        source: nameSource,
        value:
          placement.reason === 'overlap'
            ? 'This marker would overlap another marker.'
            : 'Every marker hex must remain on a supported map cap.',
      })
      return
    }
    setPlacementErrorState({ source: nameSource, value: '' })
    updateMarker(marker.uid, updates)
  }

  const saveContent = (nextContent: ObjectiveMarkerContent) => {
    const error = getObjectiveMarkerContentError(nextContent)
    if (error) {
      setContentInput({
        source: contentSource,
        value: String(nextContent.value),
        error,
      })
      return
    }
    setContentInput({
      source: contentSource,
      value: String(nextContent.value),
      error: '',
    })
    setPlacementErrorState({ source: nameSource, value: '' })
    if (marker) updateMarker(marker.uid, { content: nextContent })
    else updateDraft({ content: nextContent })
  }

  const handleContentChange = (value: string) => {
    setContentInput({ source: contentSource, value, error: '' })
    if (content.kind === 'number') {
      if (!/^\d+$/u.test(value)) {
        setContentInput({
          source: contentSource,
          value,
          error: 'Enter a whole number from 1 to 99.',
        })
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
    setContentInput({
      source: contentSource,
      value: String(nextContent.value),
      error: '',
    })
    saveContent(nextContent)
  }

  const updateSimpleField = (
    updates: Pick<Partial<ObjectiveMarker>, 'style'>,
  ) => {
    setPlacementErrorState({ source: nameSource, value: '' })
    if (marker) updateMarker(marker.uid, updates)
    else updateDraft(updates as Partial<ObjectiveMarkerDraft>)
  }

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>
          {isEditing ? 'Selected Objective Marker' : 'Objective Marker'}
        </Typography>
        {marker && (
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 11 }}>
              Type: Objective marker · Size: {marker.size}{' '}
              {marker.size === 1 ? 'hex' : 'hexes'}
            </Typography>
            <Typography sx={{ fontSize: 11 }}>
              Content:{' '}
              {content.kind === 'number'
                ? `Number ${content.value}`
                : `Text ${content.value}`}
            </Typography>
            {marker.name && (
              <Typography sx={{ fontSize: 11 }}>Name: {marker.name}</Typography>
            )}
            <Typography sx={{ fontSize: 11 }}>
              Style: {marker.style === 'black' ? 'Black' : 'White'}
            </Typography>
            <Typography sx={{ fontSize: 11, mt: 0.5 }}>
              Drag the marker to move it. Selecting a marker switches to Select
              mode.
            </Typography>
          </Box>
        )}
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
            <ToggleButton
              value="1"
              aria-label="1-hex marker"
              title={`Hotkey: ${hotkeyLookup.togglePieceSize1}`}
            >
              1 hex
            </ToggleButton>
            <ToggleButton
              value="2"
              aria-label="2-hex marker"
              title={`Hotkey: ${hotkeyLookup.togglePieceSize2}`}
            >
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
            <ToggleButton
              value="black"
              title={`Hotkey: ${hotkeyLookup.togglePenModeObjectiveMarker}`}
            >
              Black
            </ToggleButton>
            <ToggleButton
              value="white"
              title={`Hotkey: ${hotkeyLookup.togglePenModeObjectiveMarkerWhite}`}
            >
              White
            </ToggleButton>
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
            label={
              content.kind === 'number' ? 'Number (1–99)' : 'Text (1–3 chars)'
            }
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
        {!isEditing && content.kind === 'number' && (
          <Tooltip title="Keep this number for every marker you place, instead of counting up.">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.pinNumber}
                  inputProps={{ 'aria-label': 'Pin value' }}
                  onChange={(event) =>
                    updateDraft({ pinNumber: event.target.checked })
                  }
                />
              }
              label={
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    focusable="false"
                  >
                    <path
                      d="M16 3 21 8l-3 1-4 4v5l-2 2-2-2v-5L6 9 3 8l5-5 1 3 4 4 4-4z"
                      fill="currentColor"
                    />
                  </svg>
                  Pin value
                </Box>
              }
            />
          </Tooltip>
        )}
        <Autocomplete
          key={`${nameSource}:${current.name ?? ''}`}
          freeSolo
          openOnFocus
          options={unitNames}
          value={current.name ?? null}
          inputValue={nameValue}
          filterOptions={(_, state) =>
            getObjectiveMarkerNameSuggestions(unitNames, state.inputValue)
          }
          onInputChange={(_, value, reason) => {
            if (reason === 'input') {
              setNameInput({ source: nameSource, value })
            }
          }}
          onChange={(_, value) => {
            if (typeof value === 'string') saveName(value)
          }}
          onBlur={() => saveName(nameValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Name"
              onFocus={loadUnitNames}
              inputProps={{
                ...params.inputProps,
                'aria-label': 'Objective marker name',
                maxLength: MAX_OBJECTIVE_MARKER_NAME_LENGTH,
              }}
            />
          )}
        />
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
                  updatePlacementField({
                    rotation: Number(value) as 0 | 1 | 2 | 3 | 4 | 5,
                  })
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
