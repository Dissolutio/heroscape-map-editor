import useBoundStore from "../store/store";
import { HEXGRID_HEX_APOTHEM, HEXGRID_HEX_RADIUS } from "../utils/constants";

export function TableSurfaceMesh({
  width,
  length,
}: { width: number; length: number }) {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  if (!isHighQualityRender) {
    return null
  }
  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[
        width ? width / 2 - HEXGRID_HEX_APOTHEM : 0,
        -0.01,
        length ? length / 2 - HEXGRID_HEX_RADIUS : 0,
      ]}
    >
      <planeGeometry args={[2 * width, 2 * length]} />
      {/* <shadowMaterial color="white" opacity={1} /> */}
      {/* <meshStandardMaterial color="brown" opacity={1} /> */}
      <meshPhongMaterial color="white" opacity={1} />
    </mesh>
  )
}

