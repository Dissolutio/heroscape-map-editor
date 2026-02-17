import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { decodePieceID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function LaurWallAddon({ pid }: { pid: string }) {
  const {
    nodes: { LaurWallRuin, LaurWallRuinBustedConcrete },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-ruin-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallShort, LaurWallShortDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-short-from-hs-models-blendfile.glb') as any
  // } = useGLTF('/laurwall-short.glb') as any
  const {
    nodes: { LaurWallLong, LaurWallLongDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallLongArch },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-arch.glb') as any
  const { inventoryID } = decodePieceID(pid)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const pillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor.laurModelColor2
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : pid)
  }
  if (inventoryID === Pieces.laurWallArch) {
    return (
      <group
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={LaurWallLongArch.geometry}
        >
          {basicModelMaterial(pillarColor, isLightsAndShadowsRender)}
        </mesh>
      </group>
    )
  }
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {/* LAUR WALL RUIN */}
      {/* {inventoryID === Pieces.laurWallRuin2 && ()} */}
      {/* {inventoryID === Pieces.laurWallRuin3 && ()} */}
      {inventoryID === Pieces.laurWallRuin1 && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(pillarColor, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(interiorPillarColor, isLightsAndShadowsRender)}
          </mesh>
        </>
      )}
      {/* LAUR WALL SHORT */}
      {/* {inventoryID === Pieces.laurWallShortStackable && ()} */}
      {inventoryID === Pieces.laurWallShort && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShort.geometry}
          >
            {basicModelMaterial(pillarColor, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(interiorPillarColor, isLightsAndShadowsRender)}
          </mesh>
        </>
      )}
      {/* LAUR WALL LONG */}
      {/* {inventoryID === Pieces.laurWallLongStackable && ()} */}
      {inventoryID === Pieces.laurWallLong && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLong.geometry}
          >
            {basicModelMaterial(pillarColor, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(interiorPillarColor, isLightsAndShadowsRender)}
          </mesh>
        </>
      )}
      {/* LAUR WALL Arch */}
      {/* {inventoryID === Pieces.laurWallLongStackable && ()} */}
    </group>
  )
}
export function LaurWallAddonPreview({ inventoryID }: { inventoryID: string }) {
  const {
    nodes: { LaurWallRuin, LaurWallRuinBustedConcrete },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-ruin-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallShort, LaurWallShortDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-short-from-hs-models-blendfile.glb') as any
  // } = useGLTF('/laurwall-short.glb') as any
  const {
    nodes: { LaurWallLong, LaurWallLongDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallLongArch },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-arch.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2

  return (
    <>
      {/* LAUR WALL RUIN */}
      {inventoryID === Pieces.laurWallRuin1 && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* TODO: laur wall ruin 2 */}
      {inventoryID === Pieces.laurWallRuin2 && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* TODO: laur wall ruin 3 */}
      {inventoryID === Pieces.laurWallRuin3 && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* LAUR WALL SHORT */}
      {inventoryID === Pieces.laurWallShort && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShort.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* TODO: laur wall short-stackable */}
      {inventoryID === Pieces.laurWallShortStackable && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShort.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* LAUR WALL LONG */}
      {inventoryID === Pieces.laurWallLong && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLong.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* TODO: laur wall long-stackable */}
      {inventoryID === Pieces.laurWallLongStackable && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLong.geometry}
          >
            {basicModelMaterial(
              pillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(
              interiorPillarColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
          </mesh>
        </>
      )}
      {/* TODO: laur wall arch */}
      {inventoryID === Pieces.laurWallArch && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={LaurWallLongArch.geometry}
        >
          {basicModelMaterial(
            pillarColor,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
        </mesh>
      )}
    </>
  )
}
// useGltf.preload('/laurwall-ruin-from-hs-models-blendfile.glb')
// useGltf.preload('/laurwall-short-from-hs-models-blendfile.glb')
// useGltf.preload('/laurwall-long-from-hs-models-blendfile.glb')
// useGltf.preload('/laurwall-long-arch.glb')
