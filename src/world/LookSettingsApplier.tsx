import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  NoToneMapping,
  type ToneMapping as ThreeToneMapping,
} from 'three'
import { clampLookRoughness, type ToneMapping } from '../data/lookSettings'
import useBoundStore from '../store/store'
import { MODEL_MOUNTED_EVENT } from './shadowInvalidation'

const toneMappings: Record<ToneMapping, ThreeToneMapping> = {
  none: NoToneMapping,
  neutral: NeutralToneMapping,
  aces: ACESFilmicToneMapping,
  agx: AgXToneMapping,
}

export default function LookSettingsApplier() {
  const lookSettings = useBoundStore((state) => state.lookSettings)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const { gl, invalidate, scene } = useThree()
  const standardMaterials = useRef(new Set<MeshStandardMaterial>())

  useEffect(() => {
    const toneMapping = toneMappings[lookSettings.toneMapping]
    if (gl.toneMapping !== toneMapping) {
      gl.toneMapping = toneMapping
      scene.traverse((object) => {
        if (!(object instanceof Mesh)) return
        const mesh = object
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        for (const material of materials) material.needsUpdate = true
      })
    }
    gl.toneMappingExposure = lookSettings.exposure
    invalidate()
  }, [gl, invalidate, lookSettings.exposure, lookSettings.toneMapping, scene])

  // biome-ignore lint/correctness/useExhaustiveDependencies: rescan after board meshes commit
  useEffect(() => {
    const refreshMaterials = () => {
      const nextMaterials = new Set<MeshStandardMaterial>()
      scene.traverse((object) => {
        if (!(object instanceof Mesh)) return
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]
        for (const material of materials) {
          if (
            !(material instanceof MeshStandardMaterial) ||
            material.userData.lookShineHandled
          ) {
            continue
          }
          nextMaterials.add(material)
          if (typeof material.userData.lookBaseRoughness !== 'number') {
            material.userData.lookBaseRoughness = material.roughness
          }
        }
      })
      standardMaterials.current = nextMaterials
      for (const material of nextMaterials) {
        material.roughness = clampLookRoughness(
          material.userData.lookBaseRoughness as number,
          useBoundStore.getState().lookSettings.shine,
        )
      }
    }

    refreshMaterials()
    window.addEventListener(MODEL_MOUNTED_EVENT, refreshMaterials)
    return () =>
      window.removeEventListener(MODEL_MOUNTED_EVENT, refreshMaterials)
  }, [boardPieces, scene])

  useEffect(() => {
    for (const material of standardMaterials.current) {
      material.roughness = clampLookRoughness(
        material.userData.lookBaseRoughness as number,
        lookSettings.shine,
      )
    }
  }, [lookSettings.shine])

  return <color attach="background" args={[lookSettings.backgroundColor]} />
}
