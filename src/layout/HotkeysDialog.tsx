import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Fade,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSnackbar } from 'notistack'
import {
  assignActionHotkey,
  exportHotkeyFile,
  filterHotkeyActions,
  getActionHotkeys,
  getCustomHotkeyCount,
  HOTKEY_ACTIONS,
  hotkeyFromKeyboardEvent,
  parseHotkeyFile,
  resetActionHotkeys,
  shouldConfirmHotkeyReset,
  swapActionHotkeys,
  updateActionHotkeys,
  type HotkeyAction,
} from '../data/hotkeys'
import useBoundStore from '../store/store'

type PendingConflict = {
  action: HotkeyAction
  conflicts: { action: HotkeyAction; key: string }[]
  reset?: boolean
}

type RecordedFeedback =
  | { action: HotkeyAction; key: string }
  | { message: string }

const isMacPlatform = () =>
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform)

const formatHotkeyPart = (part: string) =>
  part === 'mod'
    ? isMacPlatform()
      ? 'Cmd'
      : 'Ctrl'
    : part[0].toUpperCase() + part.slice(1)

const formatHotkey = (key: string) => {
  const parts = key.split('+')
  const keyPart = parts.pop() ?? ''
  const orderedModifiers = ['shift', 'mod', 'alt'].filter((part) =>
    parts.includes(part),
  )
  return [...orderedModifiers, keyPart].map(formatHotkeyPart).join(' + ')
}

const formatRecordingPreview = (event: KeyboardEvent) => {
  const modifiers = [
    ...(event.shiftKey ? ['shift'] : []),
    ...(event.ctrlKey || event.metaKey ? ['mod'] : []),
    ...(event.altKey ? ['alt'] : []),
  ]
  const isModifierKey = [
    'shift',
    'control',
    'ctrl',
    'meta',
    'alt',
  ].includes(event.key.toLowerCase())

  if (isModifierKey) {
    return modifiers.length
      ? `${modifiers.map(formatHotkeyPart).join(' + ')} + …`
      : ''
  }
  const key = hotkeyFromKeyboardEvent(event)
  return key ? formatHotkey(key) : ''
}

