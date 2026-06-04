import { Card, CardActions, CardContent, Tooltip, Typography } from '@mui/material'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import DeletePieceButton from './DeletePieceButton'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const SelectedPieceReadout = () => {
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const {
    // isLargeScreenWidth,
    isSmallScreenWidth,
    // isMediumScreenWidth,
  } = useMuiMediaQuery()
  if (!selectedPieceIDs.length) {
    return null
  }
  const selectedBoardPieces = boardPieces.filter((bp) =>
    selectedPieceIDs.includes(bp.uid),
  )
  const firstBp = selectedBoardPieces[0]
  if (!firstBp) {
    return null
  }
  const isMulti = selectedBoardPieces.length > 1

  // Succinct label + tooltip content
  const titleLabel = isMulti
    ? `${selectedBoardPieces.length} pieces`
    : (piecesSoFar[firstBp.inventoryID]?.title ?? firstBp.inventoryID)

  const tooltipLines = isMulti
    ? selectedBoardPieces
      .map(
        (bp) =>
          `${piecesSoFar[bp.inventoryID]?.title ?? bp.inventoryID}  alt:${bp.altitude + 1}  rot:${bp.rotation}`,
      )
      .join('\n')
    : ''

  const altitudes = selectedBoardPieces.map((bp) => bp.altitude + 1)
  const rotations = selectedBoardPieces.map((bp) => bp.rotation)
  const minAlt = Math.min(...altitudes)
  const maxAlt = Math.max(...altitudes)
  const altLabel = minAlt === maxAlt ? String(minAlt) : `${minAlt}–${maxAlt}`
  const rotLabel = rotations.every((r) => r === rotations[0])
    ? String(rotations[0])
    : 'mixed'

  if (isSmallScreenWidth) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          padding: 1,
          margin: 1,
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
              {isMulti ? 'Selected Pieces' : 'Selected Piece'}
            </Typography>
            <Tooltip title={tooltipLines} placement="left" arrow>
              <Typography variant="h5" component="div" sx={{ fontSize: 12, cursor: isMulti ? 'help' : 'default' }}>
                {titleLabel}
              </Typography>
            </Tooltip>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              Alt: {altLabel}
              <br />
              Rot: {rotLabel}
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
            {isMulti ? 'Selected Pieces' : 'Selected Piece'}
          </Typography>
          <Tooltip
            title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipLines}</span>}
            placement="left"
            arrow
            disableHoverListener={!isMulti}
          >
            <Typography variant="h5" component="div" sx={{ fontSize: 14, cursor: isMulti ? 'help' : 'default' }}>
              {titleLabel}
            </Typography>
          </Tooltip>
          <Typography variant="body2" sx={{ fontSize: 12 }}>
            Alt: {altLabel}
            <br />
            Rot: {rotLabel}
          </Typography>
        </CardContent>
        <CardActions
          sx={{
            px: '20px',
            py: 0,
          }}
        >
          <DeletePieceButton />
        </CardActions>
      </Card>
    </div>
  )
}

export default SelectedPieceReadout
