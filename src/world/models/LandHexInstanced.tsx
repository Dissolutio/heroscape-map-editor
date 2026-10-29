import { type ThreeEvent, useThree } from '@react-three/fiber'
import React from 'react'
import {
  type BufferGeometry,
  Color,
  type DataArrayTexture,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  type InstancedMesh,
  MeshMatcapMaterial,
  MeshStandardMaterial,
  Object3D,
  BufferGeometry as ThreeBufferGeometry,
} from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex, BoardHexes, BoardPiece } from '../../types'
import { HEXGRID_HEX_HEIGHT, HEXGRID_HEX_RADIUS } from '../../utils/constants'
import {
  findPieceHexAt,
  isDragPassThrough,
  isDragging,
  pressPieceForDrag,
  reportDragTargetHex,
} from '../drag/dragController'
import type { GenericTerrainColorSettings } from '../maphex/genericTerrainColors'
import {
  getCachedTerrainTextureArrays,
  hasHighTierPbrTextureUnitBudget,
} from '../textures/terrainTextureArrays'
import {
  FLUID_CAP_BORDER_BLEND_WIDTH,
  FLUID_CAP_BORDER_INSET,
  FLUID_CAP_FILL_UV_WINDOW,
  type LandHexHoverTarget,
  type LandHexInstanceDatum,
  type LandHexInstanceIndex,
  type LandHexFluidMaterialClass,
  LAND_HEX_FLUID_MATERIAL_CLASSES,
  buildLandHexInstanceData,
  buildLandHexInstanceIndex,
  getLandHexFluidMaterialClass,
  getLandHexFluidMaterialSettings,
  getLandHexHighlightValue,
  getLandHexHoverTransition,
  getLandHexSideUV,
  packLandHexPbrTextureLayers,
  packLandHexVisibility,
} from './landHexInstances'

const vertices = Array.from({ length: 6 }, (_, index) => {
  const angle = -Math.PI / 2 + (index * Math.PI) / 3
  return {
    x: Math.cos(angle) * HEXGRID_HEX_RADIUS,
    z: Math.sin(angle) * HEXGRID_HEX_RADIUS,
  }
})

export function buildCapGeometry(instanceCount: number) {
  const positions: number[] = []
  const directions: number[] = []
  const sideUVs: number[] = []
  const indices: number[] = []

  for (let side = 0; side < 6; side += 1) {
    const next = vertices[(side + 1) % 6]
    const current = vertices[side]
    positions.push(
      0,
      HEXGRID_HEX_HEIGHT,
      0,
      next.x,
      HEXGRID_HEX_HEIGHT,
      next.z,
      current.x,
      HEXGRID_HEX_HEIGHT,
      current.z,
    )
    directions.push(-1, -1, -1)
    sideUVs.push(0, 0, 0, 0, 0, 0)
    const start = side * 3 // first vertex of this triangle (3 vertices per triangle)
    indices.push(start, start + 1, start + 2)
  }

  return buildGeometry(positions, directions, sideUVs, indices, instanceCount)
}

export function buildSideGeometry(instanceCount: number) {
  const positions: number[] = []
  const directions: number[] = []
  const sideUVs: number[] = []
  const indices: number[] = []

  for (let side = 0; side < 6; side += 1) {
    const first = vertices[(side + 1) % 6]
    const second = vertices[(side + 2) % 6]
    positions.push(
      first.x,
      0,
      first.z,
      first.x,
      HEXGRID_HEX_HEIGHT,
      first.z,
      second.x,
      HEXGRID_HEX_HEIGHT,
      second.z,
      second.x,
      0,
      second.z,
    )
    directions.push(side, side, side, side)
    sideUVs.push(
      ...getLandHexSideUV(0, 0, HEXGRID_HEX_HEIGHT),
      ...getLandHexSideUV(0, HEXGRID_HEX_HEIGHT, HEXGRID_HEX_HEIGHT),
      ...getLandHexSideUV(1, HEXGRID_HEX_HEIGHT, HEXGRID_HEX_HEIGHT),
      ...getLandHexSideUV(1, 0, HEXGRID_HEX_HEIGHT),
    )
    const start = side * 4 // first vertex of this quad (4 vertices per quad; NOT indices.length, which grows by 6)
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }

  return buildGeometry(positions, directions, sideUVs, indices, instanceCount)
}

export function buildFluidGeometry(instanceCount: number) {
  const cap = buildCapGeometry(0)
  const sides = buildSideGeometry(0)
  const capPositions = cap.getAttribute('position').array
  const sidePositions = sides.getAttribute('position').array
  const capDirections = cap.getAttribute('landDirection').array
  const sideDirections = sides.getAttribute('landDirection').array
  const capUVs = cap.getAttribute('landSideUv').array
  const sideUVs = sides.getAttribute('landSideUv').array
  const capIndices = cap.getIndex()?.array ?? []
  const sideIndices = sides.getIndex()?.array ?? []
  const capVertexCount = cap.getAttribute('position').count
  const positions = [...capPositions, ...sidePositions]
  const directions = [...capDirections, ...sideDirections]
  const combinedUVs = [...capUVs, ...sideUVs]
  const indices = [
    ...capIndices,
    ...Array.from(sideIndices, (index) => index + capVertexCount),
  ]
  cap.dispose()
  sides.dispose()

  return buildGeometry(
    positions,
    directions,
    combinedUVs,
    indices,
    instanceCount,
  )
}

