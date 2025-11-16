import type { ThreeEvent } from '@react-three/fiber'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
} from '../../utils/constants'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import { CastleArch } from '../models/CastleArch'
import CastleBase from '../models/CastleBases'
import { CastleWall } from '../models/CastleWalls'
import LandSubterrain from '../models/LandSubterrain'
import ModelLoader from '../models/ModelLoader'
import ObstacleBase from '../models/ObstacleBase'
import HeightRing, { TopOutlineInterlockHex } from './HeightRing'
import { MapHexIDDisplay } from './MapHexIDDisplay'
import { hexTerrainColor } from './hexColors'

export const MapHex3D = ({
  boardHex,
  onPointerUpPaintPiece,
}: {
  boardHex: BoardHex
  onPointerUpPaintPiece: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) => {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isTopOutlinedInterlockHexes = useBoundStore(
    (s) => s.isTopOutlinedInterlockHexes,
  )
  const { inventoryID, altitude, terrain, isObstacleOrigin, isObstacleAuxiliary, isCap, pieceID, obstacleHeight } = boardHex
  const pieceRotation = (boardHex.pieceRotation * -Math.PI) / 3
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = altitude <= viewingLevel
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const { x, y, z, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)
  const isShowEmptyHexes =
    !isTakingPicture && terrain === HexTerrain.empty
  const isHeightRingedHex =
    (isSolidTerrainHex(terrain) && !isCap) || isShowEmptyHexes
  const isTopOutlinedInterlockHex =
    isTopOutlinedInterlockHexes && !isTakingPicture
  const isSolidSubterrain =
    isSolidTerrainHex(terrain) && isObstacleOrigin
  const isFluidSubterrain =
    isFluidTerrainHex(terrain) && isObstacleOrigin
  const isOutcropBaseHex =
    terrain === HexTerrain.outcrop && (isObstacleOrigin || isObstacleAuxiliary)
  const isLavaOutcropBaseHex =
    terrain === HexTerrain.lavaRockOutcrop && (isObstacleOrigin || isObstacleAuxiliary)
  const isGlacierBaseHex =
    terrain === HexTerrain.glacier && (isObstacleOrigin || isObstacleAuxiliary)
  const isHiveBaseHex =
    inventoryID === Pieces.hive && (isObstacleOrigin || isObstacleAuxiliary)
  const isCastleBaseEnd = inventoryID === Pieces.castleBaseEnd
  const isCastleBaseStraight = inventoryID === Pieces.castleBaseStraight
  const isCastleBaseCorner = inventoryID === Pieces.castleBaseCorner
  const isCastleWallEnd =
    inventoryID === Pieces.castleWallEnd && isObstacleOrigin
  const isCastleWallStraight =
    inventoryID === Pieces.castleWallStraight && isObstacleOrigin
  const isCastleWallCorner =
    inventoryID === Pieces.castleWallCorner && isObstacleOrigin
  const isCastleWall =
    isCastleWallEnd || isCastleWallStraight || isCastleWallCorner
  const isCastleBase = boardHex.terrain === HexTerrain.castleBase
  const isCastleArch =
    inventoryID === Pieces.castleArch || inventoryID === Pieces.castleArchNoDoor



  if (!isVisible) {
    return null
  }
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
              (isFluidTerrainHex(terrain)
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
      {isGlacierBaseHex && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.ice]}
          isFluidBase={true}
        />
      )}
      {isLavaOutcropBaseHex && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.lava]}
          isFluidBase={true}
        />
      )}
      {(isOutcropBaseHex) && (
        <ObstacleBase
          x={x}
          y={yBase}
          z={z}
          color={hexTerrainColor[HexTerrain.shadow]}
          isFluidBase={true}
        />
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

      {/* UNSORTED BELOW */}

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
          {obstacleHeight === 9 && ( // when it's 8, castle is wall-on-wall and no base is shown
            <ObstacleBase
              x={x}
              y={yBaseCap}
              z={z}
              color={
                hoveredPieceID === pieceID ||
                  selectedPieceID === pieceID
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
