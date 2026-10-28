import { Billboard, Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import {
  hasSupportingLaurPillar,
  isLaurPillarID,
} from '../data/laurPillarStacking'
import { piecesSoFar } from '../data/pieces'
import {
  resolveRotationPivot,
  shouldShowRotationPivotMarker,
} from '../data/rotationPivot'
import { shouldRenderPlacedPiece } from '../data/startZoneVisibility'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEX_RADIUS,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
} from '../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../utils/map-utils'
import { PlacementFootprint } from './PlacementFootprint'
import {
  isDragging,
  pressPieceForDrag,
  reportDragTargetHex,
} from './drag/dragController'
import { hexTerrainColor } from './maphex/hexColors'
import { Battlement } from './models/Battlement'
import BigTree415 from './models/BigTree415'
import Cannon from './models/Cannon'
import ForestTree from './models/ForestTree'
import { FortifiedWall } from './models/FortifiedWall'
import { GlyphModel } from './models/Glyph'
import { Ladder } from './models/Ladder'
import LandSubterrain from './models/LandSubterrain'
import LaurPillar from './models/LaurPillar'
import LaurWallTrianglePillar from './models/LaurTrianglePillar'
import { LaurWallArchAddon } from './models/LaurWallArchModel'
import { LaurWallLongAddon } from './models/LaurWallLongModel'
import { LaurWallRuinAddon } from './models/LaurWallRuinModel'
import { LaurWallShortAddon } from './models/LaurWallShortModel'
import MarroHive6 from './models/MarroHive6'
import { MarvelRuin } from './models/MarvelRuin'
import ModelLoader from './models/ModelLoader'
import ObstacleBase from './models/ObstacleBase'
import { Outcrop1 } from './models/Outcrop1'
import Outcrop3 from './models/Outcrop3'
import Outcrop4 from './models/Outcrop4'
import Outcrop6 from './models/Outcrop6'
import { RoadWall } from './models/RoadWall'
import { RopeLadder } from './models/RopeLadder'
import Ruins2 from './models/Ruins2'
import Ruins3 from './models/Ruins3'
import { ShipBow } from './models/ShipBow'
import { ShipWall } from './models/ShipWall.tsx'
import Shroudshroom7 from './models/Shroudshroom7'
import Shroudshroom10 from './models/Shroudshroom10'
import Shroudshroom13 from './models/Shroudshroom13'
import { SnowEvergreenTree } from './models/SnowEvergreenTree'
import { StartZone3D } from './models/StartZone3D'
import JungleBrush from './models/TicallaBrush'
import TicallaPalm from './models/TicallaPalm'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForPalmHeight,
  getOptionsForTreeHeight,
  getRoadWallOptions,
  getRuinsOptions,
} from './models/piece-adjustments'

