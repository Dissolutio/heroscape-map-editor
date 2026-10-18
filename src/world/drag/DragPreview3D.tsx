import { piecesSoFar } from '../../data/pieces'
import useBoundStore from '../../store/store'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import { OperationPiecePreviewItem } from '../OperationPiecePreviews'
import { PlacementFootprint } from '../PlacementFootprint'

/**
 * What a drag shows: the footprint where the piece would land, coloured by
 * its status (ok, conflict, blocked), and for non-land pieces a see-through
 * model there too. Land tiles render as one instanced batch, so for them the
 * footprint is the whole ghost.
 */
export function DragPreview3D() {
  const dragPreview = useBoundStore((s) => s.dragPreview)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  if (!dragPreview?.status || !dragPreview.pointerHex) return null
  const { status, footprintHexes, pointerHex, previewBp, uid } = dragPreview
  const originalBp = boardPieces.find((bp) => bp.uid === uid)
  const terrain = piecesSoFar[originalBp?.inventoryID ?? '']?.terrain
  const isLand = isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)
  return (
    <>
      <PlacementFootprint
        status={status}
        footprintHexes={footprintHexes}
        hoveredHex={pointerHex}
      />
      {originalBp && previewBp && !isLand && (
        <OperationPiecePreviewItem
          key={`drag-ghost-${uid}`}
          originalBp={originalBp}
          previewBp={previewBp}
          isRaycastable={false}
        />
      )}
    </>
  )
}
