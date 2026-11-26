import { Texture, SRGBColorSpace } from 'three'
import { describe, expect, it, vi } from 'vitest'
import * as voidMatGeometry from '../world/models/voidMatGeometry'
import {
  configureVoidMatTexture,
  getVoidMatFallbackMaterial,
  getVoidMatGeometry,
  getVoidMatMaterial,
} from '../world/models/voidMatResources'

describe('Void Mat shared rendering resources', () => {
  it('builds the mat geometry once for ten instances', () => {
    const buildGeometry = vi.spyOn(
      voidMatGeometry,
      'buildVoidMatGeometryArrays',
    )
    const geometries = Array.from({ length: 10 }, () => getVoidMatGeometry())

    expect(new Set(geometries).size).toBe(1)
    expect(buildGeometry).toHaveBeenCalledOnce()
  })

  it('configures a shared texture only once for ten instances', () => {
    let updateCount = 0
    const texture = {
      colorSpace: '',
      anisotropy: 0,
      set needsUpdate(value: boolean) {
        if (value) updateCount += 1
      },
    } as unknown as Texture

    for (let index = 0; index < 10; index += 1) {
      configureVoidMatTexture(texture)
    }

    expect(updateCount).toBe(1)
    expect(texture.colorSpace).toBe(SRGBColorSpace)
    expect(texture.anisotropy).toBe(8)
  })

  it('shares normal materials and highlights only the selected variant', () => {
    const texture = new Texture()
    const normalMaterials = Array.from({ length: 10 }, () =>
      getVoidMatMaterial(texture, false),
    )
    const selectedMaterial = getVoidMatMaterial(texture, true)

    expect(new Set(normalMaterials).size).toBe(1)
    expect(selectedMaterial).not.toBe(normalMaterials[0])
    expect(normalMaterials[0].color.getHexString()).toBe('ffffff')
    expect(selectedMaterial.color.getHexString()).toBe('fff59d')
    // Mats must write depth: without it the table drew over them (#442).
    expect(normalMaterials[0].depthWrite).toBe(true)
  })

  it('shares fallback materials for matching preview opacity', () => {
    const materials = Array.from({ length: 10 }, () =>
      getVoidMatFallbackMaterial('#123456', 0.4),
    )

    expect(new Set(materials).size).toBe(1)
    expect(materials[0].transparent).toBe(true)
    expect(materials[0].opacity).toBe(0.4)
  })
})
