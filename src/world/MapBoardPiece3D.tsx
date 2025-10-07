import { Vector3 } from 'three'
import useBoundStore from '../store/store'
import { type BoardPiece, HexTerrain, Pieces } from '../types'
import { isRenderedFromPieceIDPiece } from '../utils/board-utils'
import {
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEXCAP_HEIGHT,
} from '../utils/constants'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { Battlement } from './models/Battlement'
import { LaurWallAddon } from './models/LaurAddon'
import { RoadWall } from './models/RoadWall'
import {
  getLadderBattlementOptions,
  getRoadWallOptions,
  getRuinsOptions,
} from './models/piece-adjustments'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from './maphex/hexColors'
import { Suspense } from 'react'
import ModelLoader from './models/ModelLoader'
import Ruins2 from './models/Ruins2'
import Ruins3 from './models/Ruins3'
import { MarvelRuin } from './models/MarvelRuin'
import { StartZone3D } from './models/StartZone3D'
import { GlyphModel } from './models/Glyph'
import { hexTerrainColor } from './maphex/hexColors'
import { Outcrop1 } from './models/Outcrop1'
import ObstacleBase from './models/ObstacleBase'

export const MapBoardPiece3D = ({
  boardPiece,
}: {
  boardPiece: BoardPiece
}) => {
  const { inventoryID, altitude, rotation, pieceCoords } = boardPiece
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const onPointerUp = (event: ThreeEvent<PointerEvent>, boardPiece: BoardPiece) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(boardPiece.uid === selectedPieceID ? '' : boardPiece.uid)
  }
  const { x, z, y, yBaseCap, yGlyphFluidUnder, yGlyph, yWithBase, yBase } =
    getBoardHex3DCoords({ ...pieceCoords, altitude })
  const {
    x: xLaurWall,
    z: zLaurWall,
    yWithBase: yLaurWall,
  } = getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = altitude + 1 <= viewingLevel
  // const isSolidLand = isSolidTerrainHex(piecesSoFar[inventoryID].terrain)

  // TODO: PIECE ID TO RENDER MUST BE ADDED TO THIS FN: isRenderedFromPieceIDPiece
  // [Make it not so]
  // EARLY RETURN, no render
  if (!isVisible) {
    return null
  }

  // SOLID LAND
  // if (isSolidLand) {
  //   return (
  //     <group position={[x, yBaseCap, z]} rotation={[0, rotation, 0]}>
  //       <Suspense fallback={<ModelLoader />}>
  //         <LandSubterrain boardHex={boardHex} />
  //       </Suspense>
  //     </group>
  //   )
  // }

  // RUINS 2/3
  const ruinsOptions = getRuinsOptions(rotation)
  if (inventoryID === Pieces.ruins2 || inventoryID === Pieces.ruins3) {
    return (
      <group
        position={[
          x + ruinsOptions.xAdd,
          yBaseCap + HEXGRID_HEX_HEIGHT,
          z + ruinsOptions.zAdd,
        ]}
        rotation={[0, ruinsOptions.rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          {inventoryID === Pieces.ruins2 ? (
            <Ruins2 pid={pid} />
          ) : (
            <Ruins3 pid={pid} />
          )}
        </Suspense>
      </group>
    )
  }
  // MARVEL RUINS
  if (
    inventoryID === Pieces.marvel ||
    inventoryID === Pieces.marvelBroken ||
    inventoryID === Pieces.marvelNoUpper ||
    inventoryID === Pieces.marvelNoUpperBroken
  ) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, rotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <MarvelRuin pid={pid} />
        </Suspense>
      </group>
    )
  }

  // START ZONES
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
        position={[
          x,
          isUnderHexFluid
            ? yGlyphFluidUnder + HEXGRID_HEX_HEIGHT
            : yGlyph + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, Math.PI / 2]}
      >
        <StartZone3D pid={pid} />
      </group>
    )
  }

  //  GLYPHS
  if (
    inventoryID === Pieces.glyphPower ||
    inventoryID === Pieces.glyphTreasure
  ) {
    return (
      <group
        position={[
          x,
          (isUnderHexFluid ? yGlyphFluidUnder : yGlyph) + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <GlyphModel pid={pid} />
      </group>
    )
  }
  // GLACIER1 / OUTCROP1 / LAVAOUTCROP1
  if (
    inventoryID === Pieces.glacier1 ||
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1
  ) {
    const outcrop1Color =
      inventoryID === Pieces.glacier1
        ? hexTerrainColor[HexTerrain.ice]
        : inventoryID === Pieces.outcrop1
          ? hexTerrainColor[HexTerrain.shadow]
          : hexTerrainColor[HexTerrain.lava]
    return (
      <>
        <group
          position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
          rotation={[0, (rotation * -Math.PI) / 3, 0]}
        >
          <Suspense fallback={<ModelLoader />}>
            <Outcrop1
              pid={pid}
              isGlacier={inventoryID === Pieces.glacier1}
              isLavaRock={inventoryID === Pieces.lavaRockOutcrop1}
            />
          </Suspense>
        </group>
        <ObstacleBase
          x={x}
          y={yBase + HEXGRID_HEX_HEIGHT}
          z={z}
          color={outcrop1Color}
          isFluidBase={true}
        />
      </>
    )
  }

  // LAURWALL ADDON
  if (
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallRuin1 ||
    inventoryID === Pieces.laurWallArch ||
    inventoryID === Pieces.laurWallLong
  ) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <LaurWallAddon
          onPointerUp={onPointerUp}
          boardPiece={boardPiece}
          color={hexTerrainColor[HexTerrain.laurWall]}
          secondaryColor={hexTerrainColor.laurModelColor2}
          opacity={1}
          selectedPieceID={selectedPieceID}
          hoveredPieceID={hoveredPieceID}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
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
        <Battlement
          boardPiece={boardPiece}
          color={hexTerrainColor[HexTerrain.battlement]}
          onPointerUp={onPointerUp}
          opacity={1}
          selectedPieceID={selectedPieceID}
          hoveredPieceID={hoveredPieceID}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
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
        <RoadWall
          boardPiece={boardPiece}
          color={hexTerrainColor[HexTerrain.roadWall]}
          opacity={1}
          onPointerUp={onPointerUp}
          selectedPieceID={selectedPieceID}
          hoveredPieceID={hoveredPieceID}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
      </group>
    )
  }
  return <></>
}
