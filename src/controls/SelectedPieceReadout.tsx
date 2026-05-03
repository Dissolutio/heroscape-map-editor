import { Card, CardActions, CardContent, Typography } from '@mui/material'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import DeletePieceButton from './DeletePieceButton'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const SelectedPieceReadout = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const {
    // isLargeScreenWidth,
    isSmallScreenWidth,
    // isMediumScreenWidth,
  } = useMuiMediaQuery()
  if (!selectedPieceID) {
    return null
  }
  const boardPiece = boardPieces.find((bp) => bp.uid === selectedPieceID)
  if (!boardPiece) {
    return null
  }
  const { inventoryID, altitude, rotation } = boardPiece
  const piece = piecesSoFar[inventoryID]

  if (isSmallScreenWidth) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          padding: 1,
          margin: 1,
          // backgroundColor: 'var(--gunmetal-transparent)'
        }}
      >
        <Card
          sx={{
            width: 120,
            height: 120,
            p: 0,
          }}
        >
          <CardContent
            sx={{
              p: 1,
            }}
          >
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: 10,
              }}
            >
              Selected Piece
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontSize: 12 }}>
              {piece?.title ?? piece}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              Altitude: {altitude + 1}
              <br />
              Rotation: {rotation}
            </Typography>
          </CardContent>
          <CardActions
            sx={{
              p: 0,
              px: 1,
              m: 0,
            }}
          >
            <DeletePieceButton />
          </CardActions>
        </Card>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 10,
        margin: 10,
        // backgroundColor: 'var(--gunmetal-transparent)'
      }}
    >
      <Card
        sx={{
          width: 150,
          height: 200,
        }}
      >
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 12 }}
          >
            Selected Piece
          </Typography>
          <Typography variant="h5" component="div" sx={{ fontSize: 14 }}>
            {piece?.title ?? piece}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12 }}>
            Altitude: {altitude + 1}
            <br />
            Rotation: {rotation}
          </Typography>
        </CardContent>
        <CardActions
          sx={{
            // p: 0,
            px: '20px',
            py: 0,
            // m: 0
          }}
        >
          <DeletePieceButton />
        </CardActions>
      </Card>
    </div>
  )
}
// export const HoveredPieceReadout = () => {
//   const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
//   if (!hoveredPieceID) {
//     return null
//   }
//   const {
//     inventoryID,
//     altitude,
//     rotation,
//     // boardHexID,
//     // pieceCoords
//   } = decodePieceID(hoveredPieceID)
//   const piece = piecesSoFar[inventoryID]
//   return (
//     <div
//       style={{
//         position: 'absolute',
//         bottom: 200,
//         right: 0,
//         padding: 20,
//         margin: 20,
//         // backgroundColor: 'var(--gunmetal-transparent)'
//       }}
//     >
//       <Card sx={{ minWidth: 150 }}>
//         <CardContent>
//           <Typography
//             gutterBottom
//             sx={{ color: 'text.secondary', fontSize: 14 }}
//           >
//             Hovered Piece:
//           </Typography>
//           <Typography variant="h6" component="div" sx={{ fontSize: 16 }}>
//             {piece.title}
//           </Typography>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

export default SelectedPieceReadout
