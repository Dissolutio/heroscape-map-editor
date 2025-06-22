import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import useBoundStore from '../store/store'

export default function PieceSizeSelect() {
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: string,
  ) => {
    togglePieceSize(Number.parseInt(value))
  }
  const isSizes = flatPieceSizes?.length > 0
  return (
    <div style={{ margin: '10px 20px', border: '1px solid' }}>
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
            flatPieceSizes.map((s) => (
              <ToggleButton
                key={s}
                value={`${s}`}
                aria-label={`${s}-hex sized piece`}
              >
                {s}
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
