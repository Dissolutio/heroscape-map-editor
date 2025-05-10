import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import {
  MdOutlineEast,
  MdOutlineNorthEast,
  MdOutlineNorthWest,
  MdOutlineSouthEast,
  MdOutlineSouthWest,
  MdOutlineWest,
} from 'react-icons/md'
import useBoundStore from '../store/store'

export default function RotationSelect() {
  const pieceRotation = useBoundStore((s) => s.pieceRotation)
  const togglePieceRotation = useBoundStore((s) => s.togglePieceRotation)
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: string,
  ) => {
    togglePieceRotation(parseInt(value))
  }
  return (
    <span style={{ margin: '0px 20px' }}>
      <span>Select rotation:</span>
      <ToggleButtonGroup
        // disabled={!isSizes}
        value={`${pieceRotation}`}
        onChange={handleChange}
        exclusive
        aria-label="piece rotation for current pen mode"
      >
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <ToggleButton
            key={r}
            value={`${r}`}
            aria-label={`${r}-times rotated 60 degrees`}
          >
            {r === 0 ? (
              <MdOutlineEast></MdOutlineEast>
            ) : r === 1 ? (
              <MdOutlineSouthEast></MdOutlineSouthEast>
            ) : r === 2 ? (
              <MdOutlineSouthWest></MdOutlineSouthWest>
            ) : r === 3 ? (
              <MdOutlineWest></MdOutlineWest>
            ) : r === 4 ? (
              <MdOutlineNorthWest></MdOutlineNorthWest>
            ) : (
              <MdOutlineNorthEast></MdOutlineNorthEast>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </span>
  )
}
