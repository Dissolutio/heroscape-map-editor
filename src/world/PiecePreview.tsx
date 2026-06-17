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
  genBoardHexID,
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
import { GlyphModel, GlyphModelPreview } from './models/Glyph'
import { LaurWallTrianglePillarPreview } from './models/LaurTrianglePillar'
import ForestTree from './models/ForestTree'
import BigTree415 from './models/BigTree415'
import MarroHive6 from './models/MarroHive6'
import { Outcrop3Preview } from './models/Outcrop3'
import { Outcrop4Preview } from './models/Outcrop4'
import { Outcrop6Preview } from './models/Outcrop6'
import { LadderPreview } from './models/Ladder'
import { LaurWallArchPreview } from './models/LaurWallArchModel'
import { LaurWallLongPreview } from './models/LaurWallLongModel'
import { LaurWallRuinPreview } from './models/LaurWallRuinModel'
import { LaurWallShortPreview } from './models/LaurWallShortModel'
import { Ruins2Preview } from './models/Ruins2'
import { Ruins3Preview } from './models/Ruins3'
import { MarvelRuinPreview } from './models/MarvelRuin'
import { LaurPalmPreview, TicallaPalmPreview } from './models/TicallaPalm'
import {
  LaurBrushPreview,
  SwampBrushPreview,
  TicallaBrushPreview,
} from './models/TicallaBrush'
import { RoadWallPreview } from './models/RoadWall'
import { BattlementPreview } from './models/Battlement'
import { Outcrop1Preview } from './models/Outcrop1'
import { CastleWallPreview } from './models/CastleWalls'
import { CastleBasePreview } from './models/CastleBases'
import { CastleArchPreview } from './models/CastleArch'
import { FortifiedWallPreview } from './models/FortifiedWall'
import Shroudshroom7 from './models/Shroudshroom7'
import Shroudshroom10 from './models/Shroudshroom10'
import Shroudshroom13 from './models/Shroudshroom13'
import Cannon from './models/Cannon'
import { RopeLadder } from './models/RopeLadder'
import { ShipWall } from './models/ShipWall'
import { ShipBow } from './models/ShipBow'
import { SnowEvergreenTree } from './models/SnowEvergreenTree'

