import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import type { MouseEvent } from 'react'
import useBoundStore from '../store/store'
import { HotkeyText } from './HotKeyText'
import { getPieceSizeHotkeyMap } from './useApplyHotkeys'
import { useHotkeyConfig } from './useHotkeyConfig'

export default function PieceSizeSelect() {
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const { hotkeyLookup } = useHotkeyConfig()
  const hotkeyMap = getPieceSizeHotkeyMap(flatPieceSizes)
  const handleChange = (_event: MouseEvent<HTMLElement>, value: string) => {
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
            flatPieceSizes.map((s) => {
              const key = hotkeyMap.get(String(s)) ?? ''
              const hotkeyText = hotkeyLookup[`togglePieceSize${key}`] ?? key

              return (
                <ToggleButton
                  key={s}
                  value={`${s}`}
                  aria-label={`${s}-hex sized piece`}
                  title={`${s}-hex sized piece [hotkey ${key || 'none'}]`}
                >
                  {s}
                  <HotkeyText text={hotkeyText} />
                </ToggleButton>
              )
            })
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
