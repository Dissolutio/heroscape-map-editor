import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'

export default function ForestTree({ boardHex }: { boardHex: BoardHex }) {
  const {
    nodes,
    //  materials
  } = useGLTF('/forgotten-forest-tree-low-poly-colored.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
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
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.tree]
  return (
    <>
      {isSelected && (
        <DeletePieceBillboard pieceID={boardHex.pieceID} y={100} />
      )}
      <mesh
        geometry={nodes.Tree10_scanned.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
        // material={materials.ForestTree}
      >
        <meshMatcapMaterial color={color} />
      </mesh>
      {/* <Billboard
        position={[x, options.y + 1.5, z]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
        scale={[1, 3, 1]}
        onPointerEnter={e => e.stopPropagation()}
      >
        <Image url='tree-img.jpg'></Image>
      </Billboard> */}
    </>
  )
}

useGLTF.preload('/forgotten-forest-tree-low-poly-colored.glb')
