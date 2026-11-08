import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSnackbar } from 'notistack'
import {
  assignActionHotkey,
  exportHotkeyFile,
  getActionHotkeys,
  HOTKEY_ACTIONS,
  hotkeyFromKeyboardEvent,
  parseHotkeyFile,
  resetActionHotkeys,
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

const formatHotkey = (key: string) =>
  key
    .split('+')
    .map((part) =>
      part === 'mod' ? 'Ctrl/Cmd' : part[0].toUpperCase() + part.slice(1),
    )
    .join(' + ')

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
  const [listeningAction, setListeningAction] = useState<HotkeyAction | null>(
    null,
  )
  const [pendingConflict, setPendingConflict] =
    useState<PendingConflict | null>(null)
  const currentBindings = getActionHotkeys(overrides)
  const defaultBindings = getActionHotkeys({})

  useEffect(() => {
    if (!open) {
      setListeningAction(null)
      setPendingConflict(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !listeningAction) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setListeningAction(null)
        return
      }
      const key = hotkeyFromKeyboardEvent(event)
      if (!key) return
      event.preventDefault()
      event.stopPropagation()
      const result = assignActionHotkey(overrides, listeningAction, key)
      if (result.conflict) {
        setPendingConflict({
          action: listeningAction,
          conflicts: [{ action: result.conflict, key }],
        })
      } else {
        setHotkeyOverrides(result.overrides)
        setPendingConflict(null)
        setListeningAction(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
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
    } catch {
      enqueueSnackbar('Could not export hotkeys', { variant: 'error' })
    }
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
        {listeningAction && (
          <Alert severity="info">
            Press a key combination for {actionName(listeningAction)}. Escape
            cancels.
          </Alert>
        )}
        {pendingConflict && (
          <Alert
            severity="warning"
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setHotkeyOverrides(
                      pendingConflict.reset
                        ? resetActionHotkeys(
                            overrides,
                            pendingConflict.action,
                            true,
                          ).overrides
                        : swapActionHotkeys(
                            overrides,
                            pendingConflict.action,
                            pendingConflict.conflicts[0].action,
                            pendingConflict.conflicts[0].key,
                          ),
                    )
                    setPendingConflict(null)
                    setListeningAction(null)
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
            onClick={() => setHotkeyOverrides({})}
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
        {HOTKEY_ACTIONS.reduce<ReactNode[]>((sections, action, index) => {
          if (index === 0 || HOTKEY_ACTIONS[index - 1].group !== action.group) {
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
              <Typography sx={{ flex: '1 1 190px' }}>{action.label}</Typography>
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
            index === HOTKEY_ACTIONS.length - 1 ||
            HOTKEY_ACTIONS[index + 1].group !== action.group
          ) {
            sections.push(<Divider key={`divider-${action.group}`} />)
          }
          return sections
        }, [])}
      </Stack>
    </Paper>
  )
}
