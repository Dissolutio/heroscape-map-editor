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
import { useEffect } from 'react'
import {
  doPenModeRotation,
  getPossibleRotationsForPenMode,
} from './getPossibleRotationsForPenMode'
import { useHotkeyConfig } from './useHotkeyConfig'

export default function RotationSelect() {
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const penMode = useBoundStore((s) => s.penMode)
  const togglePenModeRotation = useBoundStore((s) => s.togglePenModeRotation)
  const { hotkeyLookup } = useHotkeyConfig()
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: number,
  ) => {
    togglePenModeRotation(value)
  }
  const possibleRotations = getPossibleRotationsForPenMode(penMode)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <only update when pen mode changes>
  useEffect(() => {
    if (!possibleRotations.includes(penModeRotation)) {
      doPenModeRotation(penMode, penModeRotation, togglePenModeRotation)
    }
  }, [penMode])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        margin: '0px 0px',
        border: '1px solid var(--transparent-border)',
        padding: '0.5em',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span title={`Use "q"/"e" hotkeys to cycle rotation`}>
          Piece rotation:
        </span>
        <span
          style={{
            fontSize: '0.6em',
            color: 'var(--sub-white)',
          }}
        >
          Hotkeys: {`${(hotkeyLookup.cyclePrevPieceRotation)?.toUpperCase()}`}, {`${(hotkeyLookup.cycleNextPieceRotation)?.toUpperCase()}`}
        </span>
      </div>
      <ToggleButtonGroup
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
