import { Button } from '@mui/material'
import { useHotkeys } from 'react-hotkeys-hook'
import { FcRedo, FcUndo } from 'react-icons/fc'
import useTemporalStore from '../hooks/useTemporalStore'
import ControlButtonGroup from './ControlButtonGroup'

const UndoRedoButtonGroup = () => {
  // we do things strange in this component to have react pastStates/futureStates and show
  // the user a count of actions in either direction
  // const { undo, redo } = useBoundStore.temporal.getState()
  const { undo, redo, pastStates, futureStates } = useTemporalStore(
    (state: any) => state,
  )
  useHotkeys('mod+z', () => undo())
  useHotkeys('mod+y', () => redo())
  return (
    <ControlButtonGroup>
      {/* <Button onClick={() => useBoundStore.temporal.getState().clear()}>CLEAR</Button> */}
      <Button
        variant="contained"
        title={`(ctrl/cmd + Z) (${pastStates.length} undoable actions)`}
        aria-label={`Undo (${pastStates.length} undoable actions)`}
        onClick={() => undo()}
        startIcon={<FcUndo />}
      >
        Undo
      </Button>
      <Button
        variant="contained"
        title={`(ctrl/cmd + Z) (${futureStates.length} redoable actions)`}
        aria-label={`Redo (${pastStates.length} undoable actions)`}
        onClick={() => redo()}
        startIcon={<FcRedo />}
      >
        Redo
      </Button>
    </ControlButtonGroup>
  )
}

export default UndoRedoButtonGroup
