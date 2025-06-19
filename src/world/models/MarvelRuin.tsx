import { useGLTF } from '@react-three/drei'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import useBoundStore from '../../store/store'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import { Pieces, type BoardHex } from '../../types'
import { DoubleSide } from 'three'

export function MarvelRuin({
  boardHex,
}: {
  boardHex: BoardHex
}) {
  const { nodes } = useGLTF('/marvel-ruins.glb') as any
  const { x, z, yBaseCap } = getBoardHex3DCoords(boardHex)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isUpperFloor =
    boardHex.inventoryID === Pieces.marvel ||
    boardHex.inventoryID === Pieces.marvelBroken
  const isWallIntact =
    boardHex.inventoryID === Pieces.marvel ||
    boardHex.inventoryID === Pieces.marvelNoUpper
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
  const colorMarvelRuin = isHighlighted
    ? yellowColor
    : hexTerrainColor.marvelRuin
  const colorUpperFloor = isHighlighted ? yellowColor : hexTerrainColor.ladder
  return (
    <group
      position={[x, yBaseCap, z]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
      onPointerUp={(e) => onPointerUp(e)}
    >
      <mesh receiveShadow castShadow geometry={nodes.MarvelRuinMain.geometry}>
        <meshStandardMaterial color={colorMarvelRuin} side={DoubleSide} />
      </mesh>
      {isUpperFloor && (
        <mesh
          receiveShadow
          castShadow
          geometry={nodes.MarvelRuinUpperFloor.geometry}
        >
          <meshStandardMaterial color={colorUpperFloor} side={DoubleSide} />
        </mesh>
      )}
      {isWallIntact && (
        <mesh
          receiveShadow
          castShadow
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
        >
          <meshStandardMaterial color={colorMarvelRuin} side={DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/marvel-ruins.glb')
