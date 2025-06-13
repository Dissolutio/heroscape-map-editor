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
import BigTree415 from '../models/BigTree415'
import { CastleArch } from '../models/CastleArch'
import CastleBases from '../models/CastleBases'
import { CastleWall } from '../models/CastleWalls'
import ForestTree from '../models/ForestTree'
import { Ladder } from '../models/Ladder'
import LandSubterrain from '../models/LandSubterrain'
import LaurPillar from '../models/LaurPillar'
import MarroHive6 from '../models/MarroHive6'
import ModelLoader from '../models/ModelLoader'
import ObstacleBase from '../models/ObstacleBase'
import { Outcrop1 } from '../models/Outcrop1'
import Outcrop3 from '../models/Outcrop3'
import Outcrop4 from '../models/Outcrop4'
import Outcrop6 from '../models/Outcrop6'
import Ruins2 from '../models/Ruins2'
import Ruins3 from '../models/Ruins3'
import TicallaBrush from '../models/TicallaBrush'
import TicallaPalm from '../models/TicallaPalm'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForBigTree,
  getOptionsForPalmHeight,
  getOptionsForTreeHeight,
} from '../models/piece-adjustments'
import DeletePieceBillboard from './DeletePieceBillboard'
import HeightRing from './HeightRing'
import { MapHexIDDisplay } from './MapHexIDDisplay'
import { hexTerrainColor } from './hexColors'
import { GlyphModel } from '../models/Glyph'
import { StartZone3D } from '../models/StartZone3D'
import { MarvelRuin } from '../models/MarvelRuin'
import LaurWallTrianglePillar from '../models/LaurTrianglePillar'

