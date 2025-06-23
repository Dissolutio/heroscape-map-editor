import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { getObstaclRotation, getOptionsForBigTree, getOptionsForTreeHeight, getRuinsOptions } from './models/piece-adjustments'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HexTerrain, Pieces } from '../types'
import { LaurWallPillarPreview } from './models/LaurPillar'
import { HEXGRID_GLYPH_HEIGHT, HEXGRID_HEX_HEIGHT, HEXGRID_HEXCAP_FLUID_HEIGHT, HEXGRID_HEXCAP_FLUID_SCALE, HEXGRID_HEXCAP_HEIGHT, PIECE_PREVIEW_OPACITY } from '../utils/constants'
import { Suspense } from 'react'
import ModelLoader from './models/ModelLoader'
import { Subterrain1, Subterrain2, Subterrain24, Subterrain3, Subterrain4, Subterrain5, Subterrain6, Subterrain6B, Subterrain7, Subterrain7B, Subterrain9 } from './models/LandSubterrain'
import { hexTerrainColor } from './maphex/hexColors'
import { FLUID_CAP_OPACITY } from './maphex/instance/FluidCap'
import { GlyphModel } from './models/Glyph'
import { LaurWallTrianglePillarPreview } from './models/LaurTrianglePillar'
import ForestTree from './models/ForestTree'
import BigTree415 from './models/BigTree415'
import MarroHive6 from './models/MarroHive6'

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
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const pieceID = piece?.id ?? ''

  //EARLY RETURN:  Only show preview if hovering a valid hex and penMode is not 'select'
  if (!hoveredHex || penMode === 'select') {
    return null
  }

  const { x, y, z, yWithBase, yBase, yBaseCap, yGlyph, yGlyphFluidUnder } =
    getBoardHex3DCoords(hoveredHex)
  const isUnderHexFluid = isFluidTerrainHex(hoveredHex.terrain)

  const isSolidSubterrain = isSolidTerrainHex(piece.terrain)
  const isFluidSubterrain = isFluidTerrainHex(piece.terrain)
  const isLaurSquarePillarHex = piece.id === Pieces.laurWallPillar
  const isLaurTrianglePillarHex = pieceID === Pieces.laurWallTrianglePillar
  const isPowerGlyphHex = pieceID === Pieces.glyphPower
  const isTreasureGlyphHex = pieceID === Pieces.glyphTreasure
  const isTreeHex = pieceID === Pieces.tree10 || pieceID === Pieces.tree11 || pieceID === Pieces.tree12
  const isBigTreeHex = pieceID.endsWith(Pieces.tree415)




  const isShowEmptyHexes =
    !isTakingPicture && hoveredHex.terrain === HexTerrain.empty
  const isStartZoneHex = hoveredHex.terrain === HexTerrain.startZone
  const isHeightRingedHex = (isSolidTerrainHex(hoveredHex.terrain) && !hoveredHex.isCap) || isShowEmptyHexes
  const isObstacleHex = hoveredHex.isObstacleOrigin || hoveredHex.isObstacleAuxiliary
  const isBrushHex = piece.terrain === HexTerrain.brush
  const isPalmHex = piece.terrain === HexTerrain.palm
  const isLadderHex = piece.terrain === HexTerrain.ladder
  const isGlacier1Hex = pieceID === Pieces.glacier1
  const isOutcrop1Hex = pieceID === Pieces.outcrop1
  const isOutcrop3Hex = pieceID === Pieces.outcrop3
  const isOutcrop3BaseHex = pieceID === Pieces.outcrop3
  const isLavaRockOutcrop1Hex = pieceID === Pieces.lavaRockOutcrop1
  const isLavaRockOutcrop3Hex = pieceID === Pieces.lavaRockOutcrop3
  const isLavaRockOutcrop3BaseHex = pieceID === Pieces.lavaRockOutcrop3
  const isGlacier3Hex = pieceID === Pieces.glacier3
  const isGlacier3BaseHex = pieceID === Pieces.glacier3
  const isGlacier4Hex = pieceID === Pieces.glacier4
  const isGlacier4BaseHex = pieceID === Pieces.glacier4
  const isGlacier6Hex = pieceID === Pieces.glacier6
  const isGlacier6BaseHex = pieceID === Pieces.glacier6
  const isHiveHex = pieceID === Pieces.hive
  const isRuin2OriginHex = pieceID === Pieces.ruins2
  const isRuin3OriginHex = pieceID === Pieces.ruins3
  const isMarvelRuinOriginHex =
    (pieceID === Pieces.marvel ||
      pieceID === Pieces.marvelBroken ||
      pieceID === Pieces.marvelNoUpper ||
      pieceID === Pieces.marvelNoUpperBroken)
  const isCastleBaseEnd = pieceID === Pieces.castleBaseEnd
  const isCastleBaseStraight = pieceID === Pieces.castleBaseStraight
  const isCastleBaseCorner = pieceID === Pieces.castleBaseCorner
  const isCastleWallEnd = pieceID === Pieces.castleWallEnd
  const isCastleWallStraight = pieceID === Pieces.castleWallStraight
  const isCastleWallCorner = pieceID === Pieces.castleWallCorner
  const isCastleWall = isCastleWallEnd || isCastleWallStraight || isCastleWallCorner
  const isCastleBase = isCastleBaseEnd || isCastleBaseStraight || isCastleBaseCorner
  const isCastleArch = pieceID === Pieces.castleArch || pieceID === Pieces.castleArchNoDoor


  const ruinsOptions = getRuinsOptions(hoveredHex.pieceRotation)
  const pieceRotation = (penModeRotation * -Math.PI) / 3

  // LAND DETAILS:
  const isDirtSubterrain =
    piece.terrain === HexTerrain.grass ||
    piece.terrain === HexTerrain.sand ||
    piece.terrain === HexTerrain.rock
  const baseColor = isDirtSubterrain
    ? hexTerrainColor[HexTerrain.dirt]
    : hexTerrainColor[piece.terrain]
  const landSubterrainMaterial = () => {
    if (isHighQualityRender) {
      if (isFluidTerrainHex(piece.terrain)) {
        return (
          <meshStandardMaterial
            color={baseColor}
            transparent
            opacity={PIECE_PREVIEW_OPACITY}
          />
        )
      }
      return <meshStandardMaterial
        color={baseColor}
        transparent
        opacity={PIECE_PREVIEW_OPACITY} />
    }
    // not high quality render below
    if (isFluidTerrainHex(piece.terrain)) {
      return (
        <meshLambertMaterial
          color={baseColor}
          transparent
          opacity={FLUID_CAP_OPACITY}
        />
      )
    }
    return <meshMatcapMaterial
      color={baseColor}
      transparent
      opacity={FLUID_CAP_OPACITY}
    />
  }
  const getLandMesh = () => {
    switch (`${penModeSize}`) {
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
  const isLandBeneath = isSolidTerrainHex(hoveredHex.terrain) || isFluidTerrainHex(hoveredHex.terrain)
  const isEmptyBeneath = hoveredHex.terrain === HexTerrain.empty

  // Early Return: no piece
  if (!piece) return null
  if (isSolidSubterrain || isFluidSubterrain) {
    return (
      <group
        position={[x, yBaseCap + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, pieceRotation, 0]}
        scale={[1, isFluidSubterrain ? HEXGRID_HEXCAP_FLUID_SCALE : 1, 1]}
      >
        <Suspense fallback={<ModelLoader />}>
          {getLandMesh()}
        </Suspense>
      </group>
    )
  }
  if (isLaurSquarePillarHex && (isLandBeneath || isEmptyBeneath)) {
    return (
      <group
        position={[
          x,
          (isUnderHexFluid
            ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT
            : yGlyph + HEXGRID_GLYPH_HEIGHT - HEXGRID_HEXCAP_HEIGHT) + HEXGRID_HEXCAP_FLUID_HEIGHT / 2,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <LaurWallPillarPreview />
      </group>
    )
  }
  // TODO: Pillars: Can put some pillars onto other pillars
  if (isLaurTrianglePillarHex && (isLandBeneath || isEmptyBeneath)) {
    return (
      <group
        position={[
          x,
          (isUnderHexFluid
            ? yGlyphFluidUnder + HEXGRID_GLYPH_HEIGHT
            : yGlyph + HEXGRID_GLYPH_HEIGHT - HEXGRID_HEXCAP_HEIGHT) + HEXGRID_HEXCAP_FLUID_HEIGHT / 2,
          z,
        ]}
        rotation={[0, pieceRotation, 0]}
      >
        <LaurWallTrianglePillarPreview />
      </group>
    )
  }
  if (isTreeHex) {
    return (
      <group
        scale={[
          getOptionsForTreeHeight(pieceID).scaleX,
          getOptionsForTreeHeight(pieceID).scaleY,
          getOptionsForTreeHeight(pieceID).scaleX,
        ]}
        position={[
          x,
          yWithBase + getOptionsForTreeHeight(pieceID).y,
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
  if (isBigTreeHex) {
    return (
      <Suspense fallback={<ModelLoader />}>
        <group
          position={[
            x + getOptionsForBigTree(penModeRotation).xAdd,
            yWithBase + HEXGRID_HEX_HEIGHT,
            z + getOptionsForBigTree(penModeRotation).zAdd,
          ]}
          scale={0.038}
          rotation={[
            0,
            getOptionsForBigTree(penModeRotation).rotationY,
            0,
          ]}
        >
          <BigTree415 />
        </group>
      </Suspense>
    )
  }
  if (isHiveHex) {
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
  // if(XXX){
  //   return(

  //   )
  // }
  if (isPowerGlyphHex || isTreasureGlyphHex) {
    return (
      <group
        position={[x, isUnderHexFluid ? yGlyphFluidUnder + HEXGRID_HEXCAP_FLUID_HEIGHT : yGlyph + HEXGRID_HEX_HEIGHT, z]}
        rotation={[0, (hoveredHex.pieceRotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <GlyphModel terrain={piece.terrain} />
        </Suspense>
      </group>
    )
  }

  return (
    null
  )
}