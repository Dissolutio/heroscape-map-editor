import { Button } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import useBoundStore from '../store/store'
import { HotkeyText } from './HotKeyText'
import { useHotkeyConfig } from './useHotkeyConfig'

export function promptToSaveSelection() {
  const state = useBoundStore.getState()
  const name = window.prompt(
    'Name this selection',
    `Selection ${state.savedSelections.length + 1}`,
  )
  if (name === null) return
  const result = state.saveSelectedSelection(name)
  if (result === 'full') {
    enqueueSnackbar('You can save up to 20 selections per map.', {
      variant: 'info',
      preventDuplicate: true,
      key: 'saved-selections-full',
    })
  }
}

export default function SaveSelectionButton() {
  const selectedPieceIDs = useBoundStore((state) => state.selectedPieceIDs)
  const selectedObjectiveMarkerUID = useBoundStore(
    (state) => state.selectedObjectiveMarkerUID,
  )
  const { hotkeyLookup } = useHotkeyConfig()
  if (!selectedPieceIDs.length && !selectedObjectiveMarkerUID) return null

  const hotkey = hotkeyLookup.saveSelection?.toUpperCase()
  return (
    <Button
      aria-keyshortcuts={hotkey ?? undefined}
      onClick={promptToSaveSelection}
      size="small"
      sx={{ fontSize: 9, mt: 0.5, width: '100%' }}
      title={`Save this selection${hotkey ? ` (${hotkey})` : ''}`}
      variant="outlined"
    >
      Save selection
      {hotkey && <HotkeyText text={hotkey} />}
    </Button>
  )
}
