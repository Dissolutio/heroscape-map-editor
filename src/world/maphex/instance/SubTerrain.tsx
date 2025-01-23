import { Instance, Instances } from '@react-three/drei'
import React from 'react'
import { BoardHex, HexTerrain } from '../../../types'
import { CylinderGeometryArgs, InstanceRefType } from '../instance-hex'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { HEXGRID_HEX_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { hexTerrainColor } from '../hexColors'
import { ThreeEvent } from '@react-three/fiber'
import useBoundStore from '../../../store/store'
import usePieceHoverState from '../../../hooks/usePieceHoverState'

type Props = {
  boardHexArr: BoardHex[]
}

const baseSubTerrainCylinderArgs: CylinderGeometryArgs = [
  1,
  1,
  HEXGRID_HEX_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]
const dirtColor = hexTerrainColor[HexTerrain.dirt]

const SubTerrains = ({ boardHexArr }: Props) => {
  const ref = React.useRef<InstanceRefType>(undefined!)
  // const isCameraDisabled = useBoundStore(s => s.isCameraDisabled)
  // const viewingLevel = useBoundStore(s => s.viewingLevel)
  if (boardHexArr.length === 0) return null
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={boardHexArr.length}
      ref={ref}
      frustumCulled={false}
    >
      <cylinderGeometry args={baseSubTerrainCylinderArgs} />
      {/* {!isCameraDisabled ? <meshPhongMaterial opacity={0.8} transparent /> :
        <meshMatcapMaterial />} */}
      {/* {viewingLevel !== 0 ? <meshPhongMaterial wireframe={true} wireframeLinewidth={0.01} /> :
        <meshMatcapMaterial />} */}
      <meshMatcapMaterial />
      {boardHexArr.map((hex, i) => (
        <SubTerrain key={hex.id + i + 'sub'}
          boardHex={hex}
          pieceID={hex?.pieceID ?? ''}
        />
      ))}
    </Instances>
  )
}

export default SubTerrains

function SubTerrain({
  boardHex,
  pieceID
}: {
  boardHex: BoardHex,
  pieceID: string
}) {
  const hoveredPieceID = useBoundStore(s => s.hoveredPieceID)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = React.useRef<any>(undefined!)
  const isDirtSubterrain =
    boardHex.terrain === HexTerrain.grass ||
    boardHex.terrain === HexTerrain.sand ||
    boardHex.terrain === HexTerrain.rock
  const subTerrainColor = isDirtSubterrain
    ? dirtColor
    : hexTerrainColor[boardHex.terrain]
  const {
    onPointerEnter,
    onPointerOut,
  } = usePieceHoverState()
  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, z, y } = getBoardHex3DCoords(boardHex)
    const bottom = y - HEXGRID_HEX_HEIGHT
    const posY = (y + bottom) / 2 // place it halfway between top and bottom
    ref.current.color.set(subTerrainColor)
    ref.current.position.set(x, posY, z)
  }, [boardHex, subTerrainColor])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === pieceID) {
      ref.current.color.set('yellow')
    } else {
      ref.current.color.set(subTerrainColor)
    }
  }, [pieceID, hoveredPieceID, subTerrainColor])

  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref.current.color.set('yellow')
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    if (hoveredPieceID !== boardHex.pieceID) {
      ref.current.color.set(subTerrainColor)
      onPointerOut(e)
    }
  }

  return (
    <Instance
      ref={ref}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => e.stopPropagation()} // prevent clicks from affecting behind subterrains
      // onPointerEnter={(e: ThreeEvent<PointerEvent>) => e.stopPropagation()} // prevent clicks from affecting behind subterrains
      onPointerEnter={handleEnter}
      onPointerOut={handleOut}
      frustumCulled={false}
    />
  )
}
