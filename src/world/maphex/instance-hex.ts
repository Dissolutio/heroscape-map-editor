import { ThreeEvent } from '@react-three/fiber'
import { BoardHex } from '../../types'
import { InstancedMesh, NormalBufferAttributes } from 'three'
import { BufferGeometry } from 'three'
import { Material } from 'three'
import { InstancedMeshEventMap } from 'three'

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
export type DreiInstanceCapProps = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
  pieceID: string
}

export type InstanceRefType = InstancedMesh<
  BufferGeometry<NormalBufferAttributes>,
  Material | Material[],
  InstancedMeshEventMap
>
