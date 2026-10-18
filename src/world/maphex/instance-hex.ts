import type { ThreeEvent } from '@react-three/fiber'
import type { InstancedMesh, NormalBufferAttributes } from 'three'
import type { BufferGeometry } from 'three'
import type { Material } from 'three'
import type { InstancedMeshEventMap } from 'three'
import type { BoardHex } from '../../types'

export type CylinderGeometryArgs =
  | [
      radiusTop?: number | undefined,
      radiusBottom?: number | undefined,
      height?: number | undefined,
      radialSegments?: number | undefined,
      heightSegments?: number | undefined,
      openEnded?: boolean | undefined,
      thetaStart?: number | undefined,
      thetaLength?: number | undefined,
    ]
  | undefined
export type DreiCapProps = {
  boardHexArr: BoardHex[]
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}
export type BoardHexPieceProps = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export type InstanceRefType = InstancedMesh<
  BufferGeometry<NormalBufferAttributes>,
  Material | Material[],
  InstancedMeshEventMap
>
