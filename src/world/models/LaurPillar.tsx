import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { DoubleSide } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import {
  HEXGRID_GLYPH_HEIGHT,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_HEIGHT,
} from '../../utils/constants'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'
import type { CylinderGeometryArgs } from '../maphex/instance-hex'

// function getPillarReport({
//   boardHexes,
//   boardPieces,
//   boardHex
// }: {
//   boardHexes: BoardHexes
//   boardPieces: BoardPieces
//   boardHex: BoardHex
// }) {
//   const pillarAddons = Object.keys(boardPieces)
//     .map(key => decodePieceID(key))
//     .filter(piece => piece.pieceID === Pieces.laurWallLong ||
//       piece.pieceID === Pieces.laurWallShort ||
//       piece.pieceID === Pieces.laurWallRuin)
//   const sideLandHexes = pillarSideRotations.map(sideRot => {
//     const actualRotation = (boardHex.pieceRotation + sideRot) % 6
//     return getHexNeighborByRotAlt(boardHex, boardHexes, actualRotation, -1) // pass -1 to get one below pillar
//   })
//   const sidePillarHexes = pillarSideRotations.map(sideRot => {
//     const actualRotation = (boardHex.pieceRotation + sideRot) % 6
//     const pillarHex = getHexNeighborByRotAlt(boardHex, boardHexes, actualRotation)
//     if (pillarHex?.pieceID?.includes(Pieces.laurWallPillar) && pillarHex?.isObstacleOrigin) {
//       return pillarHex
//     } else {
//       return
//     }
//   })
//   const sideCanBuildRuins = pillarSideRotations.map(sideRot => {
//     const actualRotation = (boardHex.pieceRotation + sideRot) % 6
//     console.log("🚀 ~ actualRotation:", actualRotation)
//     const coordsObstructedByRuins = Number.isInteger(actualRotation)
//       ? [hexUtilsGetNeighborForRotation(actualRotation)]
//       : hexUtilsGetRadialNearNeighborsForRotation(actualRotation)
//     const piecePlaneCoords = coordsObstructedByRuins.filter(c => !!c).map((coord) =>
//       hexUtilsAdd(coord, { q: boardHex.q, r: boardHex.r, s: boardHex.s, }),
//     )
//     console.log("🚀 ~ piecePlaneCoords:", piecePlaneCoords)
//     const isVerticalClearanceForPiece = piecePlaneCoords.every((coord, i) => {
//       if (!coord) { return false }
//       const clearanceHexIds = Array(10) //using 10, not 9, because unlike in addPiece we are not starting from the placement altitude
//         .fill(0)
//         .map((_, j) => {
//           const altitude = boardHex.altitude + j
//           return genBoardHexID({ ...piecePlaneCoords[i], altitude })
//         })
//       return clearanceHexIds.every((clearanceHexId) => {
//         const hex = boardHexes?.[clearanceHexId]
//         if (!hex) return true // if no boardHex is written, then it is definitely empty
//         const terrain = hex.terrain
//         const isBlocked =
//           isSolidTerrainHex(terrain) ||
//           isFluidTerrainHex(terrain)
//         return !isBlocked
//       })
//     })
//     if (isVerticalClearanceForPiece) {
//       return true
//     } else {
//       return false
//     }
//   })

//   // console.log("🚀 ~ pillarAddons ~ pillarAddons:", pillarAddons)
//   // console.log("🚀 ~ sideLandHexes:", sideLandHexes)
//   // console.log("🚀 ~ sidePillarHexes:", sidePillarHexes)
//   // console.log("🚀 ~ sideCanBuildRuins:", sideCanBuildRuins)
// }

const baseCylinderArgs: CylinderGeometryArgs = [
  0.9,
  0.997,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

export default function LaurWallPillar({
  boardHex,
  isUnderHexFluid,
  onPointerUp

}: {
  boardHex: BoardHex
  isUnderHexFluid: boolean
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const { x, z, yWithBase, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords(boardHex)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const { nodes } = useGLTF('/laurwall-pillar.glb') as any
  const pieceRotation = (((boardHex?.pieceRotation ?? 0) % 6) * -Math.PI) / 3

  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)

  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected

  return (
    <>
      <group position={[x, yWithBase, z]}>
        {isSelected && (
          <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />
        )}
      </group>
      <group
        position={[
          x,
          isUnderHexFluid
            ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT
            : yGlyph + HEXGRID_GLYPH_HEIGHT - HEXGRID_HEXCAP_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <group position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}>
          <mesh geometry={nodes.PillarTop.geometry}>
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
          <mesh geometry={nodes.SubDecorCore.geometry}>
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : interiorPillarColor}
            />
          </mesh>
          <mesh geometry={nodes.Facade.geometry}>
            <meshMatcapMaterial
              side={DoubleSide}
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
          <mesh geometry={nodes.FacadeInner.geometry}>
            <meshMatcapMaterial
              side={DoubleSide}
              color={isHighlighted ? yellowColor : interiorPillarColor}
            />
          </mesh>
        </group>
        <group position={[0, 0, 0]}>
          <mesh>
            <cylinderGeometry args={baseCylinderArgs} />
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : pillarColor}
            />
            {/* <meshLambertMaterial
              transparent
              opacity={0.3}
              color={isHighlighted ? yellowColor : pillarColor}
            /> */}
          </mesh>
        </group>
      </group>
    </>
  )
}

useGLTF.preload('/laurwall-pillar.glb')
