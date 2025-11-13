import { Vector3 } from 'three'
import useBoundStore from '../store/store'
import { type BoardPiece, HexTerrain, Pieces } from '../types'
import { isSingleHexTreePieceID, isSolidTerrainHex } from '../utils/board-utils'
import { HEXGRID_HEX_HEIGHT, HEXGRID_HEXCAP_HEIGHT } from '../utils/constants'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { Battlement } from './models/Battlement'
import { LaurWallAddon } from './models/LaurAddon'
import { RoadWall } from './models/RoadWall'
import ModelWrapper from './models/ModelWrapper'
import { lookupModelComponent } from './model-registry'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForPalmHeight,
  getOptionsForTreeHeight,
  getRoadWallOptions,
  getRuinsOptions,
} from './models/piece-adjustments'
import type { ThreeEvent } from '@react-three/fiber'
import React, { Suspense } from 'react'
import ModelLoader from './models/ModelLoader'
import { Ruins2 } from './models/Ruins2'
import { Ruins3 } from './models/Ruins3'
import { MarvelRuin } from './models/MarvelRuin'
import { GlyphModel } from './models/Glyph'
import { hexTerrainColor } from './maphex/hexColors'
import { Outcrop1 } from './models/Outcrop1'
import ObstacleBase from './models/ObstacleBase'
import { ForestTree } from './models/ForestTree'
import { BigTree415 } from './models/BigTree415'
import { piecesSoFar } from '../data/pieces'
import { JungleBrush } from './models/TicallaBrush'
import TicallaPalm from './models/TicallaPalm'
import { LaurWallPillar } from './models/LaurPillar'
import usePieceHoverState from '../hooks/usePieceHoverState'
import { LaurWallTrianglePillar } from './models/LaurTrianglePillar'

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
  const isVisible = altitude + 1 <= viewingLevel
  // const { x, z, y, yBaseCap, yGlyphFluidUnder, yGlyph, yWithBase, yBase } =
  //   getBoardHex3DCoords({ ...pieceCoords, altitude })
  const { x, z, y, yBaseCap, yGlyph, yWithBase, yBase } = getBoardHex3DCoords({
    ...pieceCoords,
    altitude,
  })
  const {
    x: xLaurWall,
    z: zLaurWall,
    yWithBase: yLaurWall,
  } = getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })

  const onPointerUp = (event: ThreeEvent<PointerEvent>, uid: string) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(uid === selectedPieceID ? '' : uid)
  }
  const { onPointerEnterBoardPiece, onPointerOut } = usePieceHoverState()
  const highlightColor = 'yellow'
  const isSelected = (uid: string) => selectedPieceID === uid
  const isHighlighted = (uid: string) =>
    hoveredPieceID === uid || isSelected(uid)
  const pieceRotation = (boardPiece.rotation * -Math.PI) / 3
  // const isSolidLand = isSolidTerrainHex(piecesSoFar[inventoryID].terrain)

  // EARLY RETURN, no render
  if (!isVisible) {
    return null
  }
  const interactivityProps = {
    highlightColor,
    boardPiece,
    onPointerUp,
    onPointerEnter: onPointerEnterBoardPiece,
    onPointerOut,
    opacity: 1,
    isHighlighted,
    isLightsAndShadowsRender,
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
            <Ruins2
              color={hexTerrainColor[HexTerrain.ruin]}
              {...interactivityProps}
            />
          ) : (
            <Ruins3
              color={hexTerrainColor[HexTerrain.ruin]}
              {...interactivityProps}
            />
          )}
        </Suspense>
      </group>
    )
  }
  // // MARVEL RUINS
  // if (
  //   inventoryID === Pieces.marvel ||
  //   inventoryID === Pieces.marvelBroken ||
  //   inventoryID === Pieces.marvelNoUpper ||
  //   inventoryID === Pieces.marvelNoUpperBroken
  // ) {
  //   return (
  //     <group
  //       position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
  //       rotation={[0, rotation, 0]}
  //     >
  //       <Suspense fallback={<ModelLoader />}>
  //         <MarvelRuin pid={pid} />
  //       </Suspense>
  //     </group>
  //   )
  // }

  // LAUR PILLAR
  if (
    inventoryID === Pieces.laurWallSquarePillar ||
    inventoryID === Pieces.laurWallPillarStackable
  ) {
    const Comp = lookupModelComponent(inventoryID) ?? (React.Fragment)
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={hexTerrainColor[HexTerrain.laurWall]}
              secondaryColor={hexTerrainColor.laurModelColor2}
            />
          </ModelWrapper>
        </Suspense>
      </group>
    )
  }

  // LAUR TRIANGLE PILLAR
  if (inventoryID === Pieces.laurWallTrianglePillar) {
    const Comp = lookupModelComponent(inventoryID) ?? (React.Fragment)
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={hexTerrainColor[HexTerrain.laurWall]}
              secondaryColor={hexTerrainColor.laurModelColor2}
            />
          </ModelWrapper>
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
    const Comp = lookupModelComponent('startZone') ?? (React.Fragment)
    return (
      <group
        position={[
          x,
          // isUnderHexFluid
          //   ? yGlyphFluidUnder + HEXGRID_HEX_HEIGHT
          //   : yGlyph + HEXGRID_HEX_HEIGHT,
          yGlyph + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={hexTerrainColor[inventoryID as keyof typeof hexTerrainColor]}
            />
          </ModelWrapper>
        </Suspense>
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
          // (isUnderHexFluid ? yGlyphFluidUnder : yGlyph) + HEXGRID_HEX_HEIGHT,
          yGlyph + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <GlyphModel boardPiece={boardPiece} />
      </group>
    )
  }

  // OUTCROPS
  const outcropBaseColor =
    inventoryID === Pieces.glacier1 ||
      inventoryID === Pieces.glacier3 ||
      inventoryID === Pieces.glacier4 ||
      inventoryID === Pieces.glacier6
      ? hexTerrainColor[HexTerrain.ice]
      : inventoryID === Pieces.lavaRockOutcrop1 || inventoryID === Pieces.lavaRockOutcrop3
        ? hexTerrainColor[HexTerrain.lava]
        : hexTerrainColor[HexTerrain.shadow]
  const outcropColor =
    inventoryID === Pieces.glacier1 ||
      inventoryID === Pieces.glacier3 ||
      inventoryID === Pieces.glacier4 ||
      inventoryID === Pieces.glacier6
      ? hexTerrainColor[HexTerrain.ice]
      : inventoryID === Pieces.lavaRockOutcrop1 || inventoryID === Pieces.lavaRockOutcrop3
        ? hexTerrainColor[HexTerrain.lava]
        : hexTerrainColor[HexTerrain.outcrop]
  // GLACIER1 / OUTCROP1 / LAVAOUTCROP1
  if (
    inventoryID === Pieces.glacier1 ||
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1
  ) {
    const Comp = lookupModelComponent('outcrop1') ?? (React.Fragment)
    return (
      <>
        <group
          position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
          rotation={[0, boardPiece.rotation, 0]}
        >
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={outcropColor}
            />
          </ModelWrapper>
        </group>
        <ObstacleBase
          x={x}
          y={yBase + HEXGRID_HEX_HEIGHT}
          z={z}
          color={outcropBaseColor}
          isFluidBase={true}
        />
      </>
    )
  }
  // GLACIER3 / OUTCROP3 / LAVAOUTCROP3
  if (
    inventoryID === Pieces.glacier3 ||
    inventoryID === Pieces.outcrop3 ||
    inventoryID === Pieces.lavaRockOutcrop3
  ) {
    const Comp = lookupModelComponent('outcrop3') ?? (React.Fragment)
    return (
      <>
        <group
          position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
          rotation={[0, getObstaclRotation(boardPiece.rotation), 0]}
        >
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={outcropColor}
            />
          </ModelWrapper>
        </group>
        <ObstacleBase
          x={x}
          y={yBase + HEXGRID_HEX_HEIGHT}
          z={z}
          color={outcropBaseColor}
          isFluidBase={true}
        />
      </>
    )
  }
  // GLACIER4
  if (
    inventoryID === Pieces.glacier4
  ) {
    const Comp = lookupModelComponent('outcrop4') ?? (React.Fragment)
    return (
      <>
        <group
          position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
          rotation={[0, getObstaclRotation(boardPiece.rotation), 0]}
        >
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={outcropColor}
            />
          </ModelWrapper>
        </group>
        <ObstacleBase
          x={x}
          y={yBase + HEXGRID_HEX_HEIGHT}
          z={z}
          color={outcropBaseColor}
          isFluidBase={true}
        />
      </>
    )
  }
  // GLACIER6
  if (
    inventoryID === Pieces.glacier6
  ) {
    const Comp = lookupModelComponent('outcrop6') ?? (React.Fragment)
    return (
      <>
        <group
          position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
          rotation={[0, getObstaclRotation(boardPiece.rotation), 0]}
        >
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={outcropColor}
            />
          </ModelWrapper>
        </group>
        <ObstacleBase
          x={x}
          y={yBase + HEXGRID_HEX_HEIGHT}
          z={z}
          color={outcropBaseColor}
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
    const Comp = lookupModelComponent(inventoryID) ?? (React.Fragment)
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ModelWrapper {...interactivityProps}>
            <Comp
              color={hexTerrainColor[HexTerrain.laurWall]}
              secondaryColor={hexTerrainColor.laurModelColor2}
            />
          </ModelWrapper>
        </Suspense>
      </group>
    )
  }
  // BATTLEMENT
  if (inventoryID === Pieces.battlement) {
    const Comp = lookupModelComponent(inventoryID) ?? (React.Fragment)
    return (
      <group
        position={[
          x + getLadderBattlementOptions(rotation).xAdd,
          y + HEXGRID_HEXCAP_HEIGHT / 2,
          z + getLadderBattlementOptions(rotation).zAdd,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ModelWrapper {...interactivityProps}>
            <Comp color={hexTerrainColor[HexTerrain.battlement]} />
          </ModelWrapper>
        </Suspense>
      </group>
    )
  }
  // ROADWALL
  if (inventoryID === Pieces.roadWall) {
    const Comp = lookupModelComponent(inventoryID) ?? (React.Fragment)
    return (
      <group
        position={[
          x + getRoadWallOptions(rotation).xAdd,
          y,
          z + getRoadWallOptions(rotation).zAdd,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ModelWrapper {...interactivityProps}>
            <Comp color={hexTerrainColor[HexTerrain.roadWall]} />
          </ModelWrapper>
        </Suspense>
      </group>
    )
  }
  // SINGLE HEX TREES
  // if (isSingleHexTreePieceID(inventoryID)) {
  //   return (
  //     <>
  //       <group
  //         scale={[
  //           getOptionsForTreeHeight(inventoryID).scaleX,
  //           getOptionsForTreeHeight(inventoryID).scaleY,
  //           getOptionsForTreeHeight(inventoryID).scaleX,
  //         ]}
  //         position={[
  //           x,
  //           yWithBase + getOptionsForTreeHeight(inventoryID).y + HEXGRID_HEX_HEIGHT,
  //           z,
  //         ]}
  //         rotation={[0, pieceRotation, 0]}
  //       >
  //         <Suspense fallback={<ModelLoader />}>
  //           <ForestTree pid={pid} />
  //         </Suspense>
  //       </group>
  //       <ObstacleBase
  //         x={x}
  //         y={yBase + HEXGRID_HEX_HEIGHT}
  //         z={z}
  //         color={hexTerrainColor.treeBase}
  //       />
  //     </>
  //   )
  // }
  // BIG TREE
  // if (inventoryID === Pieces.tree415) {
  //   return (
  //     <Suspense fallback={<ModelLoader />}>
  //       <group
  //         position={[
  //           x,
  //           y,
  //           z
  //         ]}
  //         rotation={[0, pieceRotation, 0]}
  //       >
  //         <BigTree415 pid={pid} />
  //       </group>
  //     </Suspense>
  //   )
  // }
  // JUNGLE BUSH
  // if (piecesSoFar[inventoryID].terrain === HexTerrain.brush) {
  //   return (
  //     <group
  //       position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
  //       rotation={[0, pieceRotation, 0]}
  //     >
  //       <Suspense fallback={<ModelLoader />}>
  //         <JungleBrush pid={pid} />
  //       </Suspense>
  //     </group>
  //   )
  // }
  // JUNGLE PALM
  // if (piecesSoFar[inventoryID].terrain === HexTerrain.palm) {
  //   return (
  //     <group
  //       scale={[1, getOptionsForPalmHeight(inventoryID).scaleY, 1]}
  //       position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
  //       rotation={[0, pieceRotation, 0]}
  //     >
  //       <Suspense fallback={<ModelLoader />}>
  //         <TicallaPalm pid={pid} />
  //       </Suspense>
  //     </group>
  //   )
  // }
  return <></>
}
