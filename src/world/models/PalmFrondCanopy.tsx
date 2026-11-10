import { useLayoutEffect, useMemo, useState } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  DoubleSide,
  MeshDepthMaterial,
  MeshDistanceMaterial,
  MeshStandardMaterial,
  Object3D,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'
import type { InstancedMesh } from 'three'
import type { GraphicsTier } from '../../local-storage/settings'
import {
  MODEL_HIGHLIGHT_EMISSIVE,
  MODEL_HIGHLIGHT_EMISSIVE_INTENSITY,
} from './texturedModelMaterial'
import {
  PALM_FROND_BASE_DROOP,
  PALM_FROND_BASE_WIDTH,
  PALM_FROND_BLADE_WIDTH,
  type PalmStyle,
  applyPalmFrondInstances,
  buildPalmFrondGeometry,
  buildPalmFrondInstances,
  getPalmFrondRings,
} from './palmFronds'

const alphaTest = 0.25
const undergrowthCount = 6
const textureCache = new Map<
  PalmStyle,
  {
    frond: CanvasTexture
    undergrowth: CanvasTexture
    bark: CanvasTexture
    barkNormal: DataTexture
  }
>()
const frondGeometryCache = new Map<string, BufferGeometry>()
let undergrowthGeometry: BufferGeometry | undefined
const frondMaterialCache = new Map<string, MeshStandardMaterial>()
const undergrowthMaterialCache = new Map<string, MeshStandardMaterial>()
const barkMaterialCache = new Map<string, MeshStandardMaterial>()
const depthMaterialCache = new Map<string, MeshDepthMaterial>()
const distanceMaterialCache = new Map<string, MeshDistanceMaterial>()

