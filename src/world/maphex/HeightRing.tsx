import { type Object3DNode, extend } from '@react-three/fiber'
import { BufferGeometry, Color, Line, Vector3 } from 'three'
import { hexPoints3DFromCenter } from '../../utils/map-utils'
import { BoardHex } from '../../types'

// this extension for line_ is because, if we just use <line></line> then we get an error:
// Property 'geometry' does not exist on type 'SVGProps<SVGLineElement>'
// So, following advice found in issue: https://github.com/pmndrs/react-three-fiber/discussions/1387
extend({ Line_: Line })
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      line_: Object3DNode<Line, typeof Line>
    }
  }
}
const hexPoints = [
  // we go around twice so that interlock rotations have something to slice off
  // hexPoints3DFromCenter.center,
  hexPoints3DFromCenter.topRight,
  hexPoints3DFromCenter.bottomRight,
  hexPoints3DFromCenter.bottom,
  hexPoints3DFromCenter.bottomLeft,
  hexPoints3DFromCenter.topLeft,
  hexPoints3DFromCenter.top,
  hexPoints3DFromCenter.topRight,
  hexPoints3DFromCenter.bottomRight,
  hexPoints3DFromCenter.bottom,
  hexPoints3DFromCenter.bottomLeft,
  hexPoints3DFromCenter.topLeft,
  hexPoints3DFromCenter.top,
  hexPoints3DFromCenter.topRight,
]
const interlock6Geo = new BufferGeometry().setFromPoints([
  // hexPoints3DFromCenter.center,
  hexPoints3DFromCenter.topRight,
  hexPoints3DFromCenter.bottomRight,
  hexPoints3DFromCenter.bottom,
  hexPoints3DFromCenter.bottomLeft,
  hexPoints3DFromCenter.topLeft,
  hexPoints3DFromCenter.top,
  hexPoints3DFromCenter.topRight,
])
export default function HeightRing({ position }: { position: Vector3 }) {
  return (
    <line_
      geometry={interlock6Geo}
      position={
        position.y === 0
          ? new Vector3(position.x, position.y + 0.01, position.z)
          : position
      } // hacky
      frustumCulled={false}
    >
      <lineBasicMaterial
        attach="material"
        // warning, opacity can be a bit fps expensive
        // transparent
        // opacity={0.2}
        color={new Color('#535353')}
        linewidth={position.y === 0 ? 1 : 0.3} // hacky
      />
    </line_>
  )
}
export function TopOutlineInterlockHex({ position, boardHex }: { position: Vector3, boardHex: BoardHex }) {
  // 0,1,2,3,3B,4,4B,5,6
  const geo = getGeo(boardHex?.interlockType ?? '', boardHex?.interlockRotation ?? 0)
  if (boardHex.interlockType === '0') {
    return null
  }
  return (
    <line_
      geometry={geo}
      position={
        position.y === 0
          ? new Vector3(position.x, position.y + 0.01, position.z)
          : position
      }
      frustumCulled={false}
    >
      <lineBasicMaterial
        attach="material"
        color={new Color('black')}
        linewidth={1}
      />
    </line_>
  )
}
const getGeo = (interlockType: string, interlockRotation: number) => {
  if (interlockType === '1') {
    return getInterlock1Geo(interlockRotation)
  }
  if (interlockType === '2') {
    return getInterlock2Geo(interlockRotation)
  }
  if (interlockType === '3') {
    return getInterlock3Geo(interlockRotation)
  }
  if (interlockType === '4') {
    return getInterlock4Geo(interlockRotation)
  }
  if (interlockType === '5') {
    return getInterlock5Geo(interlockRotation)
  }
}
const getInterlock1Geo = (interlockRotation: number) => {
  const points = hexPoints.slice(0 + interlockRotation, (0 + interlockRotation + 2))
  return new BufferGeometry().setFromPoints(points)
}
const getInterlock2Geo = (interlockRotation: number) => {
  const points = hexPoints.slice(0 + interlockRotation, 0 + interlockRotation + 3)
  return new BufferGeometry().setFromPoints(points)
}
const getInterlock3Geo = (interlockRotation: number) => {
  const points = hexPoints.slice(0 + interlockRotation, 0 + interlockRotation + 4)
  return new BufferGeometry().setFromPoints(points)
}
const getInterlock4Geo = (interlockRotation: number) => {
  const points = hexPoints.slice(0 + interlockRotation, 0 + interlockRotation + 5)
  return new BufferGeometry().setFromPoints(points)
}
const getInterlock5Geo = (interlockRotation: number) => {
  const points = hexPoints.slice(0 + interlockRotation, 0 + interlockRotation + 6)
  return new BufferGeometry().setFromPoints(points)
}