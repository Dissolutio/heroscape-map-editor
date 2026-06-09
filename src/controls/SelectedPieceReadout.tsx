import { Card, CardContent } from '@mui/material'
import useBoundStore from '../store/store'
import { SelectedPieceControls } from './SelectedPieceControls'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const SelectedPieceReadout = () => {
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const { isSmallScreenWidth } = useMuiMediaQuery()

  if (!selectedPieceIDs.length) return null
  const firstBp = boardPieces.find((bp) => selectedPieceIDs.includes(bp.uid))
  if (!firstBp) return null

  const cardWidth = isSmallScreenWidth ? 160 : 185

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: isSmallScreenWidth ? 4 : 10,
        margin: isSmallScreenWidth ? 4 : 10,
      }}
    >
      <Card sx={{ width: cardWidth, p: 0 }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <SelectedPieceControls />
        </CardContent>
      </Card>
    </div>
  )
}

export default SelectedPieceReadout
