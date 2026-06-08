import { Container, List } from '@mui/material'
import PenModeControls from './PenModeControls'
import PieceSizeSelect from './PieceSizeSelect'
import RotationSelect from './RotationSelect'
import UndoRedoButtonGroup from './UndoRedoButtonGroup'
import ViewingLevelInput from './ViewingLevelInput'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'
import useBoundStore from '../store/store'
import { DIALOGS } from '../layout/dialogNames'
import { FcTodoList } from 'react-icons/fc'
import { MdGridView } from 'react-icons/md'

export const BuildControlsTab = () => {
  // const inventory = useLocalPieceInventory()
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
          title={'View all pieces in a grid, sortable and zoomable'}
          primary={'View Pieces Grid'}
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
        <PenModeControls />
        <UndoRedoButtonGroup />
      </div>
      {/* <div style={{ padding: '0px 20px' }}>
        {isUseInventory && !Number.isNaN(remainingCount)
          ? `${remainingCount} remaining`
          : ''}
      </div> */}
      <PieceSizeSelect />
      <RotationSelect />
      {/* <MapLensToggles /> */}
      <ViewingLevelInput />

      {/* <LocalStorageList /> */}
    </Container>
  )
}