export const MapHex3D = ({
  boardHex,
  onPointerUp,
}: {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) => {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const pieceID = boardPieces[boardHex.pieceID]
  const { x, y, z, yWithBase, yBase, yBaseCap, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords(boardHex)
  const underHexID = genBoardHexID({
    ...boardHex,
    altitude: boardHex.altitude - 1,
  })
  const underHexTerrain = boardHexes?.[underHexID]?.terrain ?? HexTerrain.grass
  const isUnderHexFluid = isFluidTerrainHex(underHexTerrain)
  const isShowEmptyHexes =
    !isTakingPicture && boardHex.terrain === HexTerrain.empty
  const isStartZoneHex = boardHex.terrain === HexTerrain.startZone
  const isHeightRingedHex =
    (isSolidTerrainHex(boardHex.terrain) && !boardHex.isCap) || isShowEmptyHexes
  const isObstacleHex =
    boardHex.isObstacleOrigin || boardHex.isObstacleAuxiliary
  const isSubterrainOrigin =
    isSolidTerrainHex(boardHex.terrain) && boardHex.isObstacleOrigin
  const isFluidOrigin =
    isFluidTerrainHex(boardHex.terrain) && boardHex.isObstacleOrigin
  // const isFluidHex = isFluidTerrainHex(boardHex.terrain)
  const isBigTreeHex =
    boardHex.pieceID.endsWith(Pieces.tree415) && boardHex.isObstacleOrigin
  const isBigTreeBaseHex =
    boardHex.pieceID.endsWith(Pieces.tree415) && boardHex.isObstacleAuxiliary
  const isTreeHex =
    !isBigTreeHex &&
    !isBigTreeBaseHex &&
    boardHex.terrain === HexTerrain.tree &&
    isObstacleHex
  const isLaurSquarePillarHex =
    boardHex.inventoryID === Pieces.laurWallPillar && boardHex.isObstacleOrigin
  const isLaurTrianglePillarHex =
    boardHex.inventoryID === Pieces.laurWallTrianglePillar &&
    boardHex.isObstacleOrigin
  const isBrushHex =
    boardHex.terrain === HexTerrain.brush && boardHex.isObstacleOrigin
  const isPalmHex =
    boardHex.terrain === HexTerrain.palm && boardHex.isObstacleOrigin
  const isLadderHex =
    boardHex.terrain === HexTerrain.ladder && boardHex.isObstacleOrigin
  const isGlacier1Hex = pieceID === Pieces.glacier1 && isObstacleHex
  const isPowerGlyphHex = pieceID === Pieces.glyphPower
  const isTreasureGlyphHex = pieceID === Pieces.glyphTreasure
  const isOutcrop1Hex = pieceID === Pieces.outcrop1 && isObstacleHex
  const isOutcrop3Hex = pieceID === Pieces.outcrop3 && boardHex.isObstacleOrigin
  const isOutcrop3BaseHex =
    pieceID === Pieces.outcrop3 && boardHex.isObstacleAuxiliary
  const isLavaRockOutcrop1Hex =
    pieceID === Pieces.lavaRockOutcrop1 && isObstacleHex
  const isLavaRockOutcrop3Hex =
    pieceID === Pieces.lavaRockOutcrop3 && boardHex.isObstacleOrigin
  const isLavaRockOutcrop3BaseHex =
    pieceID === Pieces.lavaRockOutcrop3 && boardHex.isObstacleAuxiliary
  const isGlacier3Hex = pieceID === Pieces.glacier3 && boardHex.isObstacleOrigin
  const isGlacier3BaseHex =
    pieceID === Pieces.glacier3 && boardHex.isObstacleAuxiliary
  const isGlacier4Hex = pieceID === Pieces.glacier4 && boardHex.isObstacleOrigin
  const isGlacier4BaseHex =
    pieceID === Pieces.glacier4 && boardHex.isObstacleAuxiliary
  const isGlacier6Hex = pieceID === Pieces.glacier6 && boardHex.isObstacleOrigin
  const isGlacier6BaseHex =
    pieceID === Pieces.glacier6 && boardHex.isObstacleAuxiliary
  const isHiveHex =
    boardPieces[boardHex.pieceID] === Pieces.hive && boardHex.isObstacleOrigin
  const isHiveBaseHex =
    boardPieces[boardHex.pieceID] === Pieces.hive &&
    boardHex.isObstacleAuxiliary
  const isRuin2OriginHex =
    pieceID === Pieces.ruins2 && boardHex.isObstacleOrigin
  const isRuin3OriginHex =
    pieceID === Pieces.ruins3 && boardHex.isObstacleOrigin
  const isMarvelRuinOriginHex =
    (pieceID === Pieces.marvel || pieceID === Pieces.marvelBroken ||
      pieceID === Pieces.marvelNoUpper || pieceID === Pieces.marvelNoUpperBroken
    ) &&
    boardHex.isObstacleOrigin
  const isCastleBaseEnd = pieceID === Pieces.castleBaseEnd
  const isCastleBaseStraight = pieceID === Pieces.castleBaseStraight
  const isCastleBaseCorner = pieceID === Pieces.castleBaseCorner
  const isCastleWallEnd =
    pieceID === Pieces.castleWallEnd && boardHex.isObstacleOrigin
  const isCastleWallStraight =
    pieceID === Pieces.castleWallStraight && boardHex.isObstacleOrigin
  const isCastleWallCorner =
    pieceID === Pieces.castleWallCorner && boardHex.isObstacleOrigin
  const isCastleWall =
    isCastleWallEnd || isCastleWallStraight || isCastleWallCorner
  const isCastleBase =
    isCastleBaseEnd || isCastleBaseStraight || isCastleBaseCorner
  const isCastleArch =
    pieceID === Pieces.castleArch || pieceID === Pieces.castleArchNoDoor

  return (
    <>
      <MapHexIDDisplay
        boardHex={boardHex}
        position={new Vector3(x, y + 0.2, z)}
      />
      <group visible={isVisible}>
        {isSubterrainOrigin && (
          <group
            position={[x, y - HEXGRID_HEX_HEIGHT, z]}
            rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
          >
            {selectedPieceID === boardHex.pieceID && (
              <DeletePieceBillboard pieceID={boardHex.pieceID} />
            )}
            <Suspense fallback={<ModelLoader />}>
              <LandSubterrain pid={boardHex.pieceID} />
            </Suspense>
          </group>
        )}
        {isFluidOrigin && (
          <group position={[x, y - HEXGRID_HEX_HEIGHT, z]}>
            {selectedPieceID === boardHex.pieceID && (
              <DeletePieceBillboard pieceID={boardHex.pieceID} />
            )}
            <Suspense fallback={<ModelLoader />}>
              <group
                rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
                scale={[1, HEXGRID_HEXCAP_FLUID_SCALE, 1]}
              >
                <LandSubterrain pid={boardHex.pieceID} />
              </group>
            </Suspense>
          </group>
        )}
        {isStartZoneHex && (
          <group
            position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
            rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, Math.PI / 2]}
          >
            {selectedPieceID === boardHex.pieceID && (
              <DeletePieceBillboard pieceID={boardHex.pieceID} />
            )}
            <StartZone3D boardHex={boardHex} onPointerUp={onPointerUp} />
          </group>
        )}
        {isRuin2OriginHex && (
          <Suspense fallback={<ModelLoader />}>
            <Ruins2 boardHex={boardHex} />
          </Suspense>
        )}
        {isRuin3OriginHex && (
          <Suspense fallback={<ModelLoader />}>
            <Ruins3 boardHex={boardHex} />
          </Suspense>
        )}
        {isMarvelRuinOriginHex && (
          <Suspense fallback={<ModelLoader />}>
            <MarvelRuin boardHex={boardHex} />
          </Suspense>
        )}
        {isHeightRingedHex && (
          <Suspense fallback={<ModelLoader />}>
            <HeightRing position={new Vector3(x, y, z)} />
          </Suspense>
        )}
        {isLaurSquarePillarHex && (
          <LaurPillar boardHex={boardHex}
            isUnderHexFluid={isUnderHexFluid}
            onPointerUp={onPointerUp}
          />
        )}
        {isLaurTrianglePillarHex && (
          <LaurWallTrianglePillar
            boardHex={boardHex}
            isUnderHexFluid={isUnderHexFluid}
            onPointerUp={onPointerUp}
          />
        )}
        {isTreeHex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                scale={[
                  getOptionsForTreeHeight(boardHex.pieceID).scaleX,
                  getOptionsForTreeHeight(boardHex.pieceID).scaleY,
                  getOptionsForTreeHeight(boardHex.pieceID).scaleX,
                ]}
                position={[
                  x,
                  yWithBase + getOptionsForTreeHeight(boardHex.pieceID).y,
                  z,
                ]}
                rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
              >
                <ForestTree boardHex={boardHex} />
              </group>
            </Suspense>
            <ObstacleBase
              x={x}
              y={yBase}
              z={z}
              color={hexTerrainColor.treeBase}
            />
          </>
        )}
        {isBigTreeHex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[
                  x + getOptionsForBigTree(boardHex.pieceRotation).xAdd,
                  yWithBase,
                  z + getOptionsForBigTree(boardHex.pieceRotation).zAdd,
                ]}
                scale={0.038}
                rotation={[
                  0,
                  getOptionsForBigTree(boardHex.pieceRotation).rotationY,
                  0,
                ]}
              >
                <BigTree415 boardHex={boardHex} />
              </group>
            </Suspense>
            <ObstacleBase
              x={x}
              y={yBase}
              z={z}
              color={hexTerrainColor.treeBase}
            />
          </>
        )}
        {isBigTreeBaseHex && (
          <ObstacleBase
            x={x}
            y={yBase}
            z={z}
            color={hexTerrainColor.treeBase}
          />
        )}
        {isLadderHex && (
          <Suspense fallback={<ModelLoader />}>
            <group
              position={[
                x + getLadderBattlementOptions(boardHex.pieceRotation).xAdd,
                y - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_HEIGHT / 2,
                z + getLadderBattlementOptions(boardHex.pieceRotation).zAdd,
              ]}
              rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
            >
              {selectedPieceID === boardHex.pieceID && (
                <DeletePieceBillboard pieceID={boardHex.pieceID} />
              )}
              <Ladder boardHex={boardHex} onPointerUp={onPointerUp} />
            </group>
          </Suspense>
        )}
        {isBrushHex && (
          <Suspense fallback={<ModelLoader />}>
            <group
              position={[x, yBaseCap, z]}
              rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
            >
              <TicallaBrush boardHex={boardHex} />
            </group>
          </Suspense>
        )}
        {isPalmHex && (
          <Suspense fallback={<ModelLoader />}>
            <group
              scale={[1, getOptionsForPalmHeight(boardHex.pieceID).scaleY, 1]}
              position={[x, yBaseCap, z]}
              rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
            >
              <TicallaPalm boardHex={boardHex} />
            </group>
          </Suspense>
        )}
        {/* POWER GLYPHS */}
        {isPowerGlyphHex && (
          <Suspense fallback={<ModelLoader />}>
            <group
              position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
              rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
            >
              <GlyphModel boardHex={boardHex} />
            </group>
          </Suspense>
        )}
        {/* TREASURE GLYPHS */}
        {isTreasureGlyphHex && (
          <Suspense fallback={<ModelLoader />}>
            <group
              position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
              rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
            >
              <GlyphModel boardHex={boardHex} />
            </group>
          </Suspense>
        )}
        {isGlacier1Hex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
              >
                <Outcrop1 isGlacier={true} boardHex={boardHex} />
              </group>
            </Suspense>
            <ObstacleBase
              x={x}
              y={yBase}
              z={z}
              color={hexTerrainColor[HexTerrain.ice]}
              isFluidBase={true}
            />
          </>
        )}
        {isOutcrop1Hex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
              >
                <Outcrop1 isGlacier={false} boardHex={boardHex} />
              </group>
            </Suspense>
            <ObstacleBase
              x={x}
              y={yBase}
              z={z}
              color={hexTerrainColor[HexTerrain.shadow]}
              isFluidBase={true}
            />
          </>
        )}
        {isLavaRockOutcrop1Hex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
              >
                <Outcrop1 isLavaRock={true} boardHex={boardHex} />
              </group>
            </Suspense>
            <ObstacleBase
              x={x}
              y={yBase}
              z={z}
              color={hexTerrainColor[HexTerrain.lava]}
              isFluidBase={true}
            />
          </>
        )}
        {isGlacier3Hex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
              >
                <Outcrop3 isGlacier={true} boardHex={boardHex} />
              </group>
            </Suspense>
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
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
              >
                <Outcrop3 isLavaRock={true} boardHex={boardHex} />
              </group>
            </Suspense>
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
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
              >
                <Outcrop3 isGlacier={false} boardHex={boardHex} />
              </group>
            </Suspense>
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
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
              >
                <Outcrop4 isGlacier={true} boardHex={boardHex} />
              </group>
            </Suspense>
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
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
              >
                <Outcrop6 isGlacier={true} boardHex={boardHex} />
              </group>
            </Suspense>
            <ObstacleBase
              x={x}
              y={yBase}
              z={z}
              color={hexTerrainColor[HexTerrain.ice]}
              isFluidBase={true}
            />
          </>
        )}
        {isHiveHex && (
          <>
            <Suspense fallback={<ModelLoader />}>
              <group
                position={[x, yWithBase, z]}
                rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
              >
                <MarroHive6 boardHex={boardHex} />
              </group>
            </Suspense>
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
          <Suspense fallback={<ModelLoader />}>
            <CastleBases boardHex={boardHex} onPointerUp={onPointerUp} />
          </Suspense>
        )}
        {isCastleWall && (
          <Suspense fallback={<ModelLoader />}>
            <CastleWall onPointerUp={onPointerUp} boardHex={boardHex} />
          </Suspense>
        )}
        {isCastleArch && (
          <Suspense fallback={<ModelLoader />}>
            <CastleArch
              boardHex={boardHex}
              onPointerUp={onPointerUp}
              underHexTerrain={underHexTerrain}
            />
          </Suspense>
        )}
      </group>
    </>
  )
}
