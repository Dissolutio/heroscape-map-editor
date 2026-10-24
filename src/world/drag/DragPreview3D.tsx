import type { DragPreviewMember } from '../../data/dragMove'
import { piecesSoFar } from '../../data/pieces'
import useBoundStore from '../../store/store'
import type { BoardPiece } from '../../types'
import { HexTerrain } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { LandPieceGhost } from '../LandPieceGhost'
import { LaurAddonPreview } from '../LaurAddonPreview'
import { OperationPiecePreviewItem } from '../OperationPiecePreviews'
import { PlacementFootprint } from '../PlacementFootprint'

/**
 * What a drag shows: each member's footprint where it would land, coloured
 * by its status (ok, conflict, blocked), and, unless blocked, a see-through
 * piece there: land tiles as the pen hover draws them, other pieces through
 * their model. Neither ghost takes pointer events, so the pointer keeps
 * finding the hex under it.
 */
export function DragPreview3D() {
  const dragPreview = useBoundStore((s) => s.dragPreview)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  if (!dragPreview?.status || !dragPreview.pointerHex) return null
  const members: DragPreviewMember[] = dragPreview.members ?? [
    {
      uid: dragPreview.uid,
      pointerHex: dragPreview.pointerHex,
      status: dragPreview.status,
      reason: dragPreview.reason,
      footprintHexes: dragPreview.footprintHexes,
      previewBp: dragPreview.previewBp,
      unsupported: false,
    },
  ]

  return (
    <>
      {members.map((member) => {
        const originalBp = boardPieces.find((bp) => bp.uid === member.uid)
        const piece = piecesSoFar[originalBp?.inventoryID ?? '']
        const isLand =
          isSolidTerrainHex(piece?.terrain) || isFluidTerrainHex(piece?.terrain)
        const showGhost =
          member.status !== 'blocked' && !!originalBp && !!member.previewBp
        const landGhost = () => {
          if (!member.previewBp || !piece) return null
          const { pieceCoords, altitude, rotation } = member.previewBp
          const support =
            boardHexes[genBoardHexID({ ...pieceCoords, altitude })]
          return (
            <LandPieceGhost
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
          <group key={member.uid}>
            <PlacementFootprint
              status={member.status}
              unsupported={member.unsupported}
              footprintHexes={member.footprintHexes}
              hoveredHex={member.pointerHex}
            />
            {showGhost && isLand && landGhost()}
            {showGhost &&
              piece?.terrain === HexTerrain.laurWallAddon &&
              member.previewBp && (
                <LaurAddonPreview
                  piece={piece}
                  coords={member.previewBp.pieceCoords}
                  altitude={member.previewBp.altitude}
                  rotation={member.previewBp.rotation}
                  unsupported={member.unsupported && member.status === 'ok'}
                  isRaycastable={false}
                />
              )}
            {showGhost &&
              !isLand &&
              piece?.terrain !== HexTerrain.laurWallAddon &&
              originalBp &&
              member.previewBp && (
                <OperationPiecePreviewItem
                  originalBp={originalBp}
                  previewBp={member.previewBp}
                  isRaycastable={false}
                />
              )}
          </group>
        )
      })}
    </>
  )
}
