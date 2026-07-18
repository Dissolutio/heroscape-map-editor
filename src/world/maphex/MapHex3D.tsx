import type { ThreeEvent } from '@react-three/fiber'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEX_HEIGHT,
} from '../../utils/constants'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import { ONION_SKIN_MAX_DISTANCE } from '../../utils/onion-skin'
import { CastleArch } from '../models/CastleArch'
import CastleBase from '../models/CastleBases'
import { CastleWall } from '../models/CastleWalls'
import ModelLoader from '../models/ModelLoader'
import ObstacleBase from '../models/ObstacleBase'
import HeightRing, { TopOutlineInterlockHex } from './HeightRing'
import { HexCapHeightTextDisplay } from './HexCapHeightTextDisplay'
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
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isOnionSkinMode = useBoundStore((s) => s.isOnionSkinMode)
  const distanceFromView = Math.abs(boardHex.altitude - viewingLevel)
  const isVisible =
    boardHex.isVerticalClearanceHex ||
    (isOnionSkinMode
      ? distanceFromView <= ONION_SKIN_MAX_DISTANCE
      : boardHex.altitude <= viewingLevel)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const { x, y, z, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)

  const isShowEmptyHexes =
    !isTakingPicture && boardHex.terrain === HexTerrain.empty
  const isHeightRingedHex =
    (isSolidTerrainHex(boardHex.terrain) && !boardHex.isCap) || isShowEmptyHexes
  const isTopOutlinedInterlockHex =
    isTopOutlinedInterlockHexes && !isTakingPicture

  const inventoryID = boardHex.inventoryID
  const pieceRotation = (boardHex.pieceRotation * -Math.PI) / 3

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

  if (!isVisible) {
    return null
  }

  return (
    <>
      <HexCapHeightTextDisplay
        boardHex={boardHex}
        position={new Vector3(x, y + 0.2, z)}
      />
      {isHeightRingedHex && <HeightRing position={new Vector3(x, y, z)} />}
      {isTopOutlinedInterlockHex && (
        <TopOutlineInterlockHex
          position={
            new Vector3(
              x,
              y -
              HEXGRID_HEX_HEIGHT +
              (isFluidTerrainHex(boardHex.terrain)
                ? HEXGRID_HEXCAP_FLUID_HEIGHT
                : HEXGRID_HEX_HEIGHT),
              z,
            )
          }
          boardHex={boardHex}
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
              hoveredPieceID === boardHex?.boardPieceUID ||
                selectedPieceIDs.includes(boardHex?.boardPieceUID ?? '')
                ? 'yellow'
                : hexTerrainColor[HexTerrain.castleBase]
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
          {boardHex.obstacleHeight === 9 && (
            <ObstacleBase
              x={x}
              y={yBaseCap}
              z={z}
              color={
                hoveredPieceID === boardHex?.boardPieceUID ||
                  selectedPieceIDs.includes(boardHex?.boardPieceUID ?? '')
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