export function clearPalmCanopyCache() {
  for (const material of [
    ...frondMaterialCache.values(),
    ...undergrowthMaterialCache.values(),
    ...barkMaterialCache.values(),
    ...depthMaterialCache.values(),
    ...distanceMaterialCache.values(),
  ]) {
    material.dispose()
  }
  for (const textures of textureCache.values()) {
    textures.frond.dispose()
    textures.undergrowth.dispose()
    textures.bark.dispose()
    textures.barkNormal.dispose()
  }
  for (const geometry of frondGeometryCache.values()) {
    geometry.dispose()
  }
  undergrowthGeometry?.dispose()
  textureCache.clear()
  frondGeometryCache.clear()
  frondMaterialCache.clear()
  undergrowthMaterialCache.clear()
  barkMaterialCache.clear()
  depthMaterialCache.clear()
  distanceMaterialCache.clear()
  undergrowthGeometry = undefined
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function makeFrondTexture(style: PalmStyle) {
  const canvas = makeCanvas(512, 128)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create palm frond texture')

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, '#284a20')
  gradient.addColorStop(0.55, '#477a2b')
  gradient.addColorStop(1, '#a2a846')
  const bladeGradient = context.createLinearGradient(0, 0, canvas.width, 0)
  bladeGradient.addColorStop(0, '#365f29')
  bladeGradient.addColorStop(0.55, '#628b36')
  bladeGradient.addColorStop(1, '#b0b85f')
  const halfWidthAt = (along: number) =>
    57 * Math.sin(Math.PI * along) ** (style === 'laur' ? 0.72 : 0.84)
  const serrationAt = (step: number) =>
    style === 'laur' ? (step % 4 < 2 ? 1 : -1) * 4 : Math.sin(step * 0.9) * 1.4
  const centerY = canvas.height / 2

  context.fillStyle = bladeGradient
  context.beginPath()
  context.moveTo(0, centerY)
  for (let step = 1; step <= 64; step += 1) {
    const along = step / 64
    context.lineTo(
      along * canvas.width,
      centerY - halfWidthAt(along) * PALM_FROND_BLADE_WIDTH[style],
    )
  }
  for (let step = 64; step >= 1; step -= 1) {
    const along = step / 64
    context.lineTo(
      along * canvas.width,
      centerY + halfWidthAt(along) * PALM_FROND_BLADE_WIDTH[style],
    )
  }
  context.closePath()
  context.fill()

  context.globalCompositeOperation = 'destination-over'
  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(0, centerY)
  for (let step = 1; step <= 64; step += 1) {
    const along = step / 64
    context.lineTo(
      along * canvas.width,
      centerY - halfWidthAt(along) + serrationAt(step),
    )
  }
  for (let step = 64; step >= 1; step -= 1) {
    const along = step / 64
    context.lineTo(
      along * canvas.width,
      centerY + halfWidthAt(along) - serrationAt(step),
    )
  }
  context.closePath()
  context.fill()
  context.globalCompositeOperation = 'source-over'

  context.strokeStyle = 'rgba(204, 207, 123, 0.8)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(2, centerY)
  context.lineTo(canvas.width - 3, centerY)
  context.stroke()
  context.strokeStyle = 'rgba(35, 57, 25, 0.5)'
  context.lineWidth = 1.5
  for (let step = 5; step < 48; step += 5) {
    const along = step / 64
    const halfWidth = halfWidthAt(along + 0.09) * 0.84
    for (const side of [-1, 1] as const) {
      context.beginPath()
      context.moveTo(along * canvas.width, centerY)
      context.lineTo((along + 0.09) * canvas.width, centerY + side * halfWidth)
      context.stroke()
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function makeUndergrowthTexture(style: PalmStyle) {
  const canvas = makeCanvas(128, 256)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create jungle foliage texture')

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#a5aa49')
  gradient.addColorStop(0.36, '#597f2e')
  gradient.addColorStop(1, '#29461f')
  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(64, 256)
  context.lineTo(style === 'laur' ? 50 : 46, 183)
  context.lineTo(22, 161)
  context.lineTo(44, 168)
  context.lineTo(16, 110)
  context.lineTo(51, 151)
  context.lineTo(47, 74)
  context.lineTo(64, 138)
  context.lineTo(80, 66)
  context.lineTo(77, 148)
  context.lineTo(111, 102)
  context.lineTo(84, 166)
  context.lineTo(110, 150)
  context.lineTo(77, 193)
  context.closePath()
  context.fill()
  context.strokeStyle = 'rgba(194, 198, 104, 0.7)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(64, 252)
  context.lineTo(64, 130)
  context.stroke()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function makeBarkTextures(style: PalmStyle) {
  const canvas = makeCanvas(128, 256)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create palm bark texture')

  context.fillStyle = style === 'laur' ? '#70513a' : '#705443'
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (let row = 0; row < 32; row += 1) {
    const y = row * 8 + ((row % 3) - 1) * 1.5
    context.strokeStyle =
      row % 3 === 0 ? 'rgba(34, 27, 21, 0.48)' : 'rgba(172, 132, 91, 0.28)'
    context.lineWidth = row % 3 === 0 ? 2 : 1
    context.beginPath()
    context.moveTo(0, y)
    context.bezierCurveTo(35, y + 3, 82, y - 3, 128, y + 1)
    context.stroke()
  }
  context.strokeStyle = 'rgba(41, 32, 24, 0.45)'
  context.lineWidth = 2
  for (let x = 8; x < canvas.width; x += 17) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x + (style === 'laur' ? 24 : 5), canvas.height)
    context.stroke()
  }
  const bark = new CanvasTexture(canvas)
  bark.colorSpace = SRGBColorSpace
  bark.anisotropy = 4

  const normalData = new Uint8Array(canvas.width * canvas.height * 4)
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const groove = Math.sin((y / 8) * Math.PI * 2)
      const twist = style === 'laur' ? Math.sin((x + y * 0.12) / 8) : 0
      const offset = (y * canvas.width + x) * 4
      normalData[offset] = 128 + groove * 24 + twist * 12
      normalData[offset + 1] = 128 + twist * 10
      normalData[offset + 2] = 244
      normalData[offset + 3] = 255
    }
  }
  const normal = new DataTexture(
    normalData,
    canvas.width,
    canvas.height,
    RGBAFormat,
    UnsignedByteType,
  )
  normal.needsUpdate = true
  return { bark, normal }
}

function getTextures(style: PalmStyle) {
  let textures = textureCache.get(style)
  if (!textures) {
    const { bark, normal } = makeBarkTextures(style)
    textures = {
      frond: makeFrondTexture(style),
      undergrowth: makeUndergrowthTexture(style),
      bark,
      barkNormal: normal,
    }
    textureCache.set(style, textures)
  }
  return textures
}

