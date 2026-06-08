import { Button, ButtonGroup } from '@mui/material'
import { FcRedo, FcUndo } from 'react-icons/fc'
import useTemporalStore from '../hooks/useTemporalStore'
import { undoWithSelectionRestore } from '../utils/undoWithSelectionRestore'

const UndoRedoButtonGroup = () => {
  // we do things strange in this component to have react pastStates/futureStates and show
  // the user a count of actions in either direction
  // const { undo, redo } = useBoundStore.temporal.getState()
  const { redo, pastStates, futureStates } = useTemporalStore(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (state: any) => state,
  )
  return (
    <ButtonGroup
      sx={{ padding: '10px' }}
      variant="contained"
      size={'small'}
    >
      {/* <Button onClick={() => useBoundStore.temporal.getState().clear()}>CLEAR</Button> */}
      <Button
        // variant="contained"
        title={`(ctrl/cmd + Z) (${pastStates.length} undoable actions)`}
        aria-label={`Undo (${pastStates.length} undoable actions)`}
        onClick={() => undoWithSelectionRestore()}
        startIcon={<FcUndo size={16} />}
        size="small"
        style={{ fontSize: '0.7em' }}
      >
        Undo
      </Button>
      <Button
        variant="contained"
        title={`(ctrl/cmd + Y) (${futureStates.length} redoable actions)`}
        aria-label={`Redo (${pastStates.length} undoable actions)`}
        onClick={() => redo()}
        startIcon={<FcRedo size={16} />}
        size="small"
        style={{ fontSize: '0.7em' }}
      >
        Redo
      </Button>
    </ButtonGroup>
  )
}

export default UndoRedoButtonGroup
