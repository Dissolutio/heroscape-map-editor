import { Billboard, Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import {
  HEXGRID_GLYPH_HEIGHT,
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
} from '../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../utils/map-utils'
import BigTree415 from './models/BigTree415'
import { Battlement } from './models/Battlement'
import Cannon from './models/Cannon'
import ForestTree from './models/ForestTree'
import { FortifiedWall } from './models/FortifiedWall'
import { GlyphModel } from './models/Glyph'
import { Ladder } from './models/Ladder'
import LaurPillar from './models/LaurPillar'
import LaurWallTrianglePillar from './models/LaurTrianglePillar'
import { LaurWallArchAddon } from './models/LaurWallArchModel'
import { LaurWallLongAddon } from './models/LaurWallLongModel'
import { LaurWallRuinAddon } from './models/LaurWallRuinModel'
import { LaurWallShortAddon } from './models/LaurWallShortModel'
import MarroHive6 from './models/MarroHive6'
import { MarvelRuin } from './models/MarvelRuin'
import { RoadWall } from './models/RoadWall'
import ModelLoader from './models/ModelLoader'
import ObstacleBase from './models/ObstacleBase'
import { Outcrop1 } from './models/Outcrop1'
import Outcrop3 from './models/Outcrop3'
import Outcrop4 from './models/Outcrop4'
import Outcrop6 from './models/Outcrop6'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForBigTree,
  getOptionsForPalmHeight,
  getOptionsForTreeHeight,
  getRoadWallOptions,
  getRuinsOptions,
} from './models/piece-adjustments'
import Ruins2 from './models/Ruins2'
import Ruins3 from './models/Ruins3'
import { RopeLadder } from './models/RopeLadder'
import { ShipBow } from './models/ShipBow'
import { ShipWall } from './models/ShipWall'
import Shroudshroom10 from './models/Shroudshroom10'
import Shroudshroom13 from './models/Shroudshroom13'
import Shroudshroom7 from './models/Shroudshroom7'
import { StartZone3D } from './models/StartZone3D'
import JungleBrush from './models/TicallaBrush'
import TicallaPalm from './models/TicallaPalm'
import { hexTerrainColor } from './maphex/hexColors'
import LandSubterrain from './models/LandSubterrain'

export const MapBoardPiece3D = ({
  bp,
  onPointerUpPaintPiece,
}: {
  bp: BoardPiece
  onPointerUpPaintPiece: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) => {
  const { inventoryID, altitude, rotation, pieceCoords, uid } = bp
  const piece = piecesSoFar[inventoryID]
  const boardHexes = useBoundStore((s) => s.boardHexes)
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
  const laurPillarHeight = isUnderHexFluid
    ? yWithBase - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_FLUID_HEIGHT
    : yWithBase
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
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallRuinAddon pid={uid} />
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
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallShortAddon pid={uid} />
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
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallLongAddon pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.laurWallArch) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallArchAddon pid={uid} />
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
          y + HEXGRID_HEXCAP_HEIGHT / 2,
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
      <group
        position={[x, y + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
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
          y,
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
    inventoryID === Pieces.tree12 ||
    inventoryID === Pieces.snowTree10 ||
    inventoryID === Pieces.snowTree12
  ) {
    const treeOptions = getOptionsForTreeHeight(inventoryID)
    return (
      <>
        <group
          scale={[treeOptions.scaleX, treeOptions.scaleY, treeOptions.scaleX]}
          position={[x, yWithBase + treeOptions.y, z]}
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

  if (inventoryID === Pieces.tree415) {
    const bigTreeOptions = getOptionsForBigTree(rotation)
    return (
      <>
        <Suspense fallback={<ModelLoader />}>
          <group
            position={[
              x + bigTreeOptions.xAdd,
              yWithBase,
              z + bigTreeOptions.zAdd,
            ]}
            scale={0.038}
            rotation={[0, bigTreeOptions.rotationY, 0]}
          >
            <BigTree415 pid={uid} />
          </group>
        </Suspense>
        <ObstacleBase x={x} y={yBase} z={z} color={hexTerrainColor.treeBase} />
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
        position={[x, y - HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, getObstaclRotation(rotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ShipWall pid={uid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.shipBow) {
    return (
      <group
        position={[x, y - HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, getObstaclRotation(rotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ShipBow pid={uid} />
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

  if (inventoryID === Pieces.laurWallSquarePillar) {
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
        rotation={[0, pieceRotation, Math.PI / 2]}
      >
        <StartZone3D pid={uid} inventoryID={inventoryID} />
      </group>
    )
  }

  if (
    inventoryID === Pieces.glacier1 ||
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1
  ) {
    const isGlacier = inventoryID === Pieces.glacier1
    const isLavaRock = inventoryID === Pieces.lavaRockOutcrop1
    const baseColor = isGlacier
      ? hexTerrainColor[HexTerrain.ice]
      : isLavaRock
        ? hexTerrainColor[HexTerrain.lava]
        : hexTerrainColor[HexTerrain.shadow]
    return (
      <>
        <group position={[x, yWithBase, z]} rotation={[0, pieceRotation, 0]}>
          <Suspense fallback={<ModelLoader />}>
            <Outcrop1 isGlacier={isGlacier} isLavaRock={isLavaRock} pid={uid} />
          </Suspense>
        </group>
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={baseColor}
          isFluidBase={true}
        />
      </>
    )
  }

  if (
    inventoryID === Pieces.glacier3 ||
    inventoryID === Pieces.lavaRockOutcrop3 ||
    inventoryID === Pieces.outcrop3
  ) {
    const isGlacier = inventoryID === Pieces.glacier3
    const isLavaRock = inventoryID === Pieces.lavaRockOutcrop3
    const baseColor = isGlacier
      ? hexTerrainColor[HexTerrain.ice]
      : isLavaRock
        ? hexTerrainColor[HexTerrain.lava]
        : hexTerrainColor[HexTerrain.shadow]
    return (
      <>
        <group
          position={[x, yWithBase, z]}
          rotation={[0, getObstaclRotation(rotation), 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Outcrop3 isGlacier={isGlacier} isLavaRock={isLavaRock} pid={uid} />
          </Suspense>
        </group>
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={baseColor}
          isFluidBase={true}
        />
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
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.ice]}
          isFluidBase={true}
        />
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
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.ice]}
          isFluidBase={true}
        />
      </>
    )
  }

  if (inventoryID === Pieces.ladder) {
    return (
      <group
        position={[
          x + getLadderBattlementOptions(rotation).xAdd,
          y - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_HEIGHT / 2,
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
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.swampWater]}
          isFluidBase={true}
        />
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

  const isFluidLandPiece = piece && isFluidTerrainHex(piece.terrain)
  const isSolidLandPiece = piece && isSolidTerrainHex(piece.terrain)
  if (isFluidLandPiece || isSolidLandPiece) {
    return (
      <group
        position={[x, yBaseCap, z]}
        rotation={[0, pieceRotation, 0]}
        scale={isFluidLandPiece ? [1, HEXGRID_HEXCAP_FLUID_SCALE, 1] : undefined}
      >
        <Suspense fallback={<ModelLoader />}>
          <LandSubterrain
            inventoryID={inventoryID}
            terrain={piece.terrain}
            uid={uid}
          />
        </Suspense>
      </group>
    )
  }

  return <></>
}