function buildGeometry(
  positions: number[],
  directions: number[],
  sideUVs: number[],
  indices: number[],
  instanceCount: number,
) {
  const geometry = new ThreeBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute(
    'landDirection',
    new Float32BufferAttribute(directions, 1),
  )
  geometry.setAttribute('landSideUv', new Float32BufferAttribute(sideUVs, 2))
  geometry.setIndex(indices)
  const attributes: [string, InstancedBufferAttribute][] = [
    [
      'landCapColor',
      new InstancedBufferAttribute(new Float32Array(instanceCount * 3), 3),
    ],
    [
      'landSideColor',
      new InstancedBufferAttribute(new Float32Array(instanceCount * 3), 3),
    ],
    [
      'landVisibility',
      new InstancedBufferAttribute(new Float32Array(instanceCount), 1),
    ],
    [
      'landHighlight',
      new InstancedBufferAttribute(new Float32Array(instanceCount), 1),
    ],
    [
      'landTextureData',
      new InstancedBufferAttribute(new Float32Array(instanceCount * 4), 4),
    ],
  ]
  for (const [name, attribute] of attributes) {
    attribute.setUsage(DynamicDrawUsage)
    geometry.setAttribute(name, attribute)
  }
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

function glslFloat(value: number) {
  return Number.isInteger(value) ? `${value}.0` : `${value}`
}

function glslMirroredWindowCoordinate(
  coordinate: string,
  min: number,
  max: number,
) {
  const lower = glslFloat(min)
  const width = glslFloat(max - min)
  const period = glslFloat(2 * (max - min))
  return `${lower} + ${width} - abs(
    fract((${coordinate} - ${lower}) / ${period}) * ${period} - ${width}
  )`
}

function makeLandMaterial(
  isLightsAndShadowsRender: boolean,
  fluidSettings?: { opacity: number; transparent: boolean },
  capTexture?: DataArrayTexture,
  sideTexture?: DataArrayTexture,
  pbrTextures?: {
    capNormal: DataArrayTexture
    capOrm: DataArrayTexture
    sideNormal: DataArrayTexture
    sideOrm: DataArrayTexture
  },
) {
  const material = isLightsAndShadowsRender
    ? new MeshStandardMaterial()
    : new MeshMatcapMaterial()
  material.userData.lookShineHandled = material instanceof MeshStandardMaterial
  material.userData.lookShine = useBoundStore.getState().lookSettings.shine
  material.color.set('white')
  if (fluidSettings) {
    material.transparent = fluidSettings.transparent
    material.opacity = fluidSettings.opacity
  }
  const capTextureDeclaration = capTexture
    ? 'uniform sampler2DArray uLandCapDiffuse;'
    : ''
  const sideTextureDeclaration = sideTexture
    ? 'uniform sampler2DArray uLandSideDiffuse;'
    : ''
  const capNormalDeclaration = pbrTextures
    ? 'uniform sampler2DArray uLandCapNormal;'
    : ''
  const capOrmDeclaration = pbrTextures
    ? 'uniform sampler2DArray uLandCapOrm;'
    : ''
  const sideNormalDeclaration = pbrTextures
    ? 'uniform sampler2DArray uLandSideNormal;'
    : ''
  const sideOrmDeclaration = pbrTextures
    ? 'uniform sampler2DArray uLandSideOrm;'
    : ''
  const capTextureSample = capTexture
    ? `if (vLandSurfaceKind > 0.5 && vLandTextureLayer >= 0.0) {
           vec3 landCapCellColor = texture(
             uLandCapDiffuse,
             vec3(vLandTextureUv, vLandTextureLayer)
           ).rgb;
           landTextureColor = landFluidFillBlend > 0.0
             ? mix(
                 landCapCellColor,
                 texture(
                   uLandCapDiffuse,
                   vec3(landFluidFillUv, vLandTextureLayer)
                 ).rgb,
                 landFluidFillBlend
               )
             : landCapCellColor;
         }`
    : ''
  const sideTextureSample = sideTexture
    ? `if (vLandSurfaceKind < 0.5 && vLandTextureLayer >= 0.0) {
           landTextureColor = texture(
             uLandSideDiffuse,
             vec3(vLandTextureUv, vLandTextureLayer)
           ).rgb;
         }`
    : ''
  const capNormalSample = pbrTextures
    ? `if (vLandSurfaceKind > 0.5 && vLandPbrTextureLayers.x >= 0.0) {
           landTangentNormal = texture(
             uLandCapNormal,
             vec3(landCapTextureUv, vLandPbrTextureLayers.x)
           ).xyz * 2.0 - 1.0;
           landNormalEnabled = 1.0;
         }`
    : ''
  const capOrmSample = pbrTextures
    ? `if (vLandSurfaceKind > 0.5 && vLandPbrTextureLayers.y >= 0.0) {
           vec3 landCapCellOrm = texture(
             uLandCapOrm,
             vec3(vLandTextureUv, vLandPbrTextureLayers.y)
           ).rgb;
           landOrm = landFluidFillBlend > 0.0
             ? mix(
                 landCapCellOrm,
                 texture(
                   uLandCapOrm,
                   vec3(landFluidFillUv, vLandPbrTextureLayers.y)
                 ).rgb,
                 landFluidFillBlend
               )
             : landCapCellOrm;
           landOrmEnabled = 1.0;
         }`
    : ''
  const sideNormalSample = pbrTextures
    ? `if (vLandSurfaceKind < 0.5 && vLandPbrTextureLayers.z >= 0.0) {
           landTangentNormal = texture(
             uLandSideNormal,
             vec3(vLandTextureUv, vLandPbrTextureLayers.z)
           ).xyz * 2.0 - 1.0;
           landNormalEnabled = 1.0;
         }`
    : ''
  const sideOrmSample = pbrTextures
    ? `if (vLandSurfaceKind < 0.5 && vLandPbrTextureLayers.w >= 0.0) {
           landOrm = texture(
             uLandSideOrm,
             vec3(vLandTextureUv, vLandPbrTextureLayers.w)
           ).rgb;
           landOrmEnabled = 1.0;
         }`
    : ''
  const capFillUvSetup = `
        float landFluidFillBlend = 0.0;
        if (vLandSurfaceKind > 0.5 && vLandFluidJoinMask > 0.5) {
         float landFluidInset =
           ${glslFloat((FLUID_CAP_BORDER_INSET * HEXGRID_HEX_RADIUS * Math.sqrt(3)) / 2)};
         float landFluidBlendWidth =
           ${glslFloat((FLUID_CAP_BORDER_BLEND_WIDTH * HEXGRID_HEX_RADIUS * Math.sqrt(3)) / 2)};
         for (int edge = 0; edge < 6; edge++) {
           float edgeAngle = float(edge) * 1.0471975512;
           vec2 edgeNormal = vec2(cos(edgeAngle), sin(edgeAngle));
           float edgeDistance =
             ${glslFloat((Math.sqrt(3) / 2) * HEXGRID_HEX_RADIUS)} -
             dot(vLandCapLocalPosition, edgeNormal);
           float edgeJoined = mod(
             floor(vLandFluidJoinMask / exp2(float(edge))),
             2.0
           );
           float edgeBefore = mod(float(edge) + 5.0, 6.0);
           float edgeAfter = mod(float(edge) + 1.0, 6.0);
           float edgeBeforeJoined = mod(
             floor(vLandFluidJoinMask / exp2(edgeBefore)),
             2.0
           );
           float edgeAfterJoined = mod(
             floor(vLandFluidJoinMask / exp2(edgeAfter)),
             2.0
           );
           float edgeBeforeAngle = edgeBefore * 1.0471975512;
           float edgeAfterAngle = edgeAfter * 1.0471975512;
           float edgeBeforeDistance =
             ${glslFloat((Math.sqrt(3) / 2) * HEXGRID_HEX_RADIUS)} -
             dot(
               vLandCapLocalPosition,
               vec2(cos(edgeBeforeAngle), sin(edgeBeforeAngle))
             );
           float edgeAfterDistance =
             ${glslFloat((Math.sqrt(3) / 2) * HEXGRID_HEX_RADIUS)} -
             dot(
               vLandCapLocalPosition,
               vec2(cos(edgeAfterAngle), sin(edgeAfterAngle))
             );
           float edgeMiterKeep = mix(
             step(
               edgeDistance - ${glslFloat(HEXGRID_HEX_RADIUS * 1e-5)},
               edgeBeforeDistance
             ),
             1.0,
             edgeBeforeJoined
           ) * mix(
             step(
               edgeDistance - ${glslFloat(HEXGRID_HEX_RADIUS * 1e-5)},
               edgeAfterDistance
             ),
             1.0,
             edgeAfterJoined
           );
           float edgeBlend = 1.0 - smoothstep(
             landFluidInset - landFluidBlendWidth,
             landFluidInset,
             edgeDistance
           );
          landFluidFillBlend = max(
            landFluidFillBlend,
            edgeJoined * edgeBlend * edgeMiterKeep
          );
        }
        }
        vec2 landFluidFillUv = vec2(
          ${glslMirroredWindowCoordinate(
            'vLandWorldFillUv.x',
            FLUID_CAP_FILL_UV_WINDOW.uMin,
            FLUID_CAP_FILL_UV_WINDOW.uMax,
          )},
          ${glslMirroredWindowCoordinate(
            'vLandWorldFillUv.y',
            FLUID_CAP_FILL_UV_WINDOW.vMin,
            FLUID_CAP_FILL_UV_WINDOW.vMax,
          )}
        );
        vec2 landCapTextureUv = mix(
         vLandTextureUv,
         landFluidFillUv,
         landFluidFillBlend
        );`
  material.onBeforeCompile = (shader) => {
    if (material instanceof MeshStandardMaterial) {
      shader.uniforms.uLookShine = {
        value: material.userData.lookShine as number,
      }
      material.userData.lookShader = shader
    }
    if (capTexture) {
      shader.uniforms.uLandCapDiffuse = { value: capTexture }
    }
    if (sideTexture) {
      shader.uniforms.uLandSideDiffuse = { value: sideTexture }
    }
    if (pbrTextures) {
      shader.uniforms.uLandCapNormal = { value: pbrTextures.capNormal }
      shader.uniforms.uLandCapOrm = { value: pbrTextures.capOrm }
      shader.uniforms.uLandSideNormal = { value: pbrTextures.sideNormal }
      shader.uniforms.uLandSideOrm = { value: pbrTextures.sideOrm }
    }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 landCapColor;
        attribute vec3 landSideColor;
        attribute float landVisibility;
        attribute float landHighlight;
        attribute float landDirection;
        attribute vec2 landSideUv;
        attribute vec4 landTextureData;
        varying vec3 vLandSurfaceColor;
        varying float vLandHighlight;
        varying vec2 vLandTextureUv;
        varying float vLandTextureLayer;
        varying vec4 vLandPbrTextureLayers;
        varying vec2 vLandCapPbrStrengths;
        varying float vLandSurfaceKind;
        varying float vLandFluidJoinMask;
        varying vec2 vLandCapLocalPosition;
        varying vec2 vLandWorldFillUv;
        varying vec3 vLandTangent;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float landSideMask = mod(landVisibility, 64.0);
        float landCapVisible = mod(floor(landVisibility / 64.0), 2.0);
        float landFluidJoinMask = mod(
          floor(landVisibility / 128.0),
          64.0
        );
        float landSurfaceKind = 1.0 - step(0.0, landDirection);
        if (landSurfaceKind < 0.5) {
          float sideVisible = mod(
            floor(landSideMask / exp2(landDirection)),
            2.0
          );
          if (sideVisible < 0.5) transformed = vec3(0.0);
        } else if (landCapVisible < 0.5) {
          transformed = vec3(0.0);
        }
        vLandSurfaceColor =
          landSurfaceKind > 0.5 ? landCapColor : landSideColor;
        vLandHighlight = landSurfaceKind > 0.5
          ? mod(landHighlight, 2.0)
          : step(2.0, landHighlight);
        float capAngle = landTextureData.z * 1.0471975512;
        vec2 capPosition = vec2(
          position.x * cos(capAngle) + position.z * sin(capAngle),
          -position.x * sin(capAngle) + position.z * cos(capAngle)
        );
        vLandTextureUv = landSurfaceKind > 0.5
          ? vec2(
              capPosition.x / ${glslFloat(Math.sqrt(3) * HEXGRID_HEX_RADIUS)} + 0.5,
              capPosition.y / ${glslFloat(2 * HEXGRID_HEX_RADIUS)} + 0.5
            )
          : landSideUv;
        vLandTextureLayer =
          landSurfaceKind > 0.5 ? landTextureData.x : landTextureData.y;
        float landPbrCode = landTextureData.w;
        float landPbrLayerCode = floor(landPbrCode / 1024.0);
        float landPbrStrengthCode = mod(landPbrCode, 1024.0);
        vLandPbrTextureLayers = vec4(
          floor(landPbrLayerCode / 84.0) - 1.0,
          mod(floor(landPbrLayerCode / 12.0), 7.0) - 1.0,
          mod(floor(landPbrLayerCode / 4.0), 3.0) - 1.0,
          mod(landPbrLayerCode, 4.0) - 1.0
        );
        vLandCapPbrStrengths = vec2(
          floor(landPbrStrengthCode / 32.0) / 31.0,
          mod(landPbrStrengthCode, 32.0) / 31.0
        );
        vLandSurfaceKind = landSurfaceKind;
        vLandFluidJoinMask = landFluidJoinMask;
        vLandCapLocalPosition = position.xz;
        vec4 landWorldPosition =
          modelMatrix * instanceMatrix * vec4(position, 1.0);
        vLandWorldFillUv =
          vec2(
            landWorldPosition.x / ${glslFloat(Math.sqrt(3) * HEXGRID_HEX_RADIUS)},
            landWorldPosition.z / ${glslFloat(2 * HEXGRID_HEX_RADIUS)}
          ) + 0.5;
        float landTangentAngle = landTextureData.z * 1.0471975512;
        vec3 landLocalTangent = landSurfaceKind > 0.5
          ? vec3(cos(landTangentAngle), 0.0, sin(landTangentAngle))
          : vec3(
              cos((landDirection + 1.5) * 1.0471975512),
              0.0,
              sin((landDirection + 1.5) * 1.0471975512)
            );
        vLandTangent = normalize(
          mat3(modelViewMatrix * instanceMatrix) * landLocalTangent
        );`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        ${
          material instanceof MeshStandardMaterial
            ? 'uniform float uLookShine;'
            : ''
        }
        varying vec3 vLandSurfaceColor;
        varying float vLandHighlight;
        varying vec2 vLandTextureUv;
        varying float vLandTextureLayer;
        varying vec4 vLandPbrTextureLayers;
        varying vec2 vLandCapPbrStrengths;
        varying float vLandSurfaceKind;
        varying float vLandFluidJoinMask;
        varying vec2 vLandCapLocalPosition;
        varying vec2 vLandWorldFillUv;
        varying vec3 vLandTangent;
        ${capTextureDeclaration}
        ${sideTextureDeclaration}
        ${capNormalDeclaration}
        ${capOrmDeclaration}
        ${sideNormalDeclaration}
        ${sideOrmDeclaration}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 landTextureColor = vLandSurfaceColor;
        vec3 landTangentNormal = vec3(0.0, 0.0, 1.0);
        vec3 landOrm = vec3(1.0, 1.0, 0.0);
        float landNormalEnabled = 0.0;
        float landOrmEnabled = 0.0;
        ${capFillUvSetup}
        ${capTextureSample}
        ${sideTextureSample}
        ${capNormalSample}
        ${sideNormalSample}
        ${capOrmSample}
        ${sideOrmSample}
        diffuseColor.rgb = mix(
          landTextureColor,
          vec3(1.0, 1.0, 0.0),
          vLandHighlight
        );`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        if (landNormalEnabled > 0.5) {
          vec3 landTangent = normalize(
            vLandTangent - normal * dot(normal, vLandTangent)
          );
          vec3 landBitangent = normalize(cross(normal, landTangent));
          if (vLandSurfaceKind > 0.5) {
            landTangentNormal.xy *= vLandCapPbrStrengths.x;
          }
          landTangentNormal = normalize(landTangentNormal);
          normal = normalize(
            mat3(landTangent, landBitangent, normal) * landTangentNormal
          );
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        ${
          pbrTextures
            ? 'if (landOrmEnabled > 0.5) roughnessFactor = landOrm.g;'
            : ''
        }
        ${
          material instanceof MeshStandardMaterial
            ? 'roughnessFactor = clamp(roughnessFactor * uLookShine, 0.04, 1.0);'
            : ''
        }`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        if (landOrmEnabled > 0.5) metalnessFactor = landOrm.b;`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
        if (landOrmEnabled > 0.5) {
          float landAoStrength = vLandSurfaceKind > 0.5
            ? vLandCapPbrStrengths.y
            : 1.0;
          reflectedLight.indirectDiffuse *= mix(
            1.0,
            landOrm.r,
            landAoStrength
          );
        }`,
      )
  }
  material.customProgramCacheKey = () =>
    `land-hex-instance-colors-v6-${Number(Boolean(capTexture))}-${Number(Boolean(sideTexture))}-${Number(Boolean(pbrTextures))}`
  return material
}

function updateInstanceMesh(
  mesh: InstancedMesh | null,
  geometry: BufferGeometry,
  items: LandHexInstanceDatum[],
  selectedIDs: Set<string>,
  hovered: LandHexHoverTarget,
  surface: 'cap' | 'side' | 'both',
) {
  if (!mesh) return

  const capColorAttribute = geometry.getAttribute(
    'landCapColor',
  ) as InstancedBufferAttribute
  const sideColorAttribute = geometry.getAttribute(
    'landSideColor',
  ) as InstancedBufferAttribute
  const visibilityAttribute = geometry.getAttribute(
    'landVisibility',
  ) as InstancedBufferAttribute
  const highlightAttribute = geometry.getAttribute(
    'landHighlight',
  ) as InstancedBufferAttribute
  const textureDataAttribute = geometry.getAttribute(
    'landTextureData',
  ) as InstancedBufferAttribute
  const transform = new Object3D()
  const color = new Color()

  mesh.count = items.length
  items.forEach((item, index) => {
    color.set(item.capColor).toArray(capColorAttribute.array, index * 3)
    color.set(item.sideColor).toArray(sideColorAttribute.array, index * 3)
    visibilityAttribute.setX(
      index,
      packLandHexVisibility(
        item.sideMask,
        item.capVisible,
        item.fluidCapJoinMask,
      ),
    )
    highlightAttribute.setX(
      index,
      getFiniteLandHexHighlightValue(item, hovered, selectedIDs, surface),
    )
    textureDataAttribute.setXYZW(
      index,
      item.capLayer,
      item.sideLayer,
      item.rotationSteps,
      packLandHexPbrTextureLayers(
        item.capNormalLayer,
        item.capOrmLayer,
        item.sideNormalLayer,
        item.sideOrmLayer,
        item.capNormalStrength,
        item.capAoStrength,
      ),
    )

    transform.position.set(item.x, item.y, item.z)
    transform.scale.set(1, item.isFluid ? 0.5 : 1, 1)
    transform.updateMatrix()
    mesh.setMatrixAt(index, transform.matrix)
  })

  for (const attribute of [
    capColorAttribute,
    sideColorAttribute,
    visibilityAttribute,
    highlightAttribute,
    textureDataAttribute,
  ]) {
    attribute.clearUpdateRanges()
    attribute.needsUpdate = true
  }
  mesh.instanceMatrix.clearUpdateRanges()
  mesh.instanceMatrix.needsUpdate = true
}

function getFiniteLandHexHighlightValue(
  item: LandHexInstanceDatum,
  hovered: LandHexHoverTarget,
  selectedIDs: Set<string>,
  surface: 'cap' | 'side' | 'both',
) {
  const value = getLandHexHighlightValue(item, hovered, selectedIDs, surface)
  return Number.isFinite(value) ? value : 0
}

function writeLandHighlightValues(
  geometry: BufferGeometry,
  items: LandHexInstanceDatum[],
  indices: Iterable<number>,
  selectedIDs: Set<string>,
  hovered: LandHexHoverTarget,
  surface: 'cap' | 'side' | 'both',
) {
  const attribute = geometry.getAttribute(
    'landHighlight',
  ) as InstancedBufferAttribute
  const updatedIndices = [...indices]
  if (updatedIndices.length === 0) return
  const validIndices = updatedIndices.filter((index) => items[index])
  if (validIndices.length === 0) return
  for (const index of validIndices) {
    const item = items[index]
    attribute.setX(
      index,
      getFiniteLandHexHighlightValue(item, hovered, selectedIDs, surface),
    )
  }
  mergeLandHexHighlightUpdateRanges(attribute, validIndices)
  attribute.needsUpdate = true
}

export function mergeLandHexHighlightUpdateRanges(
  attribute: InstancedBufferAttribute,
  indices: Iterable<number>,
) {
  let start = Number.POSITIVE_INFINITY
  let end = Number.NEGATIVE_INFINITY
  for (const range of attribute.updateRanges) {
    start = Math.min(start, range.start)
    end = Math.max(end, range.start + range.count)
  }
  for (const index of indices) {
    start = Math.min(start, index)
    end = Math.max(end, index + 1)
  }
  if (!Number.isFinite(start) || end <= start) return false
  attribute.clearUpdateRanges()
  attribute.addUpdateRange(start, end - start)
  return true
}

function getHoverAffectedIndices(
  transition: ReturnType<typeof getLandHexHoverTransition>,
  surface: 'cap' | 'side' | 'both',
) {
  const updates =
    surface === 'cap'
      ? transition.capUpdates
      : surface === 'side'
        ? transition.sideUpdates
        : [...transition.sideUpdates, ...transition.capUpdates]
  return new Set(updates.map(({ index }) => index))
}

function handleSideSelection(
  event: ThreeEvent<PointerEvent>,
  uid: string,
  toggleSelectedPieceID: (
    uid: string,
    multiSelect?: boolean,
    point?: { x: number; z: number },
  ) => void,
) {
  event.stopPropagation()
  if (event.button !== 0) return
  toggleSelectedPieceID(uid, event.shiftKey || event.ctrlKey || event.metaKey, {
    x: event.point.x,
    z: event.point.z,
  })
}

export default function LandHexInstanced({
  boardHexes,
  boardPieces,
  viewingLevel,
  genericColors,
  onPointerUpPaintPiece,
}: {
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
  viewingLevel: number
  genericColors: GenericTerrainColorSettings
  onPointerUpPaintPiece: (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => void
}) {
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const shine = useBoundStore((s) => s.lookSettings.shine)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isWebGL2 = useThree((state) => state.gl.capabilities.isWebGL2)
  const maxTextureImageUnits = useThree(
    (state) => state.gl.capabilities.maxTextures,
  )
  const hasPbrTextureUnitBudget =
    hasHighTierPbrTextureUnitBudget(maxTextureImageUnits)
  const renderTier =
    effectiveGraphicsTier === 'high' && !hasPbrTextureUnitBudget
      ? 'medium'
      : effectiveGraphicsTier
  const useHighPbr =
    effectiveGraphicsTier === 'high' &&
    hasPbrTextureUnitBudget &&
    isLightsAndShadowsRender
  const textureArrays = React.useMemo(
    () =>
      (textureLoadStatus === 'ready' || textureLoadStatus === 'fallback') &&
      isWebGL2
        ? getCachedTerrainTextureArrays(effectiveGraphicsTier)
        : null,
    [effectiveGraphicsTier, isWebGL2, textureLoadStatus],
  )
  const data = React.useMemo(
    () =>
      buildLandHexInstanceData(
        boardHexes,
        boardPieces,
        viewingLevel,
        genericColors,
        textureArrays?.manifest,
        renderTier,
      ),
    [
      boardHexes,
      boardPieces,
      genericColors,
      renderTier,
      textureArrays,
      viewingLevel,
    ],
  )
  const capTexture =
    textureArrays?.textures[
      effectiveGraphicsTier === 'high' && hasPbrTextureUnitBudget
        ? 'caps-diffuse-pbr.png'
        : 'caps-diffuse.png'
    ]
  const sideTexture = textureArrays?.textures['sides-diffuse.png']
  const capNormalTexture = textureArrays?.textures['caps-normal.png']
  const capOrmTexture = textureArrays?.textures['caps-orm.png']
  const sideNormalTexture = textureArrays?.textures['sides-normal.png']
  const sideOrmTexture = textureArrays?.textures['sides-orm.png']
  const pbrTextures = React.useMemo(
    () =>
      useHighPbr &&
      capNormalTexture &&
      capOrmTexture &&
      sideNormalTexture &&
      sideOrmTexture
        ? {
            capNormal: capNormalTexture,
            capOrm: capOrmTexture,
            sideNormal: sideNormalTexture,
            sideOrm: sideOrmTexture,
          }
        : undefined,
    [
      capNormalTexture,
      capOrmTexture,
      sideNormalTexture,
      sideOrmTexture,
      useHighPbr,
    ],
  )
  const { onPointerEnter, onPointerEnterPID, onPointerOut, onPointerMove } =
    usePieceHoverState({ trackIsHovered: false })
  const solidData = React.useMemo(
    () => data.filter((item) => !item.isFluid),
    [data],
  )
  const fluidData = React.useMemo(
    () => data.filter((item) => item.isFluid),
    [data],
  )
  const fluidDataByClass = React.useMemo(
    () =>
      Object.fromEntries(
        LAND_HEX_FLUID_MATERIAL_CLASSES.map((materialClass) => [
          materialClass,
          fluidData.filter(
            (item) =>
              getLandHexFluidMaterialClass(item.terrain) === materialClass,
          ),
        ]),
      ) as Record<LandHexFluidMaterialClass, LandHexInstanceDatum[]>,
    [fluidData],
  )
  const solidIndex = React.useMemo(
    () => buildLandHexInstanceIndex(solidData),
    [solidData],
  )
  const fluidIndices = React.useMemo(
    () =>
      Object.fromEntries(
        LAND_HEX_FLUID_MATERIAL_CLASSES.map((materialClass) => [
          materialClass,
          buildLandHexInstanceIndex(fluidDataByClass[materialClass]),
        ]),
      ) as Record<LandHexFluidMaterialClass, LandHexInstanceIndex>,
    [fluidDataByClass],
  )
  const capGeometry = React.useMemo(
    () => buildCapGeometry(solidData.length),
    [solidData.length],
  )
  const sideGeometry = React.useMemo(
    () => buildSideGeometry(solidData.length),
    [solidData.length],
  )
  const fluidGeometries = React.useMemo(
    () =>
      Object.fromEntries(
        LAND_HEX_FLUID_MATERIAL_CLASSES.map((materialClass) => [
          materialClass,
          buildFluidGeometry(fluidDataByClass[materialClass].length),
        ]),
      ) as Record<LandHexFluidMaterialClass, BufferGeometry>,
    [fluidDataByClass],
  )
  const capMaterial = React.useMemo(
    () =>
      makeLandMaterial(
        isLightsAndShadowsRender,
        undefined,
        capTexture,
        sideTexture,
        pbrTextures,
      ),
    [capTexture, isLightsAndShadowsRender, pbrTextures, sideTexture],
  )
  const sideMaterial = React.useMemo(
    () =>
      makeLandMaterial(
        isLightsAndShadowsRender,
        undefined,
        capTexture,
        sideTexture,
        pbrTextures,
      ),
    [capTexture, isLightsAndShadowsRender, pbrTextures, sideTexture],
  )
  const fluidMaterials = React.useMemo(
    () =>
      Object.fromEntries(
        LAND_HEX_FLUID_MATERIAL_CLASSES.map((materialClass) => [
          materialClass,
          makeLandMaterial(
            isLightsAndShadowsRender,
            getLandHexFluidMaterialSettings(materialClass),
            capTexture,
            sideTexture,
          ),
        ]),
      ) as Record<
        LandHexFluidMaterialClass,
        MeshStandardMaterial | MeshMatcapMaterial
      >,
    [capTexture, isLightsAndShadowsRender, sideTexture],
  )
  React.useEffect(() => {
    for (const material of [
      capMaterial,
      sideMaterial,
      ...Object.values(fluidMaterials),
    ]) {
      if (!(material instanceof MeshStandardMaterial)) continue
      material.userData.lookShine = shine
      const shader = material.userData.lookShader
      if (shader) shader.uniforms.uLookShine.value = shine
    }
  }, [capMaterial, fluidMaterials, shine, sideMaterial])
  React.useEffect(() => () => capGeometry.dispose(), [capGeometry])
  React.useEffect(() => () => sideGeometry.dispose(), [sideGeometry])
  React.useEffect(
    () => () => {
      for (const geometry of Object.values(fluidGeometries)) geometry.dispose()
    },
    [fluidGeometries],
  )
  React.useEffect(() => () => capMaterial.dispose(), [capMaterial])
  React.useEffect(() => () => sideMaterial.dispose(), [sideMaterial])
  React.useEffect(
    () => () => {
      for (const material of Object.values(fluidMaterials)) material.dispose()
    },
    [fluidMaterials],
  )
  const capRef = React.useRef<InstancedMesh>(null)
  const sideRef = React.useRef<InstancedMesh>(null)
  const fluidRefs = React.useRef<
    Record<LandHexFluidMaterialClass, InstancedMesh | null>
  >({ opaque: null, ice: null })
  const selectedIDs = React.useMemo(
    () => new Set(selectedPieceIDs),
    [selectedPieceIDs],
  )
  const hoverTargetRef = React.useRef<LandHexHoverTarget>(null)
  const hoverLeaveFrameRef = React.useRef<number | null>(null)
  const previousSelectedIDsRef = React.useRef(selectedIDs)
  const shadowProps = {
    receiveShadow: isLightsAndShadowsRender,
    castShadow: isLightsAndShadowsRender,
    frustumCulled: false,
  }

  React.useEffect(() => {
    const currentSelectedIDs = new Set(
      useBoundStore.getState().selectedPieceIDs,
    )
    updateInstanceMesh(
      capRef.current,
      capGeometry,
      solidData,
      currentSelectedIDs,
      hoverTargetRef.current,
      'cap',
    )
    updateInstanceMesh(
      sideRef.current,
      sideGeometry,
      solidData,
      currentSelectedIDs,
      hoverTargetRef.current,
      'side',
    )
    for (const materialClass of LAND_HEX_FLUID_MATERIAL_CLASSES) {
      updateInstanceMesh(
        fluidRefs.current[materialClass],
        fluidGeometries[materialClass],
        fluidDataByClass[materialClass],
        currentSelectedIDs,
        hoverTargetRef.current,
        'both',
      )
    }
  }, [capGeometry, fluidDataByClass, fluidGeometries, sideGeometry, solidData])

  React.useEffect(() => {
    const previousSelectedIDs = previousSelectedIDsRef.current
    const changedUIDs = new Set([...previousSelectedIDs, ...selectedIDs])
    for (const uid of [...changedUIDs]) {
      if (previousSelectedIDs.has(uid) === selectedIDs.has(uid)) {
        changedUIDs.delete(uid)
      }
    }

    if (changedUIDs.size > 0) {
      const updateSelection = (
        mesh: InstancedMesh | null,
        geometry: BufferGeometry,
        items: LandHexInstanceDatum[],
        index: LandHexInstanceIndex,
        surface: 'side' | 'both',
      ) => {
        if (!mesh) return
        const indices = new Set<number>()
        for (const uid of changedUIDs) {
          for (const instanceIndex of index.indicesByUID.get(uid) ?? []) {
            indices.add(instanceIndex)
          }
        }
        writeLandHighlightValues(
          geometry,
          items,
          indices,
          selectedIDs,
          hoverTargetRef.current,
          surface,
        )
      }
      updateSelection(
        sideRef.current,
        sideGeometry,
        solidData,
        solidIndex,
        'side',
      )
      for (const materialClass of LAND_HEX_FLUID_MATERIAL_CLASSES) {
        updateSelection(
          fluidRefs.current[materialClass],
          fluidGeometries[materialClass],
          fluidDataByClass[materialClass],
          fluidIndices[materialClass],
          'both',
        )
      }
    }
    previousSelectedIDsRef.current = selectedIDs
  }, [
    fluidDataByClass,
    fluidGeometries,
    fluidIndices,
    selectedIDs,
    sideGeometry,
    solidData,
    solidIndex,
  ])

  React.useEffect(
    () => () => {
      if (hoverLeaveFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverLeaveFrameRef.current)
      }
    },
    [],
  )

  const updateHoverTarget = (next: LandHexHoverTarget) => {
    const previous = hoverTargetRef.current
    if (
      previous?.uid === next?.uid &&
      previous?.hexID === next?.hexID &&
      previous?.isCap === next?.isCap
    ) {
      return
    }
    const selected = new Set(useBoundStore.getState().selectedPieceIDs)
    const updateHover = (
      mesh: InstancedMesh | null,
      geometry: BufferGeometry,
      items: LandHexInstanceDatum[],
      index: LandHexInstanceIndex,
      surface: 'cap' | 'side' | 'both',
    ) => {
      if (!mesh) return
      const transition = getLandHexHoverTransition(previous, next, index)
      const indices = getHoverAffectedIndices(transition, surface)
      if (indices.size > 0) {
        writeLandHighlightValues(
          geometry,
          items,
          indices,
          selected,
          next,
          surface,
        )
      }
    }
    updateHover(capRef.current, capGeometry, solidData, solidIndex, 'cap')
    updateHover(sideRef.current, sideGeometry, solidData, solidIndex, 'side')
    for (const materialClass of LAND_HEX_FLUID_MATERIAL_CLASSES) {
      updateHover(
        fluidRefs.current[materialClass],
        fluidGeometries[materialClass],
        fluidDataByClass[materialClass],
        fluidIndices[materialClass],
        'both',
      )
    }
    hoverTargetRef.current = next
  }

  const handlePointerEnter = (
    event: ThreeEvent<PointerEvent>,
    item: LandHexInstanceDatum,
    isCap: boolean,
  ) => {
    if (isDragPassThrough(item.uid)) return
    event.stopPropagation()
    if (hoverLeaveFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverLeaveFrameRef.current)
      hoverLeaveFrameRef.current = null
    }
    updateHoverTarget({
      uid: item.uid,
      hexID: item.hex.id,
      isCap,
    })
    if (isCap) {
      onPointerEnter(event, item.hex)
    } else {
      onPointerEnterPID(event, item.uid)
    }
  }
  const handlePointerLeave = (
    event: ThreeEvent<PointerEvent>,
    item: LandHexInstanceDatum,
  ) => {
    const target = hoverTargetRef.current
    if (target?.uid === item.uid && target.hexID === item.hex.id) {
      if (hoverLeaveFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverLeaveFrameRef.current)
      }
      hoverLeaveFrameRef.current = window.requestAnimationFrame(() => {
        hoverLeaveFrameRef.current = null
        if (hoverTargetRef.current === target) updateHoverTarget(null)
      })
    }
    onPointerOut(event)
  }
  const handlePointerMove = (
    event: ThreeEvent<PointerEvent>,
    item: LandHexInstanceDatum,
  ) => {
    onPointerMove(event, item.hex)
    if (
      isDragging() &&
      reportDragTargetHex(findPieceHexAt(item.uid, event.point), item.uid, {
        x: event.point.x,
        z: event.point.z,
      })
    ) {
      event.stopPropagation()
    }
  }
  const getItem = (
    event: ThreeEvent<PointerEvent>,
    items: LandHexInstanceDatum[],
  ) => (event.instanceId === undefined ? undefined : items[event.instanceId])
  const capEvents = {
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerEnter(event, item, true)
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerLeave(event, item)
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) onPointerUpPaintPiece(event, item.hex)
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) pressPieceForDrag(event, item.uid)
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerMove(event, item)
    },
  }
  const sideEvents = {
    ...capEvents,
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerEnter(event, item, false)
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerLeave(event, item)
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handleSideSelection(event, item.uid, toggleSelectedPieceID)
    },
  }
  const fluidEvents = (items: LandHexInstanceDatum[]) => ({
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, items)
      if (item) {
        handlePointerEnter(event, item, (event.faceIndex ?? 0) < 6)
      }
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, items)
      if (item) handlePointerLeave(event, item)
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, items)
      if (!item) return
      if ((event.faceIndex ?? 0) < 6) {
        onPointerUpPaintPiece(event, item.hex)
      } else {
        handleSideSelection(event, item.uid, toggleSelectedPieceID)
      }
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, items)
      if (item) pressPieceForDrag(event, item.uid)
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, items)
      if (item) {
        if (!isDragPassThrough(item.uid)) {
          const nextTarget = {
            uid: item.uid,
            hexID: item.hex.id,
            isCap: (event.faceIndex ?? 0) < 6,
          }
          const previous = hoverTargetRef.current
          if (
            previous?.uid !== nextTarget.uid ||
            previous?.hexID !== nextTarget.hexID ||
            previous?.isCap !== nextTarget.isCap
          ) {
            onPointerOut(event)
            if (nextTarget.isCap) {
              onPointerEnter(event, item.hex)
            } else {
              onPointerEnterPID(event, item.uid)
            }
            updateHoverTarget(nextTarget)
          }
        }
        handlePointerMove(event, item)
      }
    },
  })

  return (
    <>
      {solidData.length > 0 && (
        <>
          <instancedMesh
            ref={capRef}
            args={[undefined, undefined, solidData.length]}
            geometry={capGeometry}
            material={capMaterial}
            userData={{ landHexRenderer: true }}
            {...shadowProps}
            {...capEvents}
          />
          <instancedMesh
            ref={sideRef}
            args={[undefined, undefined, solidData.length]}
            geometry={sideGeometry}
            material={sideMaterial}
            userData={{ landHexRenderer: true }}
            {...shadowProps}
            {...sideEvents}
          />
        </>
      )}
      {LAND_HEX_FLUID_MATERIAL_CLASSES.map((materialClass) => {
        const items = fluidDataByClass[materialClass]
        if (items.length === 0) return null
        return (
          <instancedMesh
            key={materialClass}
            ref={(mesh) => {
              fluidRefs.current[materialClass] = mesh
            }}
            args={[undefined, undefined, items.length]}
            geometry={fluidGeometries[materialClass]}
            material={fluidMaterials[materialClass]}
            userData={{ landHexRenderer: true }}
            {...shadowProps}
            {...fluidEvents(items)}
          />
        )
      })}
    </>
  )
}
