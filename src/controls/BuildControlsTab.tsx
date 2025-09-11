import { Container } from '@mui/material'
import PenModeControls from './PenModeControls'
import PieceSizeSelect from './PieceSizeSelect'
import RotationSelect from './RotationSelect'
import UndoRedoButtonGroup from './UndoRedoButtonGroup'
import ViewingLevelInput from './ViewingLevelInput'

export const BuildControlsTab = () => {
  // const inventory = useLocalPieceInventory()

  return (
    <Container sx={{ padding: 1 }}>
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