export default function HotkeysDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const overrides = useBoundStore((state) => state.hotkeyOverrides)
  const setHotkeyOverrides = useBoundStore((state) => state.setHotkeyOverrides)
  const { enqueueSnackbar } = useSnackbar()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRecordingKeyRef = useRef<{ key: string; code: string } | null>(
    null,
  )
  const [listeningAction, setListeningAction] = useState<HotkeyAction | null>(
    null,
  )
  const [recordingPreview, setRecordingPreview] = useState('')
  const [recordedFeedback, setRecordedFeedback] =
    useState<RecordedFeedback | null>(null)
  const [searchText, setSearchText] = useState('')
  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false)
  const [pendingConflict, setPendingConflict] =
    useState<PendingConflict | null>(null)
  const currentBindings = getActionHotkeys(overrides)
  const defaultBindings = getActionHotkeys({})
  const customHotkeyCount = getCustomHotkeyCount(overrides)
  const filteredActions = filterHotkeyActions(
    HOTKEY_ACTIONS,
    currentBindings,
    searchText,
  )

  useEffect(() => {
    if (!open) {
      setListeningAction(null)
      setRecordingPreview('')
      setRecordedFeedback(null)
      setSearchText('')
      setIsResetAllConfirmOpen(false)
      pendingRecordingKeyRef.current = null
      setPendingConflict(null)
    }
  }, [open])

  useEffect(() => {
    if (!recordedFeedback) return
    const timeout = window.setTimeout(() => setRecordedFeedback(null), 3000)
    const dismiss = () => setRecordedFeedback(null)
    window.addEventListener('pointerdown', dismiss, true)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('pointerdown', dismiss, true)
    }
  }, [recordedFeedback])

  useEffect(() => {
    if (!open || !listeningAction) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        pendingRecordingKeyRef.current = null
        setRecordingPreview('')
        setListeningAction(null)
        return
      }
      const key = hotkeyFromKeyboardEvent(event)
      event.preventDefault()
      event.stopPropagation()
      setRecordingPreview(formatRecordingPreview(event))
      if (!key) return
      pendingRecordingKeyRef.current = {
        key,
        code: event.code || event.key.toLowerCase(),
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      const pending = pendingRecordingKeyRef.current
      const code = event.code || event.key.toLowerCase()
      if (!pending || pending.code !== code) {
        setRecordingPreview(formatRecordingPreview(event))
        return
      }
      event.preventDefault()
      event.stopPropagation()
      pendingRecordingKeyRef.current = null
      const result = assignActionHotkey(
        overrides,
        listeningAction,
        pending.key,
      )
      if (result.conflict) {
        setPendingConflict({
          action: listeningAction,
          conflicts: [{ action: result.conflict, key: pending.key }],
        })
      } else {
        setHotkeyOverrides(result.overrides)
        setPendingConflict(null)
        setRecordingPreview('')
        setListeningAction(null)
        setRecordedFeedback({ action: listeningAction, key: pending.key })
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [listeningAction, open, overrides, setHotkeyOverrides])

  const downloadOverrides = () => {
    try {
      const blob = new Blob(
        [JSON.stringify(exportHotkeyFile(overrides), null, 2)],
        { type: 'application/json' },
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'hexoscape-hotkeys.json'
      link.click()
      URL.revokeObjectURL(url)
      enqueueSnackbar('Hotkeys exported', { variant: 'success' })
      return true
    } catch {
      enqueueSnackbar('Could not export hotkeys', { variant: 'error' })
      return false
    }
  }

  const resetAllHotkeys = () => {
    setHotkeyOverrides({})
    setIsResetAllConfirmOpen(false)
    setListeningAction(null)
    setRecordingPreview('')
    pendingRecordingKeyRef.current = null
    setPendingConflict(null)
    setRecordedFeedback({ message: 'Hotkeys reset to defaults' })
  }

  const importOverrides = async (file?: File) => {
    if (!file) return
    if (file.size > 65536) {
      enqueueSnackbar('Hotkey file is too large', { variant: 'error' })
      return
    }
    try {
      const result = parseHotkeyFile(await file.text())
      if (!result.overrides) {
        enqueueSnackbar(result.issues.join('; '), { variant: 'error' })
        return
      }
      setHotkeyOverrides(result.overrides)
      enqueueSnackbar(
        result.issues.length
          ? `Hotkeys imported. Skipped: ${result.issues.join('; ')}`
          : 'Hotkeys imported',
        { variant: result.issues.length ? 'warning' : 'success' },
      )
    } catch {
      enqueueSnackbar('Could not read hotkey file', { variant: 'error' })
    }
  }

  if (!open) return null

  const actionName = (action: HotkeyAction) =>
    HOTKEY_ACTIONS.find(({ id }) => id === action)?.label ?? action
  const feedbackMessage = recordedFeedback
    ? 'message' in recordedFeedback
      ? recordedFeedback.message
      : `${actionName(recordedFeedback.action)}: ${formatHotkey(recordedFeedback.key)}`
    : ''

  return (
    <Paper
      component="dialog"
      open
      aria-label="Hotkeys"
      elevation={8}
      sx={{
        position: 'fixed',
        zIndex: 1200,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        m: 0,
        width: 'min(760px, calc(100% - 24px))',
        maxHeight: 'min(85vh, 900px)',
        overflowY: 'auto',
        p: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Hotkeys</Typography>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </Box>
        <TextField
          label="Search hotkeys"
          size="small"
          fullWidth
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Fade
          in={Boolean(listeningAction || recordedFeedback)}
          timeout={400}
          unmountOnExit
        >
          <Alert severity="info">
            {listeningAction
              ? recordingPreview
                ? `Recording ${actionName(listeningAction)}: ${recordingPreview}. Release to set. Escape cancels.`
                : `Press a key combination for ${actionName(listeningAction)}. Escape cancels.`
              : feedbackMessage}
          </Alert>
        </Fade>
        {pendingConflict && (
          <Alert
            severity="warning"
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    const conflict = pendingConflict
                    setHotkeyOverrides(
                      conflict.reset
                        ? resetActionHotkeys(
                            overrides,
                            conflict.action,
                            true,
                          ).overrides
                        : swapActionHotkeys(
                            overrides,
                            conflict.action,
                            conflict.conflicts[0].action,
                            conflict.conflicts[0].key,
                          ),
                    )
                    setPendingConflict(null)
                    setListeningAction(null)
                    setRecordingPreview('')
                    pendingRecordingKeyRef.current = null
                    if (!conflict.reset) {
                      setRecordedFeedback({
                        action: conflict.action,
                        key: conflict.conflicts[0].key,
                      })
                    }
                  }}
                >
                  Swap
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setPendingConflict(null)
                    setListeningAction(null)
                    setRecordingPreview('')
                    pendingRecordingKeyRef.current = null
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            }
          >
            {pendingConflict.reset
              ? `Resetting ${actionName(pendingConflict.action)} conflicts with `
              : `${formatHotkey(pendingConflict.conflicts[0].key)} is assigned to `}
            {pendingConflict.conflicts
              .map(
                ({ action, key }) =>
                  `${actionName(action)} (${formatHotkey(key)})`,
              )
              .join(', ')}
            . Swap the bindings or cancel.
          </Alert>
        )}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              if (shouldConfirmHotkeyReset(overrides)) {
                setIsResetAllConfirmOpen(true)
              } else {
                setHotkeyOverrides({})
              }
            }}
          >
            Reset all hotkeys
          </Button>
          <Button size="small" variant="outlined" onClick={downloadOverrides}>
            Export hotkeys
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
          >
            Import hotkeys
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            aria-label="Import hotkeys file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void importOverrides(file)
            }}
          />
        </Stack>
        {filteredActions.length ? (
          filteredActions.reduce<ReactNode[]>((sections, action, index) => {
            if (
              index === 0 ||
              filteredActions[index - 1].group !== action.group
            ) {
              sections.push(
                <Typography key={`group-${action.group}`} variant="subtitle1">
                  {action.group}
                </Typography>,
              )
            }
            sections.push(
              <Box
                key={action.id}
                component="fieldset"
                display="flex"
                aria-label={`${action.label} hotkey`}
                alignItems="center"
                gap={1}
                flexWrap="wrap"
                sx={{ border: 0, m: 0, minWidth: 0, p: 0, py: 0.5 }}
              >
                <Typography sx={{ flex: '1 1 190px' }}>
                  {action.label}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 105 }}
                  aria-label={`${action.label} current keys`}
                >
                  {currentBindings[action.id].length
                    ? currentBindings[action.id].map(formatHotkey).join(', ')
                    : 'Unbound'}
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setPendingConflict(null)
                    setRecordedFeedback(null)
                    setRecordingPreview('')
                    pendingRecordingKeyRef.current = null
                    setListeningAction(action.id)
                  }}
                >
                  Change
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setHotkeyOverrides(
                      updateActionHotkeys(overrides, action.id, []),
                    )
                  }
                >
                  Clear
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const result = resetActionHotkeys(overrides, action.id)
                    if (result.conflicts.length) {
                      setPendingConflict({
                        action: action.id,
                        conflicts: result.conflicts,
                        reset: true,
                      })
                    } else {
                      setHotkeyOverrides(result.overrides)
                    }
                  }}
                  disabled={
                    currentBindings[action.id].join(',') ===
                    defaultBindings[action.id].join(',')
                  }
                >
                  Reset
                </Button>
              </Box>,
            )
            if (
              index === filteredActions.length - 1 ||
              filteredActions[index + 1].group !== action.group
            ) {
              sections.push(<Divider key={`divider-${action.group}`} />)
            }
            return sections
          }, [])
        ) : (
          <Typography role="status">No matches</Typography>
        )}
      </Stack>
      <Dialog
        open={isResetAllConfirmOpen}
        onClose={() => setIsResetAllConfirmOpen(false)}
        aria-labelledby="reset-all-hotkeys-title"
      >
        <DialogTitle id="reset-all-hotkeys-title">
          Reset all hotkeys?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This replaces your {customHotkeyCount} custom hotkeys with the
            defaults. You can download your current hotkeys first to keep a
            copy.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsResetAllConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (downloadOverrides()) resetAllHotkeys()
            }}
          >
            Download and reset
          </Button>
          <Button color="error" variant="contained" onClick={resetAllHotkeys}>
            Reset anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
