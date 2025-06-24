import type { ThreeEvent } from '@react-three/fiber'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_GLYPH_HEIGHT,
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
  getRuinsOptions,
} from '../models/piece-adjustments'
import HeightRing from './HeightRing'
import { MapHexIDDisplay } from './MapHexIDDisplay'
import { hexTerrainColor } from './hexColors'
import { GlyphModel } from '../models/Glyph'
import { StartZone3D } from '../models/StartZone3D'
import { MarvelRuin } from '../models/MarvelRuin'
import LaurWallTrianglePillar from '../models/LaurTrianglePillar'

export const MapHex3D = ({
  boardHex,
  onPointerUpPaintPiece,
}: {
  boardHex: BoardHex
  onPointerUpPaintPiece: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) => {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
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
  const isSolidSubterrain =
    isSolidTerrainHex(boardHex.terrain) && boardHex.isObstacleOrigin
  const isFluidSubterrain =
    isFluidTerrainHex(boardHex.terrain) && boardHex.isObstacleOrigin
  const isBigTreeHex =
    boardHex.inventoryID === Pieces.tree415 && boardHex.isObstacleOrigin
  const isBigTreeBaseHex =
    boardHex.inventoryID === Pieces.tree415 && boardHex.isObstacleAuxiliary
  const isTreeHex =
    !isBigTreeHex &&
    !isBigTreeBaseHex &&
    boardHex.terrain === HexTerrain.tree &&
    isObstacleHex
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
    (pieceID === Pieces.marvel ||
      pieceID === Pieces.marvelBroken ||
      pieceID === Pieces.marvelNoUpper ||
      pieceID === Pieces.marvelNoUpperBroken) &&
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

  const ruinsOptions = getRuinsOptions(boardHex.pieceRotation)
  const pieceRotation = (boardHex.pieceRotation * -Math.PI) / 3

  if (!isVisible) {
    return null
  }
  return (
    <>
      <MapHexIDDisplay
        boardHex={boardHex}
        position={new Vector3(x, y + 0.2, z)}
      />
      {/* GROUP 2: no preview */}
      {isHeightRingedHex && <HeightRing position={new Vector3(x, y, z)} />}
      {/* GROUP 1: pos, rot, scale */}
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
      {isStartZoneHex && (
        <group
          position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, Math.PI / 2]}
        >
          <StartZone3D boardHex={boardHex} />
        </group>
      )}
      {isRuin2OriginHex && (
        <group
          position={[x + ruinsOptions.xAdd, yBaseCap, z + ruinsOptions.zAdd]}
          rotation={[0, ruinsOptions.rotationY, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Ruins2 boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isRuin3OriginHex && (
        <group
          position={[x + ruinsOptions.xAdd, yBaseCap, z + ruinsOptions.zAdd]}
          rotation={[0, ruinsOptions.rotationY, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Ruins3 boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isMarvelRuinOriginHex && (
        <group position={[x, yBaseCap, z]} rotation={[0, pieceRotation, 0]}>
          <Suspense fallback={<ModelLoader />}>
            <MarvelRuin boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isTreeHex && (
        <>
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
            rotation={[0, pieceRotation, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <ForestTree boardHex={boardHex} />
            </Suspense>
          </group>
          <ObstacleBase
            x={x}
            y={yBase}
            z={z}
            color={hexTerrainColor.treeBase}
          />
        </>
      )}
      {/* GROUP GETS onPointerUpPaintPiece */}
      {isLaurSquarePillarHex && (
        <>
          <group
            position={[
              x,
              (isUnderHexFluid
                ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT
                : yGlyph + HEXGRID_GLYPH_HEIGHT - HEXGRID_HEXCAP_HEIGHT) +
                HEXGRID_HEXCAP_FLUID_HEIGHT / 2,
              z,
            ]}
            rotation={[0, pieceRotation, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <LaurPillar
                boardHex={boardHex}
                onPointerUp={onPointerUpPaintPiece}
              />
            </Suspense>
          </group>
          <ObstacleBase
            x={x}
            y={yBase}
            z={z}
            color={hexTerrainColor[HexTerrain.laurWall]}
          />
        </>
      )}
      {isLaurTrianglePillarHex && (
        <>
          <group
            position={[
              x,
              (isUnderHexFluid
                ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT
                : yGlyph + HEXGRID_GLYPH_HEIGHT - HEXGRID_HEXCAP_HEIGHT) +
                HEXGRID_HEXCAP_FLUID_HEIGHT / 2,
              z,
            ]}
            rotation={[0, pieceRotation, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <LaurWallTrianglePillar
                boardHex={boardHex}
                onPointerUp={onPointerUpPaintPiece}
              />
            </Suspense>
          </group>
          <ObstacleBase
            x={x}
            y={yBase}
            z={z}
            color={hexTerrainColor[HexTerrain.laurWall]}
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
        <ObstacleBase x={x} y={yBase} z={z} color={hexTerrainColor.treeBase} />
      )}
      {isBrushHex && (
        <group
          position={[x, yBaseCap, z]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <TicallaBrush boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {isPalmHex && (
        <group
          scale={[1, getOptionsForPalmHeight(boardHex.pieceID).scaleY, 1]}
          position={[x, yBaseCap, z]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <TicallaPalm boardHex={boardHex} />
          </Suspense>
        </group>
      )}
      {/* POWER GLYPHS */}
      {(isPowerGlyphHex || isTreasureGlyphHex) && (
        <group
          position={[x, isUnderHexFluid ? yGlyphFluidUnder : yGlyph, z]}
          rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <GlyphModel boardHex={boardHex} terrain={boardHex.terrain} />
          </Suspense>
        </group>
      )}
      {/* TREASURE GLYPHS */}
      {isGlacier1Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop1 isGlacier={true} boardHex={boardHex} />
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
      {isOutcrop1Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop1 isGlacier={false} boardHex={boardHex} />
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
      {isLavaRockOutcrop1Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop1 isLavaRock={true} boardHex={boardHex} />
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
      {isGlacier3Hex && (
        <>
          <group
            position={[x, yWithBase, z]}
            rotation={[0, getObstaclRotation(boardHex.pieceRotation), 0]}
          >
            <Suspense fallback={<ModelLoader />}>
              <Outcrop3 isGlacier={true} boardHex={boardHex} />
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
              <Outcrop3 isLavaRock={true} boardHex={boardHex} />
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
              <Outcrop3 isGlacier={false} boardHex={boardHex} />
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
              <CastleBases
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
                ? hexTerrainColor[HexTerrain.castle]
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
                  : hexTerrainColor[HexTerrain.castle]
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