function getFrondMaterial(
  style: PalmStyle,
  tier: GraphicsTier,
  isHighlighted: boolean,
  opacity: number,
) {
  const key = `${style}:${tier}:${isHighlighted}:${opacity}`
  let material = frondMaterialCache.get(key)
  if (!material) {
    material = new MeshStandardMaterial({
      map: getTextures(style).frond,
      ...getPalmHighlightMaterialOptions(isHighlighted),
      alphaTest,
      side: DoubleSide,
      roughness: tier === 'high' ? 0.68 : 0.86,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    })
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        '#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb *= 1.06;',
      )
    }
    frondMaterialCache.set(key, material)
  }
  return material
}

function getUndergrowthMaterial(
  style: PalmStyle,
  isHighlighted: boolean,
  opacity: number,
) {
  const key = `${style}:${isHighlighted}:${opacity}`
  let material = undergrowthMaterialCache.get(key)
  if (!material) {
    material = new MeshStandardMaterial({
      map: getTextures(style).undergrowth,
      ...getPalmHighlightMaterialOptions(isHighlighted),
      alphaTest,
      side: DoubleSide,
      roughness: 0.9,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    })
    undergrowthMaterialCache.set(key, material)
  }
  return material
}

function getBarkMaterial(
  style: PalmStyle,
  tier: GraphicsTier,
  isHighlighted: boolean,
  opacity: number,
) {
  const key = `${style}:${tier}:${isHighlighted}:${opacity}`
  let material = barkMaterialCache.get(key)
  if (!material) {
    const textures = getTextures(style)
    material = new MeshStandardMaterial({
      map: textures.bark,
      normalMap: textures.barkNormal,
      ...getPalmHighlightMaterialOptions(isHighlighted),
      roughness: tier === 'high' ? 0.68 : 0.86,
      transparent: opacity < 1,
      opacity,
    })
    barkMaterialCache.set(key, material)
  }
  return material
}

function getFrondGeometry(style: PalmStyle, tier: GraphicsTier) {
  const key = `${style}:${tier}`
  let geometry = frondGeometryCache.get(key)
  if (!geometry) {
    geometry = buildPalmFrondGeometry({
      segments: 5,
      width: PALM_FROND_BASE_WIDTH[style],
      droop: PALM_FROND_BASE_DROOP,
    })
    frondGeometryCache.set(key, geometry)
  }
  return geometry
}

function getUndergrowthGeometry() {
  if (undergrowthGeometry) return undergrowthGeometry
  const positions = new Float32Array([
    -0.22, 0, 0, 0.22, 0, 0, -0.08, 0.86, 0, 0.08, 0.86, 0, 0, 0, -0.22, 0, 0,
    0.22, 0, 0.86, -0.08, 0, 0.86, 0.08,
  ])
  const uvs = new Float32Array([
    0, 1, 1, 1, 0.32, 0, 0.68, 0, 0, 1, 1, 1, 0.32, 0, 0.68, 0,
  ])
  undergrowthGeometry = new BufferGeometry()
  undergrowthGeometry.setAttribute(
    'position',
    new BufferAttribute(positions, 3),
  )
  undergrowthGeometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  undergrowthGeometry.setIndex([0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6])
  undergrowthGeometry.computeVertexNormals()
  return undergrowthGeometry
}

function getCutoutDepthMaterials(
  style: PalmStyle,
  foliage: 'frond' | 'undergrowth' = 'frond',
) {
  const map = getTextures(style)[foliage]
  const key = `${style}:${foliage}`
  let depth = depthMaterialCache.get(key)
  if (!depth) {
    depth = new MeshDepthMaterial({ map, alphaTest, side: DoubleSide })
    depthMaterialCache.set(key, depth)
  }
  let distance = distanceMaterialCache.get(key)
  if (!distance) {
    distance = new MeshDistanceMaterial({ map, alphaTest, side: DoubleSide })
    distanceMaterialCache.set(key, distance)
  }
  return { depth, distance }
}

