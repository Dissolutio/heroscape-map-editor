import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import useBoundStore from '../store/store'
import { HotkeyText } from './HotKeyText'
import { useHotkeyConfig } from './useHotkeyConfig'
import { MouseEvent } from 'react'

export default function PieceSizeSelect() {
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const { hotkeyLookup } = useHotkeyConfig()
  const handleChange = (
    _event: MouseEvent<HTMLElement>,
    value: string,
  ) => {
    togglePieceSize(Number.parseInt(value))
  }
  const isSizes = flatPieceSizes?.length > 0
  return (
    <div
      style={{
        margin: '10px 20px',
        padding: '0.5em',
        border: '1px solid var(--transparent-border)',
      }}
    >
      <ToggleButtonGroup
        disabled={!isSizes}
        value={`${pieceSize}`}
        onChange={handleChange}
        exclusive
        aria-label="piece select for current pen mode"
        sx={{
          alignItems: 'center',
        }}
      >
        <span>Piece size:</span>
        <span>
          {isSizes ? (
            flatPieceSizes.map((s, i) => (
              <ToggleButton
                key={s}
                value={`${s}`}
                aria-label={`${s}-hex sized piece`}
                title={`${s}-hex sized piece [hotkey ${i + 1}`}
              >
                {s}
                <HotkeyText
                  text={`${hotkeyLookup[`togglePieceSize${i + 1}`]}`}
                />
              </ToggleButton>
            ))
          ) : (
            <ToggleButton value={`${0}`} disabled>
              -
            </ToggleButton>
          )}
        </span>
      </ToggleButtonGroup>
    </div>
  )
}
