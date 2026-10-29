import { Container, List } from '@mui/material'
import { FcTodoList } from 'react-icons/fc'
import { MdGridView } from 'react-icons/md'
import { DIALOGS } from '../layout/dialogNames'
import { OBJECTIVE_MARKER_PEN_MODE } from '../data/objectiveMarkers'
import useBoundStore from '../store/store'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'
import PenModeControls from './PenModeControls'
import PieceSizeSelect from './PieceSizeSelect'
import RotationSelect from './RotationSelect'
import UndoRedoButtonGroup from './UndoRedoButtonGroup'
import ViewingLevelInput from './ViewingLevelInput'
import ObjectiveMarkerControls from './ObjectiveMarkerControls'

export const BuildControlsTab = () => {
  const penMode = useBoundStore((state) => state.penMode)
  const conflictedPieceUIDs = useBoundStore((s) => s.conflictedPieceUIDs)
  const isViewMapInventoryDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.viewMapInventory
  const isViewPiecesGridOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.viewPiecesGrid
  const toggleCurrentDialog = useBoundStore(
    (state) => state.toggleCurrentDialog,
  )
  return (
    <Container sx={{ padding: 1 }}>
      <List>
        <ControlTabsListItemButton
          title={'View information about the pieces used in current map'}
          primary={'View Map Inventory'}
          onClick={() =>
            toggleCurrentDialog(
              isViewMapInventoryDialogOpen ? '' : DIALOGS.viewMapInventory,
            )
          }
          icon={<FcTodoList />}
        />
        <ControlTabsListItemButton
          title={
            'View all pieces in a grid, conflicted pieces at the top, can zoom camera to piece'
          }
          primary={'View Pieces Grid'}
          isError={conflictedPieceUIDs.length > 0}
          onClick={() =>
            toggleCurrentDialog(
              isViewPiecesGridOpen ? '' : DIALOGS.viewPiecesGrid,
            )
          }
          icon={<MdGridView />}
        />
      </List>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <UndoRedoButtonGroup />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <PenModeControls />
      </div>
      {/* <div style={{ padding: '0px 20px' }}>
        {isUseInventory && !Number.isNaN(remainingCount)
          ? `${remainingCount} remaining`
          : ''}
      </div> */}
      {penMode === OBJECTIVE_MARKER_PEN_MODE ? (
        <ObjectiveMarkerControls />
      ) : (
        <PieceSizeSelect />
      )}
      <RotationSelect />
      <ViewingLevelInput />

      {/* <LocalStorageList /> */}
    </Container>
  )
}
