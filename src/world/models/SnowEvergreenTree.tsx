import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'
import * as THREE from 'three'
import { useMemo } from 'react'
export function SnowEvergreenTree({ pid }: { pid?: string }) {
  const { nodes } = useDisposableGLTF(
    '/forgotten-forest-tree-low-poly-colored.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (pid) {
      toggleSelectedPieceID(
        pid,
        event.shiftKey || event.ctrlKey || event.metaKey,
      )
    }
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.tree]

  // 1. SAFELY INITIALIZE UNIFORMS OUTSIDE ONBEFORECOMPILE
  // This explicitly prevents WebGL from receiving malformed or un-instantiated variables
  const customUniforms = useMemo(
    () => ({
      snowColor: { value: new THREE.Color(hexTerrainColor[HexTerrain.snow]) }, // Enforces a valid THREE sequence
      snowThreshold: { value: 0.15 },
      snowSoftness: { value: 0.25 },
    }),
    [],
  )

  const handleBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms,
    _renderer: THREE.WebGLRenderer,
  ): void => {
    // Assign uniform references safely
    shader.uniforms.snowColor = customUniforms.snowColor
    shader.uniforms.snowThreshold = customUniforms.snowThreshold
    shader.uniforms.snowSoftness = customUniforms.snowSoftness

    // 2. Vertex Shader Modifications
    shader.vertexShader = `
      varying vec3 vLocalPos;
      varying vec3 vWorldNormal;
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      `void main() {
       vLocalPos = position;
       vWorldNormal = normalize(inverse(transpose(mat3(modelMatrix))) * normal);`,
    )

    // 3. Fragment Shader Structural Injection
    shader.fragmentShader = `
      varying vec3 vLocalPos;
      varying vec3 vWorldNormal;
      uniform vec3 snowColor;
      uniform float snowThreshold;
      uniform float snowSoftness;
      ${shader.fragmentShader}
    `

    // 4. The Inverted Mathematics (The look you liked!)
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = vec4( diffuse, opacity );
       
       float distFromCenterAxis = length(vLocalPos.xz);
       float upwardDot = max(0.0, vWorldNormal.y);
       
       // Map your 0.4 local scan radius to a clean 0.0 -> 1.0 factor range
       float edgeFactor = distFromCenterAxis / 0.4;
       
       // Force snow only where branches face upwards AND extend outward
       float snowFactor = edgeFactor * upwardDot;
       
       float snowMask = smoothstep(snowThreshold, snowThreshold + snowSoftness, snowFactor);
       snowMask = clamp(snowMask, 0.0, 1.0);`,
    )

    // 5. Output Color Override
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
       gl_FragColor.rgb = mix(gl_FragColor.rgb, snowColor, snowMask);`,
    )
  }

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Tree10_scanned.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              color,
              isLightsAndShadowsRender,
              undefined,
              handleBeforeCompile,
            )
          : basicModelMaterial(
              color,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
              handleBeforeCompile,
            )}
      </mesh>
    </>
  )
}

// useGltf.preload('/forgotten-forest-tree-low-poly-colored.glb')
