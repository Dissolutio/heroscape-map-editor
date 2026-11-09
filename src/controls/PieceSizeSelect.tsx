import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import type { MouseEvent } from 'react'
import {
  getPieceVariantForPenMode,
  isObstacleVariantFamily,
} from '../data/flatPieceSizes'
import { PEN_MODE_ACTION_TARGETS } from '../data/hotkeys'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { HotkeyText } from './HotKeyText'
import { getPieceSizeHotkeyMap } from './useApplyHotkeys'
import { useHotkeyConfig } from './useHotkeyConfig'

export default function PieceSizeSelect() {
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const penMode = useBoundStore((s) => s.penMode)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const { hotkeyLookup } = useHotkeyConfig()
  const isVariantFamily = isObstacleVariantFamily(penMode)
  const cyclesVariants = isVariantFamily && flatPieceSizes.length > 5
  const hotkeyMap = getPieceSizeHotkeyMap(flatPieceSizes, isVariantFamily)
  const familyAction = isVariantFamily
    ? Object.entries(PEN_MODE_ACTION_TARGETS).find(
        ([, mode]) =>
          piecesSoFar[mode]?.pieceSizeFamily ===
          piecesSoFar[penMode]?.pieceSizeFamily,
      )?.[0]
    : undefined
  const familyHotkey = familyAction ? hotkeyLookup[familyAction] : undefined
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
        {familyHotkey && <HotkeyText text={familyHotkey} />}
        <span>
          {isSizes ? (
            flatPieceSizes.map((s) => {
              const key = hotkeyMap.get(String(s)) ?? ''
              const hotkeyText = key
                ? (hotkeyLookup[`togglePieceSize${key}`] ?? key)
                : ''
              const variant = isVariantFamily
                ? getPieceVariantForPenMode(penMode, s)
                : undefined
              const label = variant
                ? `${variant.size} hex, ${variant.variantLabel ?? variant.title}`
                : `${s}-hex sized piece`

              return (
                <ToggleButton
                  key={s}
                  value={`${s}`}
                  aria-label={`${s}, ${label}`}
                  title={`${label} [hotkey ${key || 'none'}]`}
                >
                  {variant ? `${s}. ${label}` : s}
                  <HotkeyText text={hotkeyText} />
                </ToggleButton>
              )
            })
          ) : (
            <ToggleButton value={`${0}`} disabled>
              -
            </ToggleButton>
          )}
          {cyclesVariants && (
            <span>
              {hotkeyLookup.togglePieceSize1} cycles forward;{' '}
              {hotkeyLookup.cyclePieceVariantBackward} cycles backward
            </span>
          )}
        </span>
      </ToggleButtonGroup>
    </div>
  )
}
