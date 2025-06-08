
import { useGLTF } from '@react-three/drei'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import useBoundStore from '../../store/store'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import type { BoardHex } from '../../types'
import { DoubleSide } from 'three'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'

export function MarvelRuin({
  boardHex,
}: {
  boardHex: BoardHex
}) {
  const { nodes } = useGLTF('/marvel-ruins.glb') as any
  const { x, z, y: yo } = getBoardHex3DCoords(boardHex)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
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
  const isHighlighted = isHovered || isSelected
  const yellowColor = 'yellow'
  const rotation = boardHex?.pieceRotation ?? 0
  return (
    <group
      // position={[x + options.xAdd, y, z + options.zAdd]}
      //   rotation={[0, options.rotationY, 0]}
      position={[x, yo, z]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
      onPointerUp={(e) => onPointerUp(e)}
    >
      <mesh
        // castShadow
        // receiveShadow
        geometry={nodes.MarvelRuinMain.geometry}
        material={nodes.MarvelRuinMain.material}
        position={[24.867, 1.75, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <meshMatcapMaterial
          color={hexTerrainColor.marvelRuin}
          side={DoubleSide}
        />
      </mesh>
      <mesh
        // castShadow
        // receiveShadow
        geometry={nodes.MarvelRuinUpperFloor.geometry}
        material={nodes.MarvelRuinUpperFloor.material}
        position={[24.867, 1.75, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <meshMatcapMaterial
          color={hexTerrainColor.ladder}
          side={DoubleSide}
        />
      </mesh>
      <mesh
        // castShadow
        // receiveShadow
        geometry={nodes.MarvelRuinRemoveableWall.geometry}
        material={nodes.MarvelRuinRemoveableWall.material}
        position={[27.577, 1.304, 1.501]}
        rotation={[-Math.PI / 2, 1.43, -Math.PI]}
        scale={[1.275, 1.264, 1.737]}
      >
        <meshMatcapMaterial
          color={hexTerrainColor.marvelRuin}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

useGLTF.preload('/marvel-ruins.glb')