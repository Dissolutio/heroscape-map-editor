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

export default function LaurWallTrianglePillar({
  boardHex,
  isUnderHexFluid,
}: {
  boardHex: BoardHex
  isUnderHexFluid: boolean
}) {
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const { x, z, yWithBase, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords(boardHex)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { nodes } = useGLTF('/laur-triangle-pillar.glb') as any
  const pieceRotation = ((boardHex?.pieceRotation ?? 0) % 6) * -Math.PI / 3

  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)

  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }


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
        onPointerUp={onPointerUp}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <group position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}>
          <mesh geometry={nodes.TrianglePillarTop.geometry}>
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
          <mesh geometry={nodes.TriangleSubDecorCore.geometry}>
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : interiorPillarColor}
            />
          </mesh>
          <mesh geometry={nodes.TriangleFacade.geometry}>
            <meshMatcapMaterial
              side={DoubleSide}
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
          <mesh geometry={nodes.TriangleFacadeInner.geometry}>
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
          </mesh>
        </group>
      </group>
    </>
  )
}

useGLTF.preload('/laur-triangle-pillar.glb')
