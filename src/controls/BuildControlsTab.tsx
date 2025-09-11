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

export const BuildControlsTab = () => {
  // const inventory = useLocalPieceInventory()
  const isViewMapInventoryDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.viewMapInventory
  const toggleCurrentDialog = useBoundStore(
    (state) => state.toggleCurrentDialog,
  )
  return (
    <Container sx={{ padding: 1 }}>
      <List>
        <ControlTabsListItemButton
          primary={'View Map Inventory'}
          onClick={() =>
            toggleCurrentDialog(
              isViewMapInventoryDialogOpen ? '' : DIALOGS.viewMapInventory,
            )
          }
          icon={<FcTodoList />}
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
