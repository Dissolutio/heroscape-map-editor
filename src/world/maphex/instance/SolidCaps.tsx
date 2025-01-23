import { Instance, Instances } from '@react-three/drei'
import React from 'react'
import {
  CylinderGeometryArgs,
  DreiCapProps,
  DreiInstanceCapProps,
  InstanceRefType,
} from '../instance-hex'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { HEXGRID_HEXCAP_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { hexTerrainColor } from '../hexColors'
import { ThreeEvent } from '@react-three/fiber'
import useBoundStore from '../../../store/store'
import usePieceHoverState from '../../../hooks/usePieceHoverState'

const baseSolidCapCylinderArgs: CylinderGeometryArgs = [
  0.9,
  0.997,
  HEXGRID_HEXCAP_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

const SolidCaps = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const ref = React.useRef<InstanceRefType>(undefined!)
  // const isCameraDisabled = useBoundStore(s => s.isCameraDisabled)
  if (boardHexArr.length === 0) return null
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={boardHexArr.length}
      ref={ref}
      frustumCulled={false}
    >
      <cylinderGeometry args={baseSolidCapCylinderArgs} />
      {/* {isCameraDisabled ? <meshPhongMaterial wireframe={true} wireframeLinewidth={0.01} wireframeLinecap='' /> :
        <meshMatcapMaterial />} */}
      {/* {!isCameraDisabled ? <meshLambertMaterial opacity={0.8} transparent /> :
        <meshMatcapMaterial />} */}
      <meshMatcapMaterial />
      {boardHexArr.map((hex, i) => (
        <SolidCap
          key={hex.id + i}
          boardHex={hex}
          onPointerUp={onPointerUp}
          pieceID={hex?.pieceID ?? ''}
        />
      ))}
    </Instances>
  )
}

export default SolidCaps

function SolidCap({
  boardHex,
  onPointerUp,
  pieceID
}: DreiInstanceCapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = React.useRef<any>(undefined!)
  const {
    onPointerEnter,
    onPointerOut,
  } = usePieceHoverState()
  // const toggleSelectedPieceID = useBoundStore(s => s.toggleSelectedPieceID)
  const hoveredPieceID = useBoundStore(s => s.hoveredPieceID)
  const color = hexTerrainColor[boardHex.terrain]
  // const selectedPieceID = useBoundStore(s => s.selectedPieceID)

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(color)
    ref.current.position.set(x, y, z)
  }, [boardHex, color])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === pieceID) {
      // ref.current.color.set('yellow')
    } else {
      ref.current.color.set(color)
    }
  }, [pieceID, hoveredPieceID, color])

  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref.current.color.set('yellow')
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    // if (hoveredPieceID !== boardHex.pieceID) {
    ref.current.color.set(color)
    onPointerOut(e)
    // }
  }
  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    onPointerUp(e, boardHex)
  }

  return (
    <group>
      <Instance
        ref={ref}
        onPointerUp={handleUp}
        onPointerEnter={handleEnter}
        onPointerLeave={handleOut}
        frustumCulled={false}
      />
    </group>
  )
}