function PalmFrondBatch({
  seed,
  style,
  tier,
  opacity,
  isHighlighted,
  uid,
  castShadow,
}: {
  seed: string
  style: PalmStyle
  tier: GraphicsTier
  opacity: number
  isHighlighted: boolean
  uid?: string
  castShadow: boolean
}) {
  const [mesh, setMesh] = useState<InstancedMesh | null>(null)
  const instances = useMemo(
    () => buildPalmFrondInstances(seed, style, tier).flat(),
    [seed, style, tier],
  )
  const { depth, distance } = getCutoutDepthMaterials(style)
  const geometry = getFrondGeometry(style, tier)
  const material = getFrondMaterial(style, tier, isHighlighted, opacity)
  const count = instances.length

  useLayoutEffect(() => {
    if (!mesh) return
    applyPalmFrondInstances(mesh, instances)
    mesh.customDepthMaterial = depth
    mesh.customDistanceMaterial = distance
  }, [depth, distance, instances, mesh])

  return (
    <instancedMesh
      ref={setMesh}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow={castShadow}
      dispose={null}
      userData={{ junglePalmUID: uid ?? null, junglePalmPart: 'fronds' }}
    />
  )
}

function PalmUndergrowth({
  seed,
  style,
  opacity,
  isHighlighted,
  uid,
  castShadow,
}: {
  seed: string
  style: PalmStyle
  opacity: number
  isHighlighted: boolean
  uid?: string
  castShadow: boolean
}) {
  const [mesh, setMesh] = useState<InstancedMesh | null>(null)
  const { depth, distance } = getCutoutDepthMaterials(style, 'undergrowth')
  const geometry = getUndergrowthGeometry()
  const material = getUndergrowthMaterial(style, isHighlighted, opacity)
  const count = undergrowthCount
  const transforms = useMemo(() => {
    let value = 2166136261
    for (let index = 0; index < seed.length; index += 1) {
      value ^= seed.charCodeAt(index)
      value = Math.imul(value, 16777619)
    }
    const random = () => {
      value ^= value << 13
      value ^= value >>> 17
      value ^= value << 5
      return (value >>> 0) / 4294967296
    }
    return Array.from({ length: undergrowthCount }, (_, index) => {
      const angle = (index / undergrowthCount) * Math.PI * 2 + random() * 0.2
      return {
        angle,
        radius: 0.3 + random() * 0.42,
        scale: 0.72 + random() * 0.45,
      }
    })
  }, [seed])

  useLayoutEffect(() => {
    if (!mesh) return
    const object = new Object3D()
    transforms.forEach(({ angle, radius, scale }, index) => {
      object.position.set(
        Math.sin(angle) * radius,
        0.34,
        Math.cos(angle) * radius,
      )
      object.rotation.set(0, angle, 0)
      object.scale.setScalar(scale)
      object.updateMatrix()
      mesh.setMatrixAt(index, object.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    mesh.customDepthMaterial = depth
    mesh.customDistanceMaterial = distance
  }, [depth, distance, mesh, transforms])

  return (
    <instancedMesh
      ref={setMesh}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow={castShadow}
      dispose={null}
      userData={{ junglePalmUID: uid ?? null, junglePalmPart: 'undergrowth' }}
    />
  )
}

export function PalmTrunkMaterial({
  style,
  tier,
  opacity = 1,
  isHighlighted = false,
}: {
  style: PalmStyle
  tier: GraphicsTier
  opacity?: number
  isHighlighted?: boolean
}) {
  return getBarkMaterial(style, tier, isHighlighted, opacity)
}

export function getPalmHighlightMaterialOptions(isHighlighted: boolean) {
  return {
    color: 'white',
    emissive: isHighlighted ? MODEL_HIGHLIGHT_EMISSIVE : 'black',
    emissiveIntensity: isHighlighted ? MODEL_HIGHLIGHT_EMISSIVE_INTENSITY : 0,
  }
}

export default function PalmFrondCanopy({
  seed,
  style,
  tier,
  opacity = 1,
  isHighlighted = false,
  uid,
  castShadow,
}: {
  seed: string
  style: PalmStyle
  tier: GraphicsTier
  opacity?: number
  isHighlighted?: boolean
  uid?: string
  castShadow: boolean
}) {
  const rings = getPalmFrondRings(style, tier)
  const previewOpacity = opacity < 1 ? opacity : 1
  return (
    <>
      {rings.length > 0 && (
        <PalmFrondBatch
          seed={seed}
          style={style}
          tier={tier}
          opacity={previewOpacity}
          isHighlighted={isHighlighted}
          uid={uid}
          castShadow={castShadow}
        />
      )}
      <PalmUndergrowth
        seed={seed}
        style={style}
        opacity={previewOpacity}
        isHighlighted={isHighlighted}
        uid={uid}
        castShadow={castShadow}
      />
    </>
  )
}
