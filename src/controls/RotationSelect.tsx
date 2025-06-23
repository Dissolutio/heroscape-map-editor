import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import {
  MdOutlineEast,
  MdOutlineNorth,
  MdOutlineNorthEast,
  MdOutlineNorthWest,
  MdOutlineSouth,
  MdOutlineSouthEast,
  MdOutlineSouthWest,
  MdOutlineWest,
} from 'react-icons/md'
import useBoundStore from '../store/store'
import { Pieces } from '../types'

export default function RotationSelect() {
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const penMode = useBoundStore((s) => s.penMode)
  const togglePenModeRotation = useBoundStore((s) => s.togglePenModeRotation)
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: number,
  ) => {
    togglePenModeRotation(value)
  }
  const regularRotations = [0, 1, 2, 3, 4, 5]
  // const partialRotations = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
  const allRotations = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
  const possibleRotations =
    penMode === Pieces.laurWallTrianglePillar ||
    penMode === Pieces.laurWallRuin ||
    penMode === Pieces.laurWallRuin2 ||
    penMode === Pieces.laurWallRuin3 ||
    penMode === Pieces.laurWallLong ||
    penMode === Pieces.laurWallLongStackable
      ? allRotations
      : regularRotations
  return (
    <div
      style={{
        margin: '0px 0px',
        border: '1px solid',
      }}
    >
      <span>Piece rotation:</span>
      <ToggleButtonGroup
        // disabled={!isSizes}
        value={`${penModeRotation}`}
        onChange={handleChange}
        exclusive
        size="small"
        aria-label="piece rotation for current pen mode"
      >
        {possibleRotations.map((r) => (
          <ToggleButton
            key={r}
            value={`${r}`}
            aria-label={`${r}-times rotated 60 degrees`}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {r === 0 ? (
              <>
                <MdOutlineEast />
                <span>0</span>
              </>
            ) : r === 0.5 ? (
              <>
                <MdOutlineEast style={{ transform: 'rotate(30deg)' }} />
                <span>0.5</span>
              </>
            ) : r === 1 ? (
              <>
                <MdOutlineSouthEast />
                <span>1</span>
              </>
            ) : r === 1.5 ? (
              <>
                <MdOutlineSouth />
                <span>1.5</span>
              </>
            ) : r === 2 ? (
              <>
                <MdOutlineSouthWest />
                <span>2</span>
              </>
            ) : r === 2.5 ? (
              <>
                <MdOutlineSouthWest style={{ transform: 'rotate(30deg)' }} />
                <span>2.5</span>
              </>
            ) : r === 3 ? (
              <>
                <MdOutlineWest />
                <span>3</span>
              </>
            ) : r === 3.5 ? (
              <>
                <MdOutlineWest style={{ transform: 'rotate(35deg)' }} />
                <span>3.5</span>
              </>
            ) : r === 4 ? (
              <>
                <MdOutlineNorthWest />
                <span>4</span>
              </>
            ) : r === 4.5 ? (
              <>
                <MdOutlineNorth />
                <span>4.5</span>
              </>
            ) : r === 5 ? (
              <>
                <MdOutlineNorthEast />
                <span>5</span>
              </>
            ) : (
              // r === 5.5
              <>
                <MdOutlineNorthEast style={{ transform: 'rotate(30deg)' }} />
                <span>5.5</span>
              </>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}
