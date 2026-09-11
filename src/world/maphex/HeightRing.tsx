import { type Object3DNode, extend } from '@react-three/fiber'
import React from 'react'
import { BufferGeometry, Color, Line, Vector3 } from 'three'
import type { BoardHex } from '../../types'
import { hexPoints3DFromCenter } from '../../utils/map-utils'

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
  // we go around thrice so that interlock rotations have something to slice off
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
export function TopOutlineInterlockHex({
  position,
  boardHex,
}: { position: Vector3; boardHex: BoardHex }) {
  // SITE OF STRANGE BUG: somehow, pieceRotation is a string, sometimes, not a number, and throws off the geo logic (no idea how!)
  // console.log("🚀 ~ TopOutlineInterlockHex ~ boardHex.pieceRotation:", boardHex.pieceRotation, typeof boardHex.pieceRotation)
  const color = boardHex.terrain === 'asphalt' ? 'gray' : 'black'
  // 0,1,2,3,3B,4,4B,5,6
  const interlockRotation = React.useMemo(
    () =>
      ((boardHex?.interlockRotation ?? 0) +
        Number.parseInt(String(boardHex.pieceRotation))) %
      6,
    [boardHex.interlockRotation, boardHex.pieceRotation],
  )
  const geos = getGeo(boardHex?.interlockType ?? '', interlockRotation)
  if (boardHex.interlockType === '0') {
    return null
  }
  return geos.map((g, index) => (
    <line_
      key={`${boardHex.id}${index}`}
      geometry={g}
      position={new Vector3(position.x, position.y + 0.01, position.z)}
      frustumCulled={false}
    >
      <lineBasicMaterial attach="material" color={color} linewidth={1} />
    </line_>
  ))
}
// Cache for interlock geometries to avoid GPU memory leaks
const interlockGeoCache = new Map<number, BufferGeometry[]>()

const createInterlockGeo = (rotation: number, size: number): BufferGeometry => {
  const points = hexPoints.slice(0 + rotation, 0 + rotation + size)
  return new BufferGeometry().setFromPoints(points)
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const getGeo = (interlockType: string, interlockRotation: number): any[] => {
  const cacheKey = (interlockType.charCodeAt(0) << 16) | interlockRotation
  const cached = interlockGeoCache.get(cacheKey)
  if (cached) {
    return cached
  }

  let geos: BufferGeometry[] = []

  if (interlockType === '1') {
    geos = [createInterlockGeo(interlockRotation, 2)]
  } else if (interlockType === '2') {
    geos = [createInterlockGeo(interlockRotation, 3)]
  } else if (interlockType === '3') {
    geos = [createInterlockGeo(interlockRotation, 4)]
  } else if (interlockType === '4') {
    geos = [createInterlockGeo(interlockRotation, 5)]
  } else if (interlockType === '5') {
    geos = [createInterlockGeo(interlockRotation, 6)]
  } else if (interlockType === '6') {
    geos = [interlock6Geo]
  } else if (interlockType === '3B') {
    geos = [
      createInterlockGeo(interlockRotation + 5, 2),
      createInterlockGeo(interlockRotation + 1, 3),
    ]
  } else if (interlockType === '4B') {
    geos = [
      createInterlockGeo(interlockRotation + 1, 3),
      createInterlockGeo(interlockRotation + 4, 3),
    ]
  }

  interlockGeoCache.set(cacheKey, geos)
  return geos
}