type MapBoardPiece3DProps = {
  bp: BoardPiece
  onPointerUpPaintPiece: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

/**
 * A placed piece's model. The group gives every model one place for
 * drag-to-move (pointer events bubble up from the model's meshes): a press
 * may start dragging this piece, and while another piece is dragged the
 * model stands for the hex it stands on.
 */
export const MapBoardPiece3D = (props: MapBoardPiece3DProps) => {
  const { uid, pieceCoords, altitude } = props.bp
  const isUnsupported = useBoundStore((s) =>
    s.unsupportedPieceUIDs.includes(uid),
  )
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const rotationPivot = useBoundStore((s) => s.rotationPivot)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const isShowStartZones = useBoundStore((s) => s.isShowStartZones)
  if (!shouldRenderPlacedPiece(props.bp, isShowStartZones)) return null
  const isLastSelected = selectedPieceIDs[selectedPieceIDs.length - 1] === uid
  const resolvedPivot = isLastSelected
    ? resolveRotationPivot(
        selectedPieceIDs,
        boardPieces,
        boardHexes,
        rotationPivot,
      )
    : undefined
  const pivotCoords = resolvedPivot?.coords ?? pieceCoords
  const pivotAltitude = resolvedPivot?.surfaceAltitude ?? altitude + 1
  const isPivot = shouldShowRotationPivotMarker(
    selectedPieceIDs,
    uid,
    boardHexes,
    pieceCoords,
    pivotCoords,
  )
  const isVisible = altitude + 1 <= viewingLevel
  const isPivotVisible = pivotAltitude <= viewingLevel
  const { x, y, z } = getBoardHex3DCoords({
    ...pivotCoords,
    altitude: pivotAltitude,
  })
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging()) return
    const { boardHexes } = useBoundStore.getState()
    const support = isLaurPillarID(props.bp.inventoryID)
      ? ({
          ...pieceCoords,
          boardPieceUID: uid,
          altitude,
          inventoryID: props.bp.inventoryID,
          pieceID: '',
          pieceRotation: props.bp.rotation,
          terrain: HexTerrain.laurWall,
        } as BoardHex)
      : boardHexes[genBoardHexID({ ...pieceCoords, altitude })]
    if (reportDragTargetHex(support, uid, { x: e.point.x, z: e.point.z })) {
      e.stopPropagation()
    }
  }
  return (
    <group
      userData={{ boardPieceUID: uid }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => pressPieceForDrag(e, uid)}
      onPointerMove={onPointerMove}
    >
      <MapBoardPiece3DModel {...props} />
      {isUnsupported && altitude + 1 <= viewingLevel && (
        <PlacementFootprint
          status="ok"
          unsupported
          footprintHexes={[]}
          hoveredHex={{ ...pieceCoords, altitude }}
        />
      )}
      {isPivot && isVisible && isPivotVisible && (
        <mesh
          position={[
            x,
            y - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_HEIGHT + 0.03,
            z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
          renderOrder={30}
        >
          <ringGeometry
            args={[
              HEXGRID_HEX_RADIUS * 0.72,
              HEXGRID_HEX_RADIUS * 0.82,
              6,
              1,
              Math.PI / 6,
            ]}
          />
          <meshBasicMaterial
            color="#00e5ff"
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

const MapBoardPiece3DModel = ({
  bp,
  onPointerUpPaintPiece,
}: MapBoardPiece3DProps) => {
  const { inventoryID, altitude, rotation, pieceCoords, uid } = bp
  const piece = piecesSoFar[inventoryID]
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const { x, z, y, yBase, yBaseCap, yWithBase, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })
  const underHexID = genBoardHexID({ ...pieceCoords, altitude })
  const underHexTerrain = boardHexes?.[underHexID]?.terrain ?? HexTerrain.grass
  const isUnderHexFluid = isFluidTerrainHex(underHexTerrain)
  const {
    x: xLaurWall,
    z: zLaurWall,
    yWithBase: yLaurWall,
  } = getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })
  const pieceRotation = (rotation * -Math.PI) / 3
  const ruinsOptions = getRuinsOptions(rotation)
  const hasSupportingPillar = hasSupportingLaurPillar(boardPieces, bp)
  const pillarStackYOffset = hasSupportingPillar
    ? HEXGRID_OBSTACLE_BASE_HEIGHT
    : 0
  const laurPillarHeight = isUnderHexFluid
    ? yWithBase - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_FLUID_HEIGHT
    : yWithBase - pillarStackYOffset
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = altitude + 1 <= viewingLevel
  const isPowerGlyph = inventoryID === Pieces.glyphPower
  const isTreasureGlyph = inventoryID === Pieces.glyphTreasure
  const isAnyGlyph = inventoryID.startsWith('y')
  const isNamedGlyph =
    isAnyGlyph &&
    !isPowerGlyph &&
    !isTreasureGlyph &&
    piecesSoFar?.[inventoryID]
  if (!isVisible) {
    return null
  }

  if (
    inventoryID === Pieces.laurWallRuin1 ||
    inventoryID === Pieces.laurWallRuin2 ||
    inventoryID === Pieces.laurWallRuin3
  ) {
    return (
      <group
        position={
          new Vector3(xLaurWall, yLaurWall - pillarStackYOffset, zLaurWall)
        }
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallRuinAddon
            bp={bp}
            onPointerUpPaintPiece={onPointerUpPaintPiece}
          />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallShortStackable
  ) {
    return (
      <group
        position={
          new Vector3(xLaurWall, yLaurWall - pillarStackYOffset, zLaurWall)
        }
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallShortAddon
            bp={bp}
            onPointerUpPaintPiece={onPointerUpPaintPiece}
          />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.laurWallLong ||
    inventoryID === Pieces.laurWallLongStackable
  ) {
    return (
      <group
        position={
          new Vector3(xLaurWall, yLaurWall - pillarStackYOffset, zLaurWall)
        }
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallLongAddon
            bp={bp}
            onPointerUpPaintPiece={onPointerUpPaintPiece}
          />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.laurWallArch) {
    return (
      <group
        position={
          new Vector3(xLaurWall, yLaurWall - pillarStackYOffset, zLaurWall)
        }
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallArchAddon
            bp={bp}
            onPointerUpPaintPiece={onPointerUpPaintPiece}
          />
        </Suspense>
      </group>
    )
  }

  // BATTLEMENT
  if (inventoryID === Pieces.battlement) {
    return (
      <group
        position={[
          x + getLadderBattlementOptions(rotation).xAdd,
          y - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_HEIGHT / 2,
          z + getLadderBattlementOptions(rotation).zAdd,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Battlement pid={uid} />
        </Suspense>
      </group>
    )
  }

  // ROPE LADDER
  if (inventoryID === Pieces.ropeLadder) {
    return (
      <group position={[x, y, z]} rotation={[0, (rotation * -Math.PI) / 3, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <RopeLadder pid={uid} />
        </Suspense>
      </group>
    )
  }

  // ROADWALL
  if (inventoryID === Pieces.roadWall) {
    return (
      <group
        position={[
          x + getRoadWallOptions(rotation).xAdd,
          y - HEXGRID_HEX_HEIGHT,
          z + getRoadWallOptions(rotation).zAdd,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <RoadWall pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.tree10 ||
    inventoryID === Pieces.tree11 ||
    inventoryID === Pieces.tree12
  ) {
    const treeOptions = getOptionsForTreeHeight(inventoryID)
    return (
      <>
        <group
          scale={[treeOptions.scaleX, treeOptions.scaleY, treeOptions.scaleX]}
          position={[x, yWithBase - HEXGRID_HEXCAP_HEIGHT / 10, z]}
          rotation={[0, pieceRotation, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <ForestTree pid={uid} />
          </Suspense>
        </group>
        <ObstacleBase x={x} y={yBase} z={z} color={hexTerrainColor.treeBase} />
      </>
    )
  }
  if (inventoryID === Pieces.snowTree10 || inventoryID === Pieces.snowTree12) {
    const treeOptions = getOptionsForTreeHeight(inventoryID)
    return (
      <>
        <group
          scale={[treeOptions.scaleX, treeOptions.scaleY, treeOptions.scaleX]}
          position={[x, yWithBase, z]}
          rotation={[0, pieceRotation, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <SnowEvergreenTree pid={uid} />
          </Suspense>
        </group>
        <ObstacleBase x={x} y={yBase} z={z} color={hexTerrainColor.treeBase} />
      </>
    )
  }

  if (inventoryID === Pieces.tree415) {
    return (
      <>
        <group
          position={[x, y - HEXGRID_HEX_HEIGHT, z]}
          rotation={[0, pieceRotation, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <BigTree415 pid={uid} />
          </Suspense>
        </group>
      </>
    )
  }

  if (inventoryID === Pieces.shroudshroom7) {
    return (
      <group
        position={[x, y - HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom7 pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.shroudshroom10) {
    return (
      <group
        position={[x, y - HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom10 pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.shroudshroom13) {
    return (
      <group
        position={[x, y - HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom13 pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.shipWall) {
    return (
      <group
        position={[
          x,
          // either gets moved down to fluid level, or up to solid cap level
          y -
            HEXGRID_HEX_HEIGHT -
            (isUnderHexFluid
              ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
              : -HEXGRID_HEXCAP_HEIGHT / 2),
          z,
        ]}
        rotation={[0, getObstaclRotation(rotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ShipWall pid={uid} bp={bp} onPointerUp={onPointerUpPaintPiece} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.shipBow) {
    return (
      <group
        position={[
          x,
          // either gets moved down to fluid level, or up to solid cap level
          y -
            HEXGRID_HEX_HEIGHT -
            (isUnderHexFluid
              ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
              : -HEXGRID_HEXCAP_HEIGHT / 2),
          z,
        ]}
        rotation={[0, getObstaclRotation(rotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ShipBow pid={uid} bp={bp} onPointerUp={onPointerUpPaintPiece} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.cannon) {
    return (
      <group
        position={[x, y - HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Cannon pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.laurWallSquarePillar ||
    inventoryID === Pieces.laurWallPillarStackable
  ) {
    return (
      <group
        position={[x, laurPillarHeight, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurPillar bp={bp} onPointerUp={onPointerUpPaintPiece} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.laurWallTrianglePillar) {
    return (
      <group
        position={[x, laurPillarHeight, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallTrianglePillar
            bp={bp}
            onPointerUp={onPointerUpPaintPiece}
            pieceRotation={pieceRotation}
          />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.brush9 ||
    inventoryID === Pieces.swampBrush10 ||
    inventoryID === Pieces.laurBrush10
  ) {
    return (
      <group position={[x, yBaseCap, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <JungleBrush pid={uid} inventoryID={inventoryID} />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.palm14 ||
    inventoryID === Pieces.palm15 ||
    inventoryID === Pieces.palm16 ||
    inventoryID === Pieces.laurPalm13 ||
    inventoryID === Pieces.laurPalm14 ||
    inventoryID === Pieces.laurPalm15
  ) {
    const palmOptions = getOptionsForPalmHeight(inventoryID)
    return (
      <group
        scale={[1, palmOptions.scaleY, 1]}
        position={[x, yBaseCap, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <TicallaPalm pid={uid} inventoryID={inventoryID} />
        </Suspense>
      </group>
    )
  }

  if (isAnyGlyph) {
    return (
      <>
        {isNamedGlyph && (
          <Billboard
            position={[
              x,
              (isUnderHexFluid ? yGlyphFluidUnder : yGlyph) +
                HEXGRID_HEX_HEIGHT / 3,
              z,
            ]}
          >
            <Text
              font="/fonts/Inter_18pt-Bold.ttf"
              fontSize={0.14}
              color={'white'}
            >
              {piecesSoFar?.[inventoryID]?.title}
            </Text>
          </Billboard>
        )}
        <group
          position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
          rotation={[0, pieceRotation, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <GlyphModel
              pid={uid}
              isNamedGlyph={Boolean(isNamedGlyph)}
              terrain={
                isTreasureGlyph
                  ? HexTerrain.glyphTreasure
                  : HexTerrain.glyphPower
              }
            />
          </Suspense>
        </group>
      </>
    )
  }

  if (
    inventoryID === Pieces.startZone1 ||
    inventoryID === Pieces.startZone2 ||
    inventoryID === Pieces.startZone3 ||
    inventoryID === Pieces.startZone4 ||
    inventoryID === Pieces.startZone5 ||
    inventoryID === Pieces.startZone6 ||
    inventoryID === Pieces.startZone7 ||
    inventoryID === Pieces.startZone8
  ) {
    return (
      <group
        position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
        // rotation={
        //   useLegacyStartZones
        //     ? [0, pieceRotation, Math.PI / 2]
        //     : [0, Math.PI / 6, 0]
        // }
      >
        <StartZone3D pid={uid} inventoryID={inventoryID} />
      </group>
    )
  }

  if (
    inventoryID === Pieces.glacier1 ||
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1 ||
    inventoryID === Pieces.toxicOutcrop1
  ) {
    const isGlacier = inventoryID === Pieces.glacier1
    const isLavaRock = inventoryID === Pieces.lavaRockOutcrop1
    const isToxic = inventoryID === Pieces.toxicOutcrop1
    const baseColor = isGlacier
      ? hexTerrainColor[HexTerrain.ice]
      : isLavaRock
        ? hexTerrainColor[HexTerrain.lava]
        : isToxic
          ? hexTerrainColor[HexTerrain.toxic]
          : hexTerrainColor[HexTerrain.shadow]
    return (
      <>
        <group position={[x, yWithBase, z]} rotation={[0, pieceRotation, 0]}>
          <Suspense fallback={<ModelLoader />}>
            <Outcrop1
              isGlacier={isGlacier}
              isLavaRock={isLavaRock}
              isToxic={isToxic}
              pid={uid}
            />
          </Suspense>
        </group>
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, pieceRotation, 0]}
          scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain
              colorOverride={baseColor}
              inventoryID={inventoryID}
              terrain={piece.terrain}
              uid={uid}
              isFluidOverride={true}
            />
          </Suspense>
        </group>
      </>
    )
  }

  if (
    inventoryID === Pieces.glacier3 ||
    inventoryID === Pieces.lavaRockOutcrop3 ||
    inventoryID === Pieces.outcrop3 ||
    inventoryID === Pieces.toxicOutcrop3
  ) {
    const isGlacier = inventoryID === Pieces.glacier3
    const isLavaRock = inventoryID === Pieces.lavaRockOutcrop3
    const isToxic = inventoryID === Pieces.toxicOutcrop3
    const baseColor = isGlacier
      ? hexTerrainColor[HexTerrain.ice]
      : isLavaRock
        ? hexTerrainColor[HexTerrain.lava]
        : isToxic
          ? hexTerrainColor[HexTerrain.toxic]
          : hexTerrainColor[HexTerrain.shadow]
    return (
      <>
        <group
          position={[x, yWithBase, z]}
          rotation={[0, getObstaclRotation(rotation), 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Outcrop3
              isGlacier={isGlacier}
              isLavaRock={isLavaRock}
              isToxic={isToxic}
              pid={uid}
            />
          </Suspense>
        </group>
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, pieceRotation, 0]}
          scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain
              colorOverride={baseColor}
              inventoryID={inventoryID}
              terrain={piece.terrain}
              uid={uid}
              isFluidOverride={true}
            />
          </Suspense>
        </group>
      </>
    )
  }

  if (inventoryID === Pieces.glacier4) {
    return (
      <>
        <group
          position={[x, yWithBase, z]}
          rotation={[0, getObstaclRotation(rotation), 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Outcrop4 isGlacier={true} pid={uid} />
          </Suspense>
        </group>
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, pieceRotation, 0]}
          scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain
              colorOverride={hexTerrainColor[HexTerrain.ice]}
              inventoryID={inventoryID}
              terrain={piece.terrain}
              uid={uid}
              isFluidOverride={true}
            />
          </Suspense>
        </group>
      </>
    )
  }

  if (inventoryID === Pieces.glacier6) {
    return (
      <>
        <group
          position={[x, yWithBase, z]}
          rotation={[0, getObstaclRotation(rotation), 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Outcrop6 isGlacier={true} pid={uid} />
          </Suspense>
        </group>
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, pieceRotation, 0]}
          scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain
              colorOverride={hexTerrainColor[HexTerrain.ice]}
              inventoryID={inventoryID}
              terrain={piece.terrain}
              uid={uid}
              isFluidOverride={true}
            />
          </Suspense>
        </group>
      </>
    )
  }

  if (inventoryID === Pieces.ladder) {
    // Walk down through any chain of ladder hexes to find if the bottom terrain is fluid
    const isLadderChainOnFluid = (() => {
      if (isUnderHexFluid) return true
      if (underHexTerrain !== HexTerrain.ladder) return false
      let checkAlt = altitude - 1
      while (checkAlt >= 0) {
        const checkHex =
          boardHexes?.[genBoardHexID({ ...pieceCoords, altitude: checkAlt })]
        if (!checkHex) return false
        if (checkHex.terrain === HexTerrain.ladder) {
          checkAlt--
          continue
        }
        return isFluidTerrainHex(checkHex.terrain)
      }
      return false
    })()
    return (
      <group
        position={[
          x + getLadderBattlementOptions(rotation).xAdd,
          // either gets moved down to fluid level, or up to solid cap level
          y -
            HEXGRID_HEX_HEIGHT -
            (isLadderChainOnFluid
              ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
              : -HEXGRID_HEXCAP_HEIGHT / 2),
          z + getLadderBattlementOptions(rotation).zAdd,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Ladder bp={bp} onPointerUp={onPointerUpPaintPiece} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.hive) {
    return (
      <>
        <group
          position={[x, yWithBase, z]}
          rotation={[0, getObstaclRotation(rotation), 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <MarroHive6 pid={uid} />
          </Suspense>
        </group>
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, pieceRotation, 0]}
          scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain
              colorOverride={hexTerrainColor[HexTerrain.swampWater]}
              inventoryID={inventoryID}
              terrain={piece.terrain}
              uid={uid}
              isFluidOverride={true}
            />
          </Suspense>
        </group>
      </>
    )
  }

  if (inventoryID === Pieces.ruins2) {
    return (
      <group
        position={[x + ruinsOptions.xAdd, yBaseCap, z + ruinsOptions.zAdd]}
        rotation={[0, ruinsOptions.rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Ruins2 pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.ruins3) {
    return (
      <group
        position={[x + ruinsOptions.xAdd, yBaseCap, z + ruinsOptions.zAdd]}
        rotation={[0, ruinsOptions.rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Ruins3 pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.fortifiedWall) {
    return (
      <group position={[x, yBaseCap, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <FortifiedWall pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.marvel ||
    inventoryID === Pieces.marvelBroken ||
    inventoryID === Pieces.marvelNoUpper ||
    inventoryID === Pieces.marvelNoUpperBroken
  ) {
    return (
      <group position={[x, yBaseCap, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <MarvelRuin pid={uid} inventoryID={inventoryID} />
        </Suspense>
      </group>
    )
  }

  // Ordinary land/water subterrain tiles are rendered via LandSubterrainInstanced
  // in MapDisplay3D.tsx for performance, so nothing left to render here.
  return null
}
