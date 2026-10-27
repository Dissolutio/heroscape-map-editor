import { Suspense, useEffect, useMemo } from 'react'
import { getLaurAddonHitHex } from '../data/laurAddonStacking'
import {
  areMatchingLaurPillarShapes,
  getLaurPillarStackAltitude,
} from '../data/laurPillarStacking'
import { piecesSoFar } from '../data/pieces'
import { getPlacementPreviewState } from '../data/placementPreview'
import { getSmartPlacementAltitude } from '../data/smartPlacement'
import { isE2E } from '../e2e/isE2E'
import { setPlacementPreview } from '../e2e/placementPreviewStore'
import useBoundStore from '../store/store'
import type { BoardHex } from '../types'
import { HexTerrain, PiecePrefixes, Pieces } from '../types'
import {
  isFluidTerrainHex,
  isLaurWallAddonPieceID,
  isSolidTerrainHex,
} from '../utils/board-utils'
import {
  HEXGRID_GLYPH_HEIGHT,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../utils/constants'
import {
  genBoardHexID,
  getBoardHex3DCoords,
  getRoadWallClickedHexCoords,
} from '../utils/map-utils'
import { LandPieceGhost } from './LandPieceGhost'
import { LaurAddonPreview } from './LaurAddonPreview'
import { PlacementFootprint } from './PlacementFootprint'
import { BattlementPreview } from './models/Battlement'
import BigTree415 from './models/BigTree415'
import Cannon from './models/Cannon'
import { CastleArchPreview } from './models/CastleArch'
import { CastleBasePreview } from './models/CastleBases'
import { CastleWallPreview } from './models/CastleWalls'
import ForestTree from './models/ForestTree'
import { FortifiedWallPreview } from './models/FortifiedWall'
import { GlyphModelPreview } from './models/Glyph'
import { LadderPreview } from './models/Ladder'
import { LaurWallPillarPreview } from './models/LaurPillar'
import { LaurWallTrianglePillarPreview } from './models/LaurTrianglePillar'
import MarroHive6 from './models/MarroHive6'
import { MarvelRuinPreview } from './models/MarvelRuin'
import ModelLoader from './models/ModelLoader'
import { Outcrop1Preview } from './models/Outcrop1'
import { Outcrop3Preview } from './models/Outcrop3'
import { Outcrop4Preview } from './models/Outcrop4'
import { Outcrop6Preview } from './models/Outcrop6'
import { RoadWallPreview } from './models/RoadWall'
import { RopeLadder } from './models/RopeLadder'
import { Ruins2Preview } from './models/Ruins2'
import { Ruins3Preview } from './models/Ruins3'
import { ShipBow } from './models/ShipBow'
import { ShipWall } from './models/ShipWall'
import Shroudshroom7 from './models/Shroudshroom7'
import Shroudshroom10 from './models/Shroudshroom10'
import Shroudshroom13 from './models/Shroudshroom13'
import { SnowEvergreenTree } from './models/SnowEvergreenTree'
import { StartZone3D } from './models/StartZone3D'
import {
  LaurBrushPreview,
  SwampBrushPreview,
  TicallaBrushPreview,
} from './models/TicallaBrush'
import { LaurPalmPreview, TicallaPalmPreview } from './models/TicallaPalm'
import {
  getLadderBattlementOptions,
  getObstaclRotation,
  getOptionsForPalmHeight,
  getOptionsForTreeHeight,
  getRoadWallOptions,
  getRuinsOptions,
} from './models/piece-adjustments'

export default function PiecePreview() {
  const hoveredHex = useBoundStore((s) => s.hoveredHex)
  const hoveredWorldPoint = useBoundStore((s) => s.hoveredWorldPoint)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const penMode = useBoundStore((s) => s.penMode)
  const penModeSize = useBoundStore((s) => s.pieceSize)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const pieceKey = penModeSize === 0 ? penMode : `${penMode}${penModeSize}`
  const piece = piecesSoFar[pieceKey]
  const hoveredAddon = boardPieces.find(
    (boardPiece) =>
      boardPiece.uid === hoveredPieceID &&
      hoveredHex?.boardPieceUID === hoveredPieceID &&
      isLaurWallAddonPieceID(boardPiece.inventoryID),
  )
  const placementPointerHex = useMemo(
    () => (hoveredAddon ? getLaurAddonHitHex(hoveredAddon) : hoveredHex),
    [hoveredAddon, hoveredHex],
  )
  const previewState = useMemo(() => {
    if (
      !placementPointerHex ||
      !piece ||
      penMode === 'select' ||
      isTakingPicture
    ) {
      return null
    }
    return getPlacementPreviewState(
      piece,
      placementPointerHex,
      penModeRotation,
      { boardHexes, boardPieces },
      hoveredAddon ? undefined : hoveredWorldPoint,
    )
  }, [
    boardHexes,
    boardPieces,
    hoveredAddon,
    placementPointerHex,
    hoveredWorldPoint,
    isTakingPicture,
    penMode,
    penModeRotation,
    piece,
  ])

  useEffect(() => {
    if (!isE2E) return
    setPlacementPreview(
      previewState
        ? {
            status: previewState.evaluation.status,
            reason: previewState.evaluation.reason ?? null,
            footprintCount: previewState.evaluation.footprintHexes.length,
            unsupported: previewState.unsupported,
            altitude:
              'blocked' in previewState.resolution
                ? null
                : previewState.resolution.altitude,
            rotation:
              'blocked' in previewState.resolution
                ? null
                : previewState.resolution.rotation,
          }
        : null,
    )
  }, [previewState])

  if (!placementPointerHex || !piece || !previewState) return null

  const { evaluation, resolution } = previewState
  const hoveredSurfaceHex =
    placementPointerHex.obstacleHeight &&
    (placementPointerHex.pieceID.includes(PiecePrefixes.castleWall) ||
      placementPointerHex.pieceID.includes(PiecePrefixes.castleArch))
      ? (boardHexes[
          genBoardHexID({
            ...placementPointerHex,
            altitude:
              placementPointerHex.altitude + placementPointerHex.obstacleHeight,
          })
        ] ?? placementPointerHex)
      : placementPointerHex
  const castleCapHex =
    !('blocked' in resolution) && resolution.rule === 'castleCap'
      ? (boardHexes[
          genBoardHexID({
            ...resolution.coords,
            altitude: resolution.altitude,
          })
        ] ?? {
          ...placementPointerHex,
          ...resolution.coords,
          altitude: resolution.altitude,
        })
      : undefined
  const addonPreviewHex =
    !('blocked' in resolution) && piece?.terrain === HexTerrain.laurWallAddon
      ? (boardHexes[
          genBoardHexID({
            ...resolution.coords,
            altitude: resolution.altitude,
          })
        ] ?? {
          ...placementPointerHex,
          ...resolution.coords,
          altitude: resolution.altitude,
        })
      : undefined

  return (
    <>
      <PlacementFootprint
        status={evaluation.status}
        unsupported={previewState.unsupported}
        footprintHexes={evaluation.footprintHexes}
        hoveredHex={hoveredSurfaceHex}
      />
      {evaluation.status !== 'blocked' && (
        <PiecePreviewModel
          hoveredHexOverride={addonPreviewHex ?? castleCapHex}
          unsupported={previewState.unsupported && evaluation.status === 'ok'}
          rotationOverride={
            'blocked' in resolution ? undefined : resolution.rotation
          }
        />
      )}
    </>
  )
}

function PiecePreviewModel({
  hoveredHexOverride,
  rotationOverride,
  unsupported,
}: {
  hoveredHexOverride?: BoardHex
  rotationOverride?: number
  unsupported: boolean
}) {
  const hoveredHex = useBoundStore((s) => s.hoveredHex)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hoveredPiece = boardPieces.find((bp) => bp.uid === hoveredPieceID)
  const penMode = useBoundStore((s) => s.penMode)
  const penModeSize = useBoundStore((s) => s.pieceSize)

  // Determine the piece to preview based on penMode and pieceSize
  const pieceKey = penModeSize === 0 ? penMode : `${penMode}${penModeSize}`
  const piece = piecesSoFar[pieceKey]
  const hoveredPieceSupportHexID = hoveredPiece
    ? genBoardHexID({
        ...hoveredPiece.pieceCoords,
        altitude: hoveredPiece.altitude,
      })
    : ''
  const hoveredPieceSupportHex = hoveredPieceSupportHexID
    ? boardHexes?.[hoveredPieceSupportHexID]
    : undefined
  const isHoveringPreviewSupportPiece =
    hoveredPiece?.inventoryID === Pieces.ladder && penMode === Pieces.ladder
  const hoveredHexAtPointer =
    hoveredHex ??
    (isHoveringPreviewSupportPiece ? hoveredPieceSupportHex : undefined)
  const hoveredHexForModel =
    isHoveringPreviewSupportPiece && hoveredPieceSupportHex
      ? hoveredPieceSupportHex
      : (hoveredHexOverride ?? hoveredHexAtPointer)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const hoveredHexForPreview = useMemo(() => {
    if (hoveredHexOverride) return hoveredHexOverride
    if (!piece || !hoveredHexForModel) return hoveredHexForModel
    if (piece.terrain === HexTerrain.laurWallAddon) return hoveredHexForModel
    const altitude = getSmartPlacementAltitude({
      boardHexes,
      piece,
      pieceCoords: hoveredHexForModel,
      altitude: hoveredHexForModel.altitude,
      rotation: penModeRotation,
    })
    if (altitude === hoveredHexForModel.altitude) return hoveredHexForModel
    const support =
      boardHexes[genBoardHexID({ ...hoveredHexForModel, altitude })]
    return {
      ...hoveredHexForModel,
      altitude,
      terrain: support?.terrain ?? HexTerrain.empty,
    }
  }, [
    boardHexes,
    hoveredHexForModel,
    hoveredHexOverride,
    penModeRotation,
    piece,
  ])

  /* Piece Preview:
  1. A solid/fluid/empty cap (preview anything except laur-addons)
  2. Laur Pillar / Triangle (preview laud-addons)
  3. Castle Walls onto Walls (preview stacking)
  4. 
  */
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
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
  const isUnderHexCastleWallArch =
    hoveredHexForPreview.inventoryID === Pieces.castleArch ||
    hoveredHexForPreview.inventoryID === Pieces.castleArchNoDoor ||
    hoveredHexForPreview.inventoryID === Pieces.castleWallCorner ||
    hoveredHexForPreview.inventoryID === Pieces.castleWallEnd ||
    hoveredHexForPreview.inventoryID === Pieces.castleWallStraight
  const isLaurWallAddon = piece?.terrain === HexTerrain.laurWallAddon
  const isSolidSubterrain = isSolidTerrainHex(piece?.terrain)
  const isFluidSubterrain = isFluidTerrainHex(piece?.terrain)
  const isLaurSquarePillarHex =
    piece.id === Pieces.laurWallSquarePillar ||
    piece.id === Pieces.laurWallPillarStackable
  const isLaurTrianglePillarHex = pieceID === Pieces.laurWallTrianglePillar
  const isPowerGlyphHex = piece?.terrain === HexTerrain.glyphPower
  const isTreasureGlyphHex = piece?.terrain === HexTerrain.glyphTreasure
  const isStartZoneHex = piece?.terrain === HexTerrain.startZone
  const isTreeHex =
    pieceID === Pieces.tree10 ||
    pieceID === Pieces.tree11 ||
    pieceID === Pieces.tree12
  const isSnowTreeHex =
    pieceID === Pieces.snowTree10 || pieceID === Pieces.snowTree12
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
  const isToxicOutcrop1Hex = pieceID === Pieces.toxicOutcrop1
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
  const isToxicOutcrop3Hex = pieceID === Pieces.toxicOutcrop3
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

  const resolvedRotation = rotationOverride ?? penModeRotation
  const ruinsOptions = getRuinsOptions(resolvedRotation)
  const pieceRotation = (resolvedRotation * -Math.PI) / 3

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
  const isFluidBeneathForLandPreview = isFluidTerrainHex(
    hoveredHexForPreview.terrain,
  )
  // Solid land can only go on a fluid hex once that fluid sits on a half level (never on
  // a whole-level fluid cap); fluid can stack on a fluid hex at any level.
  const canPlaceSolidOnFluid =
    isFluidBeneathForLandPreview &&
    !Number.isInteger(hoveredHexForPreview.altitude)
  const isUnderHexLaurPillar =
    hoveredHexForPreview.inventoryID === Pieces.laurWallSquarePillar ||
    hoveredHexForPreview.inventoryID === Pieces.laurWallPillarStackable ||
    hoveredHexForPreview.inventoryID === Pieces.laurWallTrianglePillar ||
    hoveredPiece?.inventoryID === Pieces.laurWallSquarePillar ||
    hoveredPiece?.inventoryID === Pieces.laurWallPillarStackable ||
    hoveredPiece?.inventoryID === Pieces.laurWallTrianglePillar
  const isPillarPenMode = isLaurSquarePillarHex || isLaurTrianglePillarHex
  const isMatchingPillarStackTarget = areMatchingLaurPillarShapes(
    piece.id,
    hoveredHexForPreview.inventoryID,
  )
  const canStackOnPillar =
    isPillarPenMode && isUnderHexLaurPillar && isMatchingPillarStackTarget
  const supportingPillar = canStackOnPillar
    ? boardPieces.find((bp) => bp.uid === hoveredHexForPreview.boardPieceUID)
    : undefined
  const stackPreviewHex = canStackOnPillar
    ? {
        ...hoveredHexForPreview,
        altitude: getLaurPillarStackAltitude(
          supportingPillar?.altitude ?? hoveredHexForPreview.altitude,
        ),
      }
    : null
  const stackPreviewCoords = stackPreviewHex
    ? getBoardHex3DCoords(stackPreviewHex)
    : null
  const stackPillarYOffset = canStackOnPillar ? HEXGRID_OBSTACLE_BASE_HEIGHT : 0
  const stackPreviewRotation =
    canStackOnPillar && hoveredHexForPreview?.pieceRotation !== undefined
      ? (hoveredHexForPreview.pieceRotation * -Math.PI) / 3
      : pieceRotation

  // Show land tiles: solid on solid/table/whole-level-fluid, fluid on solid/table/any fluid
  if (
    (isSolidSubterrain && (isSolidOrEmptyBeneath || canPlaceSolidOnFluid)) ||
    (isFluidSubterrain &&
      (isSolidOrEmptyBeneath || isFluidBeneathForLandPreview)) ||
    (isUnderHexCastleWallArch && piece?.terrain === HexTerrain.wallWalk)
  ) {
    return (
      <LandPieceGhost
        piece={piece}
        supportHex={hoveredHexForPreview}
        rotation={penModeRotation}
      />
    )
  }
  if (isLaurWallAddon) {
    return (
      <LaurAddonPreview
        piece={piece}
        coords={hoveredHexForPreview}
        altitude={hoveredHexForPreview.altitude}
        rotation={resolvedRotation}
        unsupported={unsupported}
      />
    )
  }
  if (isLaurSquarePillarHex && (isLandOrEmptyBeneath || canStackOnPillar)) {
    return (
      <group
        position={[
          canStackOnPillar ? (stackPreviewCoords?.x ?? x) : x,
          canStackOnPillar
            ? HEXGRID_HEX_HEIGHT +
              (stackPreviewCoords?.yWithBase ?? yWithBase) -
              stackPillarYOffset
            : (isUnderHexFluid
                ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT + HEXGRID_HEX_HEIGHT
                : yGlyph + HEXGRID_GLYPH_HEIGHT) +
              HEXGRID_HEXCAP_FLUID_HEIGHT / 2 +
              HEXGRID_HEX_HEIGHT,
          canStackOnPillar ? (stackPreviewCoords?.z ?? z) : z,
        ]}
        rotation={[0, stackPreviewRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallPillarPreview showBaseMesh={!canStackOnPillar} />
        </Suspense>
      </group>
    )
  }
  if (isLaurTrianglePillarHex && (isLandOrEmptyBeneath || canStackOnPillar)) {
    return (
      <group
        position={[
          canStackOnPillar ? (stackPreviewCoords?.x ?? x) : x,
          canStackOnPillar
            ? HEXGRID_HEX_HEIGHT +
              (stackPreviewCoords?.yWithBase ?? yWithBase) -
              stackPillarYOffset
            : (isUnderHexFluid
                ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT + HEXGRID_HEX_HEIGHT
                : yGlyph + HEXGRID_GLYPH_HEIGHT) +
              HEXGRID_HEXCAP_FLUID_HEIGHT / 2 +
              HEXGRID_HEX_HEIGHT,
          canStackOnPillar ? (stackPreviewCoords?.z ?? z) : z,
        ]}
        rotation={[0, stackPreviewRotation, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallTrianglePillarPreview
            pieceRotation={stackPreviewRotation}
            showBaseMesh={!canStackOnPillar}
          />
        </Suspense>
      </group>
    )
  }
  if (isShroudshroom7Hex && isLandOrEmptyBeneath) {
    return (
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom7 />
        </Suspense>
      </group>
    )
  }
  if (isShroudshroom10Hex && isLandOrEmptyBeneath) {
    return (
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
        <Suspense fallback={<ModelLoader />}>
          <Shroudshroom10 />
        </Suspense>
      </group>
    )
  }
  if (isShroudshroom13Hex && isLandOrEmptyBeneath) {
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
    (isGlacier1Hex ||
      isOutcrop1Hex ||
      isLavaRockOutcrop1Hex ||
      isToxicOutcrop1Hex) &&
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
            isToxic={isToxicOutcrop1Hex}
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
        position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
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
        position={[x, yWithBase + HEXGRID_HEX_HEIGHT, z]}
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
      <group position={[x, y, z]} rotation={[0, pieceRotation, 0]}>
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
  if (isStartZoneHex && isLandOrEmptyBeneath) {
    return (
      <group
        position={[x, yBase + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
      >
        <StartZone3D inventoryID={pieceID} />
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
    (isOutcrop3Hex ||
      isLavaRockOutcrop3Hex ||
      isToxicOutcrop3Hex ||
      isGlacier3Hex) &&
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
            isToxic={piece?.terrain === HexTerrain.toxicOutcrop}
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
