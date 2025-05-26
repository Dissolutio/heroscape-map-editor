import { Instance, Instances, useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React, { useEffect } from 'react'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import { HEXGRID_HEXCAP_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import type {
  BoardHexPieceProps,
  CylinderGeometryArgs,
  DreiCapProps,
  InstanceRefType,
} from '../instance-hex'
import { terrainCapColors } from '../terrainCapColors'

const baseSolidCapCylinderArgs: CylinderGeometryArgs = [
  0.888,
  0.888,
  HEXGRID_HEXCAP_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

const SolidCaps = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  // const texture = useTexture('grass.png');
  const texture = useTexture('grass-ohs.png');
  // const texture = useTexture('grass-edited.jpg');
  // const texture = useTexture('Grass.jpg');
  // texture.center.set(0.5, 0.5); // Set the center of rotation to the middle of the texture
  // texture.rotation = Math.PI / 3
  // texture. = 2
  useEffect(() => {
    if (texture) {
      texture.center.set(0.5, 0.5); // Set the center of rotation to the middle of the texture
      texture.rotation = Math.PI; // Rotate 45 degrees (in radians)
      texture.needsUpdate = true; // Important: signal that the texture has been updated
    }
  }, [texture]);
  const ref = React.useRef<InstanceRefType>(undefined!)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  if (boardHexArr.length === 0) return null
  const range = boardHexArr.filter((bh) => bh.altitude <= viewingLevel).length
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      // limit={2}
      // range={boardHexArr.length}
      range={range}
      ref={ref}
      frustumCulled={false}
    >
      <cylinderGeometry args={baseSolidCapCylinderArgs} />
      {/* {isCameraDisabled ? <meshPhongMaterial wireframe={true} wireframeLinewidth={0.01} wireframeLinecap='' /> :
        <meshMatcapMaterial />} */}
      {/* {!isCameraDisabled ? <meshLambertMaterial opacity={0.8} transparent /> :
        <meshMatcapMaterial />} */}
      {/* <meshMatcapMaterial /> */}
      <meshBasicMaterial map={texture} />
      {boardHexArr.map((hex, i) => (
        <SolidCap
          key={hex.id + i}
          boardHex={hex}
          onPointerUp={onPointerUp}
          isVisible={range >= i}
        />
      ))}
    </Instances>
  )
}

export default SolidCaps

function SolidCap({
  boardHex,
  onPointerUp,
  isVisible,
}: BoardHexPieceProps & { isVisible: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = React.useRef<any>(undefined!)
  const { onPointerEnter, onPointerOut } = usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const penMode = useBoundStore((s) => s.penMode)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color = terrainCapColors[boardHex.terrain]
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(color)
    ref.current.position.set(x, y + HEXGRID_HEXCAP_HEIGHT / 2, z)
  }, [boardHex, color])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === boardHex.pieceID) {
      // ref.current.color.set('yellow')
    } else {
      ref.current.color.set(color)
    }
  }, [boardHex.pieceID, hoveredPieceID, color])

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref.current.color.set('yellow')
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    // if (hoveredPieceID !== boardHex.pieceID) {
    ref.current.color.set(color)
    onPointerOut(e)
    // }
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (e.button !== 0) {
      // THIS IS A RIGHT CLICK
      // TODO: Can paste in copied templates! BUT, user must agree to reading text/images from the clipboard
      // const myClipboard = await navigator.clipboard.readText()
      return
    }
    if (penMode === 'select') {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    } else {
      onPointerUp(e, boardHex)
    }
  }

  return (
    <group>
      <Instance
        ref={ref}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerOut}
        onPointerUp={handlePointerUp}
        frustumCulled={false}
      />
    </group>
  )
}
