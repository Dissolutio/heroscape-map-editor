import { piecesSoFar } from '../../data/pieces'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { LandPieceGhost } from '../LandPieceGhost'
import { OperationPiecePreviewItem } from '../OperationPiecePreviews'
import { PlacementFootprint } from '../PlacementFootprint'

/**
 * What a drag shows: the footprint where the piece would land, coloured by
 * its status (ok, conflict, blocked), and, unless it is blocked, a
 * see-through piece there: land tiles as the pen hover draws them, other
 * pieces through their model. Neither ghost takes pointer events, so the
 * pointer keeps finding the hex under it.
 */
export function DragPreview3D() {
  const dragPreview = useBoundStore((s) => s.dragPreview)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  if (!dragPreview?.status || !dragPreview.pointerHex) return null
  const { status, footprintHexes, pointerHex, previewBp, uid } = dragPreview
  const originalBp = boardPieces.find((bp) => bp.uid === uid)
  const piece = piecesSoFar[originalBp?.inventoryID ?? '']
  const isLand =
    isSolidTerrainHex(piece?.terrain) || isFluidTerrainHex(piece?.terrain)
  const showGhost = status !== 'blocked' && !!originalBp && !!previewBp

  const landGhost = () => {
    if (!previewBp || !piece) return null
    const { pieceCoords, altitude, rotation } = previewBp
    const support = boardHexes[genBoardHexID({ ...pieceCoords, altitude })]
    return (
      <LandPieceGhost
        key={`drag-land-ghost-${uid}`}
        piece={piece}
        supportHex={{
          ...pieceCoords,
          altitude,
          terrain: support?.terrain ?? HexTerrain.empty,
        }}
        rotation={rotation}
        isRaycastable={false}
      />
    )
  }

  return (
    <>
      <PlacementFootprint
        status={status}
        footprintHexes={footprintHexes}
        hoveredHex={pointerHex}
      />
      {showGhost && isLand && landGhost()}
      {showGhost && !isLand && originalBp && previewBp && (
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
