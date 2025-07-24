import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForBigTree,
  getOptionsForPalmHeight,
  getOptionsForTreeHeight,
  getRoadWallOptions,
  getRuinsOptions,
} from './models/piece-adjustments'
import {
  getBoardHex3DCoords,
  getRoadWallClickedHexCoords,
} from '../utils/map-utils'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HexTerrain, PiecePrefixes, Pieces } from '../types'
import { LaurWallPillarPreview } from './models/LaurPillar'
import {
  HEXGRID_GLYPH_HEIGHT,
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../utils/constants'
import { Suspense } from 'react'
import ModelLoader from './models/ModelLoader'
import {
  Subterrain1,
  Subterrain2,
  Subterrain24,
  Subterrain3,
  Subterrain4,
  Subterrain5,
  Subterrain6,
  Subterrain6B,
  Subterrain7,
  Subterrain7B,
  Subterrain9,
} from './models/LandSubterrain'
import { hexTerrainColor } from './maphex/hexColors'
import { FLUID_CAP_OPACITY } from './maphex/instance/FluidCap'
import { GlyphModel } from './models/Glyph'
import { LaurWallTrianglePillarPreview } from './models/LaurTrianglePillar'
import ForestTree from './models/ForestTree'
import BigTree415 from './models/BigTree415'
import MarroHive6 from './models/MarroHive6'
import { Outcrop3Preview } from './models/Outcrop3'
import { Outcrop4Preview } from './models/Outcrop4'
import { Outcrop6Preview } from './models/Outcrop6'
import { LadderPreview } from './models/Ladder'
import { LaurWallAddonPreview } from './models/LaurAddon'
import { Ruins2Preview } from './models/Ruins2'
import { Ruins3Preview } from './models/Ruins3'
import { MarvelRuinPreview } from './models/MarvelRuin'
import { TicallaPalmPreview } from './models/TicallaPalm'
import { TicallaBrushPreview } from './models/TicallaBrush'
import { RoadWallPreview } from './models/RoadWall'
import { BattlementPreview } from './models/Battlement'
import { Outcrop1Preview } from './models/Outcrop1'
import { CastleWallPreview } from './models/CastleWalls'
import { CastleBasePreview } from './models/CastleBases'
import { CastleArchPreview } from './models/CastleArch'

export default function PiecePreview() {
  const hoveredHex = useBoundStore((s) => s.hoveredHex)
  const penMode = useBoundStore((s) => s.penMode)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const penModeSize = useBoundStore((s) => s.pieceSize)

  // Determine the piece to preview based on penMode and pieceSize
  const pieceKey = penModeSize === 0 ? penMode : `${penMode}${penModeSize}`
  const piece = piecesSoFar[pieceKey]

  /* Piece Preview:
  1. A solid/fluid/empty cap (preview anything except laur-addons)
  2. Laur Pillar / Triangle (preview laud-addons)
  3. Castle Walls onto Walls (preview stacking)
  4. 
  */
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pieceID = piece?.id ?? ''

  //EARLY RETURN:  Only show preview if hovering a valid hex and penMode is not 'select'
  if (!hoveredHex || penMode === 'select') {
    return null
  }

  const isRoadWall = pieceID === Pieces.roadWall
  const isBattlement = pieceID === Pieces.battlement
  const mirrorRotation = (penModeRotation + 3) % 6
  const { x, y, z, yWithBase, yBase, yBaseCap, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords(hoveredHex)
  const isUnderHexFluid = isFluidTerrainHex(hoveredHex.terrain)
  const isUnderHexLadder = hoveredHex.inventoryID === Pieces.ladder
  const isUnderHexLaurPillar =
    hoveredHex.inventoryID === Pieces.laurWallSquarePillar ||
    hoveredHex.inventoryID === Pieces.laurWallTrianglePillar
  const isUnderHexCastleWallArch =
    hoveredHex.inventoryID === Pieces.castleArch ||
    hoveredHex.inventoryID === Pieces.castleArchNoDoor ||
    hoveredHex.inventoryID === Pieces.castleWallCorner ||
    hoveredHex.inventoryID === Pieces.castleWallEnd ||
    hoveredHex.inventoryID === Pieces.castleWallStraight
  const isLaurWallAddon = piece.terrain === HexTerrain.laurWallAddon
  const isSolidSubterrain = isSolidTerrainHex(piece.terrain)
  const isFluidSubterrain = isFluidTerrainHex(piece.terrain)
  const isLaurSquarePillarHex = piece.id === Pieces.laurWallSquarePillar
  const isLaurTrianglePillarHex = pieceID === Pieces.laurWallTrianglePillar
  const isPowerGlyphHex = pieceID === Pieces.glyphPower
  const isTreasureGlyphHex = pieceID === Pieces.glyphTreasure
  const isTreeHex =
    pieceID === Pieces.tree10 ||
    pieceID === Pieces.tree11 ||
    pieceID === Pieces.tree12
  const isBigTreeHex = pieceID.endsWith(Pieces.tree415)

  const isShowEmptyHexes =
    !isTakingPicture && hoveredHex.terrain === HexTerrain.empty
  const isStartZoneHex = hoveredHex.terrain === HexTerrain.startZone
  const isHeightRingedHex =
    (isSolidTerrainHex(hoveredHex.terrain) && !hoveredHex.isCap) ||
    isShowEmptyHexes
  const isObstacleHex =
    hoveredHex.isObstacleOrigin || hoveredHex.isObstacleAuxiliary
  const isBrushHex =
    piece.id === Pieces.laurBrush10 || piece.id === Pieces.brush9
  const isSwampBrushHex = piece.id === Pieces.swampBrush10
  const isPalmHex = piece.terrain === HexTerrain.palm
  const isGlacier1Hex = pieceID === Pieces.glacier1
  const isOutcrop1Hex = pieceID === Pieces.outcrop1
  const isLavaRockOutcrop1Hex = pieceID === Pieces.lavaRockOutcrop1
  const isCastleBaseEnd = pieceID === Pieces.castleBaseEnd
  const isCastleBaseStraight = pieceID === Pieces.castleBaseStraight
  const isCastleBaseCorner = pieceID === Pieces.castleBaseCorner
  const isCastleWallEnd = pieceID === Pieces.castleWallEnd
  const isCastleWallStraight = pieceID === Pieces.castleWallStraight
  const isCastleWallCorner = pieceID === Pieces.castleWallCorner
  const isCastleArch =
    pieceID === Pieces.castleArch || pieceID === Pieces.castleArchNoDoor

  const isHiveHex = pieceID === Pieces.hive
  const isLadderHex = piece.terrain === HexTerrain.ladder
  const isOutcrop3Hex = pieceID === Pieces.outcrop3
  const isLavaRockOutcrop3Hex = pieceID === Pieces.lavaRockOutcrop3
  const isGlacier3Hex = pieceID === Pieces.glacier3
  const isGlacier4Hex = pieceID === Pieces.glacier4
  const isGlacier6Hex = pieceID === Pieces.glacier6
  const isRuin2Hex = pieceID === Pieces.ruins2
  const isRuin3Hex = pieceID === Pieces.ruins3
  const isMarvelRuinHex =
    pieceID === Pieces.marvel ||
    pieceID === Pieces.marvelBroken ||
    pieceID === Pieces.marvelNoUpper ||
    pieceID === Pieces.marvelNoUpperBroken

  const ruinsOptions = getRuinsOptions(penModeRotation)
  const pieceRotation = (penModeRotation * -Math.PI) / 3

  const subterrainColor = hexTerrainColor[piece.terrain]

  const landSubterrainMaterial = () => {
    if (isLightsAndShadowsRender) {
      if (isFluidTerrainHex(piece.terrain)) {
        return (
          <meshStandardMaterial
            color={subterrainColor}
            transparent
            opacity={PIECE_PREVIEW_OPACITY}
          />
        )
      }
      return (
        <meshStandardMaterial
          color={subterrainColor}
          transparent
          opacity={PIECE_PREVIEW_OPACITY}
        />
      )
    }
    // not high quality render below
    if (isFluidTerrainHex(piece.terrain)) {
      return (
        <meshLambertMaterial
          color={subterrainColor}
          transparent
          opacity={FLUID_CAP_OPACITY}
        />
      )
    }
    return (
      <meshMatcapMaterial
        color={subterrainColor}
        transparent
        opacity={FLUID_CAP_OPACITY}
      />
    )
  }
  const getLandMesh = () => {
    switch (
    penModeSize === 6 && penMode === PiecePrefixes.concrete
      ? '6B'
      : penModeSize === 7 && penMode === PiecePrefixes.wallWalk
        ? '7B'
        : `${penModeSize}`
    ) {
      case '1':
        return <Subterrain1>{landSubterrainMaterial()}</Subterrain1>
      case '2':
        return <Subterrain2>{landSubterrainMaterial()}</Subterrain2>
      case '3':
        return <Subterrain3>{landSubterrainMaterial()}</Subterrain3>
      case '4':
        return <Subterrain4>{landSubterrainMaterial()}</Subterrain4>
      case '5':
        return <Subterrain5>{landSubterrainMaterial()}</Subterrain5>
      case '6':
        return <Subterrain6>{landSubterrainMaterial()}</Subterrain6>
      case '6B':
        return <Subterrain6B>{landSubterrainMaterial()}</Subterrain6B>
      case '7B':
        return <Subterrain7B>{landSubterrainMaterial()}</Subterrain7B>
      case '7':
        return <Subterrain7>{landSubterrainMaterial()}</Subterrain7>
      case '9':
        return <Subterrain9>{landSubterrainMaterial()}</Subterrain9>
      case '24':
        return <Subterrain24>{landSubterrainMaterial()}</Subterrain24>
      default:
        return null
    }
  }
  const isLandBeneath =
    isSolidTerrainHex(hoveredHex.terrain) ||
    isFluidTerrainHex(hoveredHex.terrain)
  const isEmptyBeneath = hoveredHex.terrain === HexTerrain.empty
  const isCastleCapBeneath =
    hoveredHex.terrain === HexTerrain.castle && !hoveredHex.isObstacleOrigin
  const isSolidOrEmptyBeneath =
    isSolidTerrainHex(hoveredHex.terrain) || isEmptyBeneath
  const isLandOrEmptyBeneath = isLandBeneath || isEmptyBeneath

  // Early Return: no piece
  if (!piece) return null
  // Show land tiles, if hovering table/solid-land
  if (
    ((isSolidSubterrain || isFluidSubterrain) && isSolidOrEmptyBeneath) ||
    (isUnderHexCastleWallArch && piece.terrain === HexTerrain.wallWalk)
  ) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
        scale={[1, isFluidSubterrain ? HEXGRID_HEXCAP_FLUID_SCALE : 1, 1]}
      >
        <Suspense fallback={<ModelLoader />}>{getLandMesh()}</Suspense>
      </group>
    )
  }
  if (isLaurWallAddon && isUnderHexLaurPillar) {
    return (
      <group
        position={[x, yWithBase, z + HEXGRID_HEXCAP_FLUID_HEIGHT / 2]}
        rotation={[0, pieceRotation, 0]}
      >
        <LaurWallAddonPreview inventoryID={pieceID} />
      </group>
    )
  }
  if (isLaurSquarePillarHex && isLandOrEmptyBeneath) {
    return (
      <group
        position={[
          x,
          (isUnderHexFluid
            ? yGlyphFluidUnder
            : yGlyph - HEXGRID_HEXCAP_HEIGHT) +
          HEXGRID_HEXCAP_FLUID_HEIGHT / 3 + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <LaurWallPillarPreview />
      </group>
    )
  }
  // TODO: Pillars: Can put some pillars onto other pillars
  if (isLaurTrianglePillarHex && isLandOrEmptyBeneath) {
    return (
      <group
        position={[
          x,
          (isUnderHexFluid
            ? yGlyphFluidUnder
            : yGlyph - HEXGRID_HEXCAP_HEIGHT) +
          HEXGRID_HEXCAP_FLUID_HEIGHT / 3 + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <LaurWallTrianglePillarPreview />
      </group>
    )
  }
  if (
    (isGlacier1Hex || isOutcrop1Hex || isLavaRockOutcrop1Hex) &&
    isSolidOrEmptyBeneath
  ) {
    return (
      <group position={[x, yWithBase, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <Outcrop1Preview
            isLavaRock={isLavaRockOutcrop1Hex}
            isGlacier={isGlacier1Hex}
          />
        </Suspense>
      </group>
    )
  }
  if (isTreeHex && isSolidOrEmptyBeneath) {
    return (
      <group
        scale={[
          getOptionsForTreeHeight(pieceID).scaleX,
          getOptionsForTreeHeight(pieceID).scaleY,
          getOptionsForTreeHeight(pieceID).scaleX,
        ]}
        position={[x, yWithBase + getOptionsForTreeHeight(pieceID).y + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ForestTree />
        </Suspense>
      </group>
    )
  }
  if (isCastleArch && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yBase - 0.005 + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <CastleArchPreview isDoor={pieceID === Pieces.castleArch} />
        </Suspense>
      </group>
    )
  }
  if (
    (isCastleWallCorner || isCastleWallEnd || isCastleWallStraight) &&
    (isSolidOrEmptyBeneath || isCastleCapBeneath)
  ) {
    return (
      <group
        position={[x, yBase - 0.005 + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <CastleWallPreview
            isCastleEnd={isCastleWallEnd}
            isCastleStraight={isCastleWallStraight}
            isCastleUnder={isCastleCapBeneath}
          />
        </Suspense>
      </group>
    )
  }
  if (
    (isCastleBaseCorner || isCastleBaseEnd || isCastleBaseStraight) &&
    isSolidOrEmptyBeneath
  ) {
    return (
      <group
        position={[x, yBase + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <CastleBasePreview
            isCastleEnd={isCastleBaseEnd}
            isCastleStraight={isCastleBaseStraight}
          />
        </Suspense>
      </group>
    )
  }
  if (isBigTreeHex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[
          x + getOptionsForBigTree(penModeRotation).xAdd,
          yWithBase + HEXGRID_HEX_HEIGHT,
          z + getOptionsForBigTree(penModeRotation).zAdd,
        ]}
        scale={0.038}
        rotation={[0, getOptionsForBigTree(penModeRotation).rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <BigTree415 />
        </Suspense>
      </group>
    )
  }
  if (isPalmHex && isSolidOrEmptyBeneath) {
    return (
      <group
        scale={[1, getOptionsForPalmHeight(pieceID).scaleY, 1]}
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <TicallaPalmPreview opacity={PIECE_PREVIEW_OPACITY} />
        </Suspense>
      </group>
    )
  }
  if (isBrushHex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <TicallaBrushPreview opacity={PIECE_PREVIEW_OPACITY} />
        </Suspense>
      </group>
    )
  }
  if (isSwampBrushHex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <TicallaBrushPreview
            color1={hexTerrainColor.swampUnderbrush1}
            color2={hexTerrainColor.swampUnderbrush2}
            color3={hexTerrainColor.swampUnderbrush3}
            colorBase={hexTerrainColor[HexTerrain.swamp]}
            opacity={PIECE_PREVIEW_OPACITY}
          />
        </Suspense>
      </group>
    )
  }
  if (isHiveHex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yWithBase, z]}
        rotation={[0, getObstaclRotation(penModeRotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <MarroHive6 />
        </Suspense>
      </group>
    )
  }
  if (isRuin2Hex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x + ruinsOptions.xAdd, yBaseCap, z + ruinsOptions.zAdd]}
        rotation={[0, ruinsOptions.rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Ruins2Preview />
        </Suspense>
      </group>
    )
  }
  if (isRuin3Hex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x + ruinsOptions.xAdd, yBaseCap, z + ruinsOptions.zAdd]}
        rotation={[0, ruinsOptions.rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Ruins3Preview />
        </Suspense>
      </group>
    )
  }
  if (isMarvelRuinHex && isSolidOrEmptyBeneath) {
    return (
      <group position={[x, yBaseCap, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <MarvelRuinPreview
            isUpperFloor={
              pieceID === Pieces.marvel || pieceID === Pieces.marvelBroken
            }
            isWallIntact={
              pieceID === Pieces.marvel || pieceID === Pieces.marvelNoUpper
            }
          />
        </Suspense>
      </group>
    )
  }
  if (isPowerGlyphHex || (isTreasureGlyphHex && isLandOrEmptyBeneath)) {
    return (
      <group
        position={[
          x,
          isUnderHexFluid
            ? yGlyphFluidUnder + HEXGRID_HEXCAP_FLUID_HEIGHT
            : yGlyph + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, (hoveredHex.pieceRotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <GlyphModel terrain={piece.terrain} />
        </Suspense>
      </group>
    )
  }
  // if(XXX){
  //   return(

  //   )
  // }
  if (isLadderHex && (isUnderHexLadder || isLandOrEmptyBeneath)) {
    const ladderRotation = isUnderHexLadder
      ? hoveredHex.pieceRotation
      : penModeRotation
    return (
      <group
        position={[
          x + getLadderBattlementOptions(ladderRotation).xAdd,
          y +
          HEXGRID_HEXCAP_HEIGHT / 2 +
          (isUnderHexLadder ? HEXGRID_HEX_HEIGHT : 0),
          z + getLadderBattlementOptions(ladderRotation).zAdd,
        ]}
        rotation={[0, (ladderRotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LadderPreview />
        </Suspense>
      </group>
    )
  }
  if (isGlacier4Hex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yWithBase, z]}
        rotation={[0, getObstaclRotation(penModeRotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Outcrop4Preview />
        </Suspense>
      </group>
    )
  }
  if (isGlacier6Hex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yWithBase, z]}
        rotation={[0, getObstaclRotation(penModeRotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Outcrop6Preview />
        </Suspense>
      </group>
    )
  }
  if (
    (isOutcrop3Hex || isLavaRockOutcrop3Hex || isGlacier3Hex) &&
    isSolidOrEmptyBeneath
  ) {
    return (
      <group
        position={[x, yWithBase, z]}
        rotation={[0, getObstaclRotation(penModeRotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Outcrop3Preview
            isGlacier={piece.terrain === HexTerrain.glacier}
            isLavaRock={piece.terrain === HexTerrain.lavaRockOutcrop}
          />
        </Suspense>
      </group>
    )
  }
  if (isRoadWall) {
    const roadWallClickedHexCoords = {
      ...getRoadWallClickedHexCoords(hoveredHex, penModeRotation),
      altitude: hoveredHex.altitude - 1,
    }
    const {
      x: xRoadWall,
      y: yRoadWall,
      z: zRoadWall,
    } = getBoardHex3DCoords(roadWallClickedHexCoords)
    return (
      <group
        position={[
          xRoadWall + getRoadWallOptions(penModeRotation).xAdd,
          yRoadWall,
          zRoadWall + getRoadWallOptions(penModeRotation).zAdd,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <RoadWallPreview />
      </group>
    )
  }
  if (isBattlement) {
    const battlementClickedHexCoords = {
      ...hoveredHex,
      altitude: hoveredHex.altitude - 1,
    }
    const {
      x: xBattlement,
      y: yBattlement,
      z: zBattlement,
    } = getBoardHex3DCoords(battlementClickedHexCoords)
    return (
      <group
        position={[
          xBattlement + getLadderBattlementOptions(penModeRotation).xAdd,
          yBattlement + HEXGRID_HEXCAP_HEIGHT / 2,
          zBattlement + getLadderBattlementOptions(penModeRotation).zAdd,
        ]}
        rotation={[0, (mirrorRotation * -Math.PI) / 3, 0]}
      >
        <BattlementPreview />
      </group>
    )
  }
  return null
}
