import { Button, Tooltip } from '@mui/material'
import { Billboard, Html } from '@react-three/drei'
import React from 'react'
import { FcCancel } from 'react-icons/fc'
import useBoundStore from '../../store/store'
import { Pieces } from '../../types'

type Props = { pieceID: string; y?: number }

const DeletePieceBillboard = ({ pieceID, y = 0 }: Props) => {
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const onClickDeletePiece = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (
      pieceID.includes(Pieces.roadWall) ||
      pieceID.includes(Pieces.battlement)
    ) {
      e?.stopPropagation()
      unpaintTile(pieceID)
    }
  }
  return null
  return (
    <Billboard position={[0.5, 1 + y, 0]}>
      <Html>
        <Tooltip title={'Delete piece'}>
          <Button
            sx={{ backgroundColor: 'var(--black)' }}
            variant="contained"
            size="small"
            onPointerDown={(e) => e?.stopPropagation()}
            onPointerUp={onClickDeletePiece}
          >
            <FcCancel />
          </Button>
        </Tooltip>
      </Html>
    </Billboard>
  )
}
export default DeletePieceBillboard