export default function PiecePreview() {
  const hoveredHex = useBoundStore((s) => s.hoveredHex)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hoveredPiece = boardPieces.find((bp) => bp.uid === hoveredPieceID)
  const penMode = useBoundStore((s) => s.penMode)
  const hoveredPieceSupportHexID =
    hoveredPiece &&
      hoveredPiece.inventoryID === Pieces.ladder &&
      penMode === Pieces.ladder
      ? genBoardHexID({
        ...hoveredPiece.pieceCoords,
        altitude: hoveredPiece.altitude,
      })
      : ''
  const hoveredPieceSupportHex = hoveredPieceSupportHexID
    ? boardHexes?.[hoveredPieceSupportHexID]
    : undefined
  const hoveredHexForPreview = hoveredHex ?? hoveredPieceSupportHex
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

  //EARLY RETURN:  Only show preview if hovering a valid hex, a piece is defined, penMode is not 'select', and map picture not being taken
  if (
    !hoveredHexForPreview ||
    !piece ||
    penMode === 'select' ||
    isTakingPicture
  ) {
    return null
  }

  const isRoadWall = pieceID === Pieces.roadWall
  const isBattlement = pieceID === Pieces.battlement
  const mirrorRotation = (penModeRotation + 3) % 6
  const { x, y, z, yWithBase, yBase, yBaseCap, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords(hoveredHexForPreview)
  const isUnderHexFluid = isFluidTerrainHex(hoveredHexForPreview?.terrain)
  const isUnderHexLadder = hoveredPiece?.inventoryID === Pieces.ladder
  const isLadderChainOnFluid = (() => {
    if (!isUnderHexLadder)
      return isFluidTerrainHex(hoveredHexForPreview?.terrain)
    const supportHex = hoveredPieceSupportHex
    if (!supportHex) return false
    if (isFluidTerrainHex(supportHex.terrain)) return true
    if (supportHex.terrain !== HexTerrain.ladder) return false
    let checkAlt = (hoveredPiece?.altitude ?? 0) - 1
    while (checkAlt >= 0) {
      const checkHex =
        boardHexes?.[
        genBoardHexID({ ...hoveredPiece?.pieceCoords, altitude: checkAlt })
        ]
      if (!checkHex) return false
      if (checkHex.terrain === HexTerrain.ladder) {
        checkAlt--
        continue
      }
      return isFluidTerrainHex(checkHex.terrain)
    }
    return false
  })()
  const isUnderHexLaurPillar =
    hoveredHexForPreview.inventoryID === Pieces.laurWallSquarePillar ||
    hoveredHexForPreview.inventoryID === Pieces.laurWallTrianglePillar
  const isUnderHexCastleWallArch =
    hoveredHexForPreview.inventoryID === Pieces.castleArch ||
    hoveredHexForPreview.inventoryID === Pieces.castleArchNoDoor ||
    hoveredHexForPreview.inventoryID === Pieces.castleWallCorner ||
    hoveredHexForPreview.inventoryID === Pieces.castleWallEnd ||
    hoveredHexForPreview.inventoryID === Pieces.castleWallStraight
  const isLaurWallAddon = piece?.terrain === HexTerrain.laurWallAddon
  const isSolidSubterrain = isSolidTerrainHex(piece?.terrain)
  const isFluidSubterrain = isFluidTerrainHex(piece?.terrain)
  const isLaurSquarePillarHex = piece.id === Pieces.laurWallSquarePillar
  const isLaurTrianglePillarHex = pieceID === Pieces.laurWallTrianglePillar
  const isPowerGlyphHex = piece?.terrain === HexTerrain.glyphPower
  const isTreasureGlyphHex = piece?.terrain === HexTerrain.glyphTreasure
  const isTreeHex =
    pieceID === Pieces.tree10 ||
    pieceID === Pieces.tree11 ||
    pieceID === Pieces.tree12
  const isSnowTreeHex =
    pieceID === Pieces.snowTree10 ||
    pieceID === Pieces.snowTree12
  const isBigTreeHex = pieceID.endsWith(Pieces.tree415)

  // const isShowEmptyHexes =
  //   !isTakingPicture && hoveredHex.terrain === HexTerrain.empty
  // const isStartZoneHex = hoveredHex.terrain === HexTerrain.startZone
  // const isHeightRingedHex =
  //   (isSolidTerrainHex(hoveredHex.terrain) && !hoveredHex.isCap) ||
  //   isShowEmptyHexes
  // const isObstacleHex =
  //   hoveredHex.isObstacleOrigin || hoveredHex.isObstacleAuxiliary
  const isLaurBrushHex = piece.id === Pieces.laurBrush10
  const isTicallaBrushHex = piece.id === Pieces.brush9
  const isSwampBrushHex = piece.id === Pieces.swampBrush10
  const isTicallaPalmHex =
    pieceID === Pieces.palm16 ||
    pieceID === Pieces.palm14 ||
    pieceID === Pieces.palm15
  const isLaurPalmHex =
    pieceID === Pieces.laurPalm13 ||
    pieceID === Pieces.laurPalm14 ||
    pieceID === Pieces.laurPalm15
  const isShroudshroom7Hex = pieceID === Pieces.shroudshroom7
  const isShroudshroom10Hex = pieceID === Pieces.shroudshroom10
  const isShroudshroom13Hex = pieceID === Pieces.shroudshroom13
  const isShipWallHex = pieceID === Pieces.shipWall
  const isShipBowHex = pieceID === Pieces.shipBow
  const isCannonHex = pieceID === Pieces.cannon
  const isRopeLadderHex = pieceID === Pieces.ropeLadder
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
  const isLadderHex = piece?.terrain === HexTerrain.ladder
  const isOutcrop3Hex = pieceID === Pieces.outcrop3
  const isLavaRockOutcrop3Hex = pieceID === Pieces.lavaRockOutcrop3
  const isGlacier3Hex = pieceID === Pieces.glacier3
  const isGlacier4Hex = pieceID === Pieces.glacier4
  const isGlacier6Hex = pieceID === Pieces.glacier6
  const isRuin2Hex = pieceID === Pieces.ruins2
  const isRuin3Hex = pieceID === Pieces.ruins3
  const isFortifiedWallHex = pieceID === Pieces.fortifiedWall
  const isMarvelRuinHex =
    pieceID === Pieces.marvel ||
    pieceID === Pieces.marvelBroken ||
    pieceID === Pieces.marvelNoUpper ||
    pieceID === Pieces.marvelNoUpperBroken

  const ruinsOptions = getRuinsOptions(penModeRotation)
  const pieceRotation = (penModeRotation * -Math.PI) / 3

  const subterrainColor =
    piece?.terrain === HexTerrain.swamp
      ? hexTerrainColor.swampCap // override, to distinguish preview from swamp water
      : hexTerrainColor?.[piece?.terrain as keyof typeof hexTerrainColor]

  const landSubterrainMaterial = () => {
    if (isLightsAndShadowsRender) {
      if (isFluidTerrainHex(piece?.terrain)) {
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
    if (isFluidTerrainHex(piece?.terrain)) {
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
    isSolidTerrainHex(hoveredHexForPreview?.terrain) ||
    isFluidTerrainHex(hoveredHexForPreview?.terrain)
  const isEmptyBeneath = hoveredHexForPreview?.terrain === HexTerrain.empty
  const isCastleCapBeneath =
    hoveredHexForPreview?.terrain === HexTerrain.castleWall &&
    !hoveredHexForPreview.isObstacleOrigin
  const isSolidBeneath = isSolidTerrainHex(hoveredHexForPreview.terrain)
  const isSolidOrEmptyBeneath = isSolidBeneath || isEmptyBeneath
  const isLandOrEmptyBeneath = isLandBeneath || isEmptyBeneath

  // Show land tiles, if hovering table/solid-land
  if (
    ((isSolidSubterrain || isFluidSubterrain) && isSolidOrEmptyBeneath) ||
    (isUnderHexCastleWallArch && piece?.terrain === HexTerrain.wallWalk)
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
    let laurPreview = null
    if (
      pieceID === Pieces.laurWallRuin1 ||
      pieceID === Pieces.laurWallRuin2 ||
      pieceID === Pieces.laurWallRuin3
    ) {
      laurPreview = <LaurWallRuinPreview />
    }
    if (
      pieceID === Pieces.laurWallShort ||
      pieceID === Pieces.laurWallShortStackable
    ) {
      laurPreview = <LaurWallShortPreview />
    }
    if (
      pieceID === Pieces.laurWallLong ||
      pieceID === Pieces.laurWallLongStackable
    ) {
      laurPreview = <LaurWallLongPreview />
    }
    if (pieceID === Pieces.laurWallArch) {
      laurPreview = <LaurWallArchPreview />
    }
    return (
      <group
        position={[x, yWithBase, z + HEXGRID_HEXCAP_FLUID_HEIGHT / 2]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>{laurPreview}</Suspense>
      </group>
    )
  }
  if (isLaurSquarePillarHex && isLandOrEmptyBeneath) {
    return (
      <group
        position={[
          x,
          (isUnderHexFluid
            ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT + HEXGRID_HEX_HEIGHT
            : yGlyph + HEXGRID_GLYPH_HEIGHT) +
          HEXGRID_HEXCAP_FLUID_HEIGHT / 2 +
          HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallPillarPreview />
        </Suspense>
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
            ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT + HEXGRID_HEX_HEIGHT
            : yGlyph + HEXGRID_GLYPH_HEIGHT - HEXGRID_HEXCAP_HEIGHT) +
          HEXGRID_HEXCAP_FLUID_HEIGHT / 2,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallTrianglePillarPreview pieceRotation={pieceRotation} />
        </Suspense>
      </group>
    )
  }
  if (isShroudshroom7Hex && isSolidBeneath) {
    return (
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom7 />
        </Suspense>
      </group>
    )
  }
  if (isShroudshroom10Hex && isSolidBeneath) {
    return (
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom10 />
        </Suspense>
      </group>
    )
  }
  if (isShroudshroom13Hex && isSolidBeneath) {
    return (
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom13 />
        </Suspense>
      </group>
    )
  }
  if (isShipWallHex && isLandOrEmptyBeneath) {
    return (
      <group
        // either gets moved down to fluid level, or up to solid cap level
        position={[
          x,
          y -
          (isUnderHexFluid
            ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
            : -HEXGRID_HEXCAP_HEIGHT / 2),
          z,
        ]}
        rotation={[0, getObstaclRotation(penModeRotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ShipWall />
        </Suspense>
      </group>
    )
  }
  if (isShipBowHex && isLandOrEmptyBeneath) {
    return (
      <group
        // either gets moved down to fluid level, or up to solid cap level
        position={[
          x,
          y -
          (isUnderHexFluid
            ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
            : -HEXGRID_HEXCAP_HEIGHT / 2),
          z,
        ]}
        rotation={[0, getObstaclRotation(penModeRotation), 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ShipBow />
        </Suspense>
      </group>
    )
  }
  if (isCannonHex && isLandBeneath) {
    return (
      <group
        position={[
          x,
          y -
          (isUnderHexFluid
            ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
            : 0),
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Cannon />
        </Suspense>
      </group>
    )
  }
  if (isRopeLadderHex && isSolidBeneath) {
    return (
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <RopeLadder />
        </Suspense>
      </group>
    )
  }
  if (
    (isGlacier1Hex || isOutcrop1Hex || isLavaRockOutcrop1Hex) &&
    isSolidOrEmptyBeneath
  ) {
    return (
      <group
        position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
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
        position={[
          x,
          yWithBase + getOptionsForTreeHeight(pieceID).y + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <ForestTree />
        </Suspense>
      </group>
    )
  }
  if (isSnowTreeHex && isSolidOrEmptyBeneath) {
    return (
      <group
        scale={[
          getOptionsForTreeHeight(pieceID).scaleX,
          getOptionsForTreeHeight(pieceID).scaleY,
          getOptionsForTreeHeight(pieceID).scaleX,
        ]}
        position={[
          x,
          yWithBase + getOptionsForTreeHeight(pieceID).y + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <SnowEvergreenTree />
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
  if (isTicallaPalmHex && isSolidOrEmptyBeneath) {
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
  if (isLaurPalmHex && isSolidOrEmptyBeneath) {
    return (
      <group
        scale={[1, getOptionsForPalmHeight(pieceID).scaleY, 1]}
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurPalmPreview opacity={PIECE_PREVIEW_OPACITY} />
        </Suspense>
      </group>
    )
  }
  if (isLaurBrushHex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurBrushPreview opacity={PIECE_PREVIEW_OPACITY} />
        </Suspense>
      </group>
    )
  }
  if (isTicallaBrushHex && isSolidOrEmptyBeneath) {
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
          <SwampBrushPreview opacity={PIECE_PREVIEW_OPACITY} />
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
        position={[
          x + ruinsOptions.xAdd,
          yBaseCap + HEXGRID_HEX_HEIGHT,
          z + ruinsOptions.zAdd,
        ]}
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
        position={[
          x + ruinsOptions.xAdd,
          yBaseCap + HEXGRID_HEX_HEIGHT,
          z + ruinsOptions.zAdd,
        ]}
        rotation={[0, ruinsOptions.rotationY, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <Ruins3Preview />
        </Suspense>
      </group>
    )
  }
  if (isFortifiedWallHex && isSolidBeneath) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <FortifiedWallPreview />
        </Suspense>
      </group>
    )
  }
  if (isMarvelRuinHex && isSolidOrEmptyBeneath) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
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
            ? yGlyphFluidUnder + HEXGRID_HEX_HEIGHT
            : yGlyph + HEXGRID_HEX_HEIGHT,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <GlyphModelPreview inventoryID={pieceID} />
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
      ? hoveredPiece.rotation
      : penModeRotation
    return (
      <group
        position={[
          x + getLadderBattlementOptions(ladderRotation).xAdd,
          y +
          HEXGRID_HEXCAP_HEIGHT / 2 +
          (isUnderHexLadder ? 2 * HEXGRID_HEX_HEIGHT : 0) -
          (isLadderChainOnFluid
            ? HEXGRID_HEX_HEIGHT - HEXGRID_HEXCAP_FLUID_HEIGHT
            : 0),
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
            isGlacier={piece?.terrain === HexTerrain.glacier}
            isLavaRock={piece?.terrain === HexTerrain.lavaRockOutcrop}
          />
        </Suspense>
      </group>
    )
  }
  if (isRoadWall) {
    const roadWallClickedHexCoords = {
      ...getRoadWallClickedHexCoords(hoveredHexForPreview, penModeRotation),
      altitude: hoveredHexForPreview.altitude - 1,
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
        <Suspense fallback={<ModelLoader />}>
          <RoadWallPreview />
        </Suspense>
      </group>
    )
  }
  if (isBattlement) {
    const battlementClickedHexCoords = {
      ...hoveredHexForPreview,
      altitude: hoveredHexForPreview.altitude - 1,
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
        <Suspense fallback={<ModelLoader />}>
          <BattlementPreview />
        </Suspense>
      </group>
    )
  }
  return null
}
