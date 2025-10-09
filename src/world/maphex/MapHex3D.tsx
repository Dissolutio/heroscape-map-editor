import type { ThreeEvent } from '@react-three/fiber'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
} from '../../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'
import { CastleArch } from '../models/CastleArch'
import CastleBase from '../models/CastleBases'
import { CastleWall } from '../models/CastleWalls'
import { Ladder } from '../models/Ladder'
import LandSubterrain from '../models/LandSubterrain'
import { LaurWallPillar } from '../models/LaurPillar'
import MarroHive6 from '../models/MarroHive6'
import ModelLoader from '../models/ModelLoader'
import ObstacleBase from '../models/ObstacleBase'
import { Outcrop3 } from '../models/Outcrop3'
import Outcrop4 from '../models/Outcrop4'
import { Outcrop6 } from '../models/Outcrop6'
import TicallaPalm from '../models/TicallaPalm'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForPalmHeight,
} from '../models/piece-adjustments'
import HeightRing, { TopOutlineInterlockHex } from './HeightRing'
import { MapHexIDDisplay } from './MapHexIDDisplay'
import { hexTerrainColor } from './hexColors'
import { LaurWallTrianglePillar } from '../models/LaurTrianglePillar'
import JungleBrush from '../models/TicallaBrush'

export const MapHex3D = ({
  boardHex,
  onPointerUpPaintPiece,
}: {
  boardHex: BoardHex
  onPointerUpPaintPiece: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isTopOutlinedInterlockHexes = useBoundStore(
    (s) => s.isTopOutlinedInterlockHexes,
  )
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const inventoryID = boardHex.inventoryID
  const { x, y, z, yWithBase, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)
  const underHexID = genBoardHexID({
    ...boardHex,
    altitude: boardHex.altitude - 1,
  })
  const underHexTerrain = boardHexes?.[underHexID]?.terrain ?? HexTerrain.grass
  const isUnderHexFluid = isFluidTerrainHex(underHexTerrain)
  const isShowEmptyHexes =
    !isTakingPicture && boardHex.terrain === HexTerrain.empty
  const isHeightRingedHex =
    (isSolidTerrainHex(boardHex.terrain) && !boardHex.isCap) || isShowEmptyHexes
  const isTopOutlinedInterlockHex =
    isTopOutlinedInterlockHexes && !isTakingPicture
  const isSolidSubterrain =
    isSolidTerrainHex(boardHex.terrain) && boardHex.isObstacleOrigin
  const isFluidSubterrain =
    isFluidTerrainHex(boardHex.terrain) && boardHex.isObstacleOrigin
  const isLaurSquarePillarHex =
    boardHex.inventoryID === Pieces.laurWallSquarePillar &&
    boardHex.isObstacleOrigin
  const isLaurTrianglePillarHex =
    boardHex.inventoryID === Pieces.laurWallTrianglePillar &&
    boardHex.isObstacleOrigin
  const isBrushHex =
    boardHex.terrain === HexTerrain.brush && boardHex.isObstacleOrigin
  const isPalmHex =
    boardHex.terrain === HexTerrain.palm && boardHex.isObstacleOrigin
  const isLadderHex =
    boardHex.terrain === HexTerrain.ladder && boardHex.isObstacleOrigin
  const isOutcrop3Hex =
    inventoryID === Pieces.outcrop3 && boardHex.isObstacleOrigin
  const isOutcrop3BaseHex =
    inventoryID === Pieces.outcrop3 && boardHex.isObstacleAuxiliary
  const isLavaRockOutcrop3Hex =
    inventoryID === Pieces.lavaRockOutcrop3 && boardHex.isObstacleOrigin
  const isLavaRockOutcrop3BaseHex =
    inventoryID === Pieces.lavaRockOutcrop3 && boardHex.isObstacleAuxiliary
  const isGlacier3Hex =
    inventoryID === Pieces.glacier3 && boardHex.isObstacleOrigin
  const isGlacier3BaseHex =
    inventoryID === Pieces.glacier3 && boardHex.isObstacleAuxiliary
  const isGlacier4Hex =
    inventoryID === Pieces.glacier4 && boardHex.isObstacleOrigin
  const isGlacier4BaseHex =
    inventoryID === Pieces.glacier4 && boardHex.isObstacleAuxiliary
  const isGlacier6Hex =
    inventoryID === Pieces.glacier6 && boardHex.isObstacleOrigin
  const isGlacier6BaseHex =
    inventoryID === Pieces.glacier6 && boardHex.isObstacleAuxiliary
  const isHiveHex =
    boardHex.inventoryID === Pieces.hive && boardHex.isObstacleOrigin
  const isHiveBaseHex =
    boardHex.inventoryID === Pieces.hive && boardHex.isObstacleAuxiliary
  const isCastleBaseEnd = inventoryID === Pieces.castleBaseEnd
  const isCastleBaseStraight = inventoryID === Pieces.castleBaseStraight
  const isCastleBaseCorner = inventoryID === Pieces.castleBaseCorner
  const isCastleWallEnd =
    inventoryID === Pieces.castleWallEnd && boardHex.isObstacleOrigin
  const isCastleWallStraight =
    inventoryID === Pieces.castleWallStraight && boardHex.isObstacleOrigin
  const isCastleWallCorner =
    inventoryID === Pieces.castleWallCorner && boardHex.isObstacleOrigin
  const isCastleWall =
    isCastleWallEnd || isCastleWallStraight || isCastleWallCorner
  const isCastleBase = boardHex.terrain === HexTerrain.castleBase
  const isCastleArch =
    inventoryID === Pieces.castleArch || inventoryID === Pieces.castleArchNoDoor

  const pieceRotation = (boardHex.pieceRotation * -Math.PI) / 3

  if (!isVisible) {
    return null
  }
  const laurPillarHeight = isUnderHexFluid
    ? yWithBase - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_FLUID_HEIGHT
    : yWithBase
  return (
    <>
      <MapHexIDDisplay
        boardHex={boardHex}
        position={new Vector3(x, y + 0.2, z)}
      />
      {/* <HexCapIDDisplay
        boardHex={boardHex}
        position={new Vector3(x, y + 0.2, z)}
      /> */}
      {isHeightRingedHex && <HeightRing position={new Vector3(x, y, z)} />}
      {isTopOutlinedInterlockHex && (
        <TopOutlineInterlockHex
          position={
            new Vector3(
              x,
              y *
                (isFluidTerrainHex(boardHex.terrain)
                  ? HEXGRID_HEXCAP_FLUID_SCALE
                  : 1),
              z,
            )
          }
          boardHex={boardHex}
        />
      )}
      {isSolidSubterrain && (
        <group position={[x, yBaseCap, z]} rotation={[0, pieceRotation, 0]}>
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isFluidSubterrain && (
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, pieceRotation, 0]}
          scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LandSubterrain boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isLaurSquarePillarHex && (
        <group
          position={[x, laurPillarHeight, z]}
          rotation={[0, pieceRotation, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LaurWallPillar
              boardHex={boardHex}
              onPointerUp={onPointerUpPaintPiece}
            />
          </Suspense>
        </group>
      )}
      {isLaurTrianglePillarHex && (
        <group
          position={[x, laurPillarHeight, z]}
          rotation={[0, pieceRotation, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <LaurWallTrianglePillar
              boardHex={boardHex}
              onPointerUp={onPointerUpPaintPiece}
            />
          </Suspense>
        </group>
      )}
      {isBrushHex && (
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <JungleBrush boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isPalmHex && (
        <group
          scale={[1, getOptionsForPalmHeight(boardHex.inventoryID).scaleY, 1]}
          position={[x, yBaseCap, z]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <TicallaPalm boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isGlacier3Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop3 isGlacier boardHex={boardHex} />
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
      )}
      {isLavaRockOutcrop3Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop3 isLavaRock boardHex={boardHex} />
            </Suspense>
          </group>
          <ObstacleBase
            x={x}
            y={yBase}
            z={z}
            color={hexTerrainColor[HexTerrain.lava]}
            isFluidBase={true}
          />
        </>
      )}
      {(isGlacier3BaseHex || isGlacier4BaseHex || isGlacier6BaseHex) && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.ice]}
          isFluidBase={true}
        />
      )}
      {isLavaRockOutcrop3BaseHex && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.lava]}
          isFluidBase={true}
        />
      )}
      {isOutcrop3Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop3 boardHex={boardHex} />
            </Suspense>
          </group>
          <ObstacleBase
            x={x}
            y={yBase}
            z={z}
            color={hexTerrainColor[HexTerrain.shadow]}
            isFluidBase={true}
          />
        </>
      )}
      {isOutcrop3BaseHex && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.shadow]}
          isFluidBase={true}
        />
      )}
      {isGlacier4Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop4 isGlacier={true} boardHex={boardHex} />
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
      )}
      {isGlacier6Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop6 isGlacier={true} boardHex={boardHex} />
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
      )}
      {isLadderHex && (
        <group
          position={[
            x + getLadderBattlementOptions(boardHex.pieceRotation).xAdd,
            y - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_HEIGHT / 2,
            z + getLadderBattlementOptions(boardHex.pieceRotation).zAdd,
          ]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Ladder boardHex={boardHex} onPointerUp={onPointerUpPaintPiece} />
          </Suspense>
        </group>
      )}

      {/* UNSORTED BELOW */}

      {isHiveHex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <MarroHive6 boardHex={boardHex} />
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
      )}
      {isHiveBaseHex && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.swampWater]}
          isFluidBase={true}
        />
      )}
      {isCastleBase && (
        <>
          <group position={[x, yBase, z]} rotation={[0, pieceRotation, 0]}>
            <Suspense fallback={<ModelLoader />}>
              <CastleBase
                boardHex={boardHex}
                onPointerUp={onPointerUpPaintPiece}
              />
            </Suspense>
          </group>
          <ObstacleBase
            x={x}
            y={yBaseCap}
            z={z}
            color={
              hoveredPieceID === boardHex.pieceID ||
              selectedPieceID === boardHex.pieceID
                ? hexTerrainColor[HexTerrain.castleBase]
                : 'yellow'
            }
          />
        </>
      )}
      {isCastleWall && (
        <>
          <group
            position={[x, yBase - 0.005, z]}
            rotation={[0, pieceRotation, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <CastleWall
                onPointerUp={onPointerUpPaintPiece}
                boardHex={boardHex}
              />
            </Suspense>
          </group>
          {boardHex.obstacleHeight === 9 && ( // when it's 8, castle is wall-on-wall and no base is shown
            <ObstacleBase
              x={x}
              y={yBaseCap}
              z={z}
              color={
                hoveredPieceID === boardHex.pieceID ||
                selectedPieceID === boardHex.pieceID
                  ? 'yellow'
                  : hexTerrainColor[HexTerrain.castleWall]
              }
            />
          )}
        </>
      )}
      {isCastleArch && (
        <group position={[x, yBase, z]} rotation={[0, pieceRotation, 0]}>
          <Suspense fallback={<ModelLoader />}>
            <CastleArch
              boardHex={boardHex}
              onPointerUp={onPointerUpPaintPiece}
            />
          </Suspense>
        </group>
      )}
    </>
  )
}
