import { Object3DNode, extend } from '@react-three/fiber'
import { BufferGeometry, Color, Line, Vector3 } from 'three'
import { hexPointsFromCenter } from '../../utils/map-utils'

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
const ringGeo = new BufferGeometry().setFromPoints([
  hexPointsFromCenter.topRight,
  hexPointsFromCenter.bottomRight,
  hexPointsFromCenter.bottom,
  hexPointsFromCenter.bottomLeft,
  hexPointsFromCenter.topLeft,
  hexPointsFromCenter.top,
  hexPointsFromCenter.topRight,
])
export default function HeightRing({ position }: { position: Vector3 }) {
  return (
    <line_
      geometry={ringGeo}
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
        transparent
        opacity={0.2}
        color={new Color('#a4a4a4')}
        linewidth={position.y === 0 ? 1 : 3} // hacky
      />
    </line_>
  )
}
