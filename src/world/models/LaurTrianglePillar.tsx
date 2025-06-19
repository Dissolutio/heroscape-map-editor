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
  onPointerUp,
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
  const { nodes } = useGLTF('/laur-triangle-pillar.glb') as any
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
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <group
          position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}
          rotation={[0, pieceRotation, 0]}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.TrianglePillarTop.geometry}
          >
            <meshStandardMaterial
              side={DoubleSide}
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.TriangleSubDecorCore.geometry}
          >
            <meshStandardMaterial
              color={isHighlighted ? yellowColor : interiorPillarColor}
            />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.TriangleFacade.geometry}
          >
            <meshStandardMaterial
              // side={DoubleSide}
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.TriangleFacadeInner.geometry}
          >
            <meshStandardMaterial
              side={DoubleSide}
              color={isHighlighted ? yellowColor : interiorPillarColor}
            />
          </mesh>
        </group>
        <group position={[0, 0, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={baseCylinderArgs} />
            <meshStandardMaterial
              color={isHighlighted ? yellowColor : pillarColor}
            />
          </mesh>
        </group>
      </group>
    </>
  )
}

useGLTF.preload('/laur-triangle-pillar.glb')
