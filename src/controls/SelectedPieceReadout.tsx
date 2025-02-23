import React from 'react'
import useBoundStore from '../store/store'
import { Card, CardActions, CardContent, Typography } from '@mui/material'
import { decodePieceID } from '../utils/map-utils'
import { piecesSoFar } from '../data/pieces'
import DeletePieceButton from './DeletePieceButton'

const SelectedPieceReadout = () => {
  const selectedPieceID = useBoundStore(s => s.selectedPieceID)
  if (!selectedPieceID) {
    return null
  }
  const {
    pieceID,
    altitude,
    rotation,
    // boardHexID,
    // pieceCoords
  } = decodePieceID(selectedPieceID)
  const piece = piecesSoFar[pieceID]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 20,
        margin: 20,
        // backgroundColor: 'var(--gunmetal-transparent)'
      }}
    >
      <Card sx={{ width: 150, height: 200 }}>
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 14 }}
          >
            Selected Piece
          </Typography>
          <Typography
            variant="h5"
            component="div"
            sx={{ fontSize: 18 }}
          >
            {piece.title}
          </Typography>
          <Typography variant="body2">
            {/* TODO: Piece Altitude off by one */}
            Altitude: {altitude + 1}
            <br />
            Rotation: {rotation}
          </Typography>
        </CardContent>
        <CardActions>
          <DeletePieceButton
            pieceID={pieceID}
          />
        </CardActions>
      </Card>
    </div>
  )
}
// export const HoveredPieceReadout = () => {
//   const hoveredPieceID = useBoundStore(s => s.hoveredPieceID)
//   if (!hoveredPieceID) {
//     return null
//   }
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
//           <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
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
