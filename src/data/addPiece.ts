import { clone } from 'lodash'
import {
  AddRemovePieceError,
  BoardHexes,
  BoardPieces,
  CubeCoordinate,
  HexTerrain,
  Piece,
  PiecePrefixes,
  Pieces,
} from '../types'
import {
  isBridgingObstaclePieceID,
  isFluidTerrainHex,
  isObstaclePieceID,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { genBoardHexID, genPieceID } from '../utils/map-utils'
import interlockRotationTemplates from './interlock-rotations'
import interlockTemplates from './interlock-templates'
import getPieceTemplateCoords from './rotationTransforms'
import {
  interiorHexTemplates,
  verticalObstructionTemplates,
  verticalSupportTemplates,
} from './ruins-templates'

export type PieceAddArgs = {
  piece: Piece
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  pieceCoords: CubeCoordinate
  placementAltitude: number
  rotation: number
  isVsTile: boolean
}
export type AddRemovePieceReturn = {
  newBoardHexes: BoardHexes
  newBoardPieces: BoardPieces
  error: AddRemovePieceError
}

export function addPiece({
  // state to mutate and return
  boardHexes,
  boardPieces,
  // input
  piece,
  pieceCoords,
  placementAltitude,
  rotation,
  isVsTile,
}: PieceAddArgs): AddRemovePieceReturn {
  let error: AddRemovePieceError
  const newBoardHexes = clone(boardHexes)
  const newBoardPieces = clone(boardPieces)
  const piecePlaneCoords = getPieceTemplateCoords({
    clickedHex: { q: pieceCoords.q, r: pieceCoords.r, s: pieceCoords.s },
    rotation,
    template: piece.template,
    isVsTile,
  })
  const originOfTile = isVsTile ? piecePlaneCoords[0] : pieceCoords // vs moves it around per rotation, our app will probably not
  const pieceHexID = genBoardHexID({
    ...originOfTile,
    altitude: placementAltitude,
  })
  const pieceID = genPieceID(pieceHexID, piece.id, rotation)
  const ladderBattlementPieceRotation = isVsTile
    ? (rotation + 5) % 6
    : rotation % 6 // VS starts ladders at rotation 5 (top-right, NE), instead of 0 (right, E)
  const ladderBattlementPieceID = genPieceID(
    pieceHexID,
    piece.id,
    ladderBattlementPieceRotation,
  )
  const newPieceAltitude = placementAltitude + 1
  const underHexIds = piecePlaneCoords.map((cubeCoord) =>
    genBoardHexID({ ...cubeCoord, altitude: placementAltitude }),
  )
  const newHexIds = piecePlaneCoords.map((cubeCoord) =>
    genBoardHexID({ ...cubeCoord, altitude: newPieceAltitude }),
  )
  const overHexIds = piecePlaneCoords.map((cubeCoord) =>
    genBoardHexID({ ...cubeCoord, altitude: newPieceAltitude + 1 }),
  )
  const isCastleWallPiece = piece.id.includes(PiecePrefixes.castleWall)
  const isCastleArchPiece =
    piece.id === Pieces.castleArch || piece.id === Pieces.castleArchNoDoor
  // Validate
  const isPlacingOnTable = underHexIds.every(
    (id) => (newBoardHexes?.[id]?.terrain ?? '') === HexTerrain.empty,
  )
  const isSpaceFree = newHexIds.every((id) => !newBoardHexes[id])
  const isSolidUnderAtLeastOne = underHexIds.some(
    (id) =>
      isSolidTerrainHex(newBoardHexes?.[id]?.terrain ?? '') ||
      newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleBase),
  )
  const isSolidUnderAll = underHexIds.every((id) =>
    isSolidTerrainHex(newBoardHexes?.[id]?.terrain ?? ''),
  )
  const isLadderAuxiliaryUnderAll = underHexIds.every(
    (id) =>
      (newBoardHexes?.[id]?.terrain ?? '') === HexTerrain.ladder &&
      newBoardHexes?.[id]?.isObstacleAuxiliary === true,
  )
  const isEmptyUnderAll = underHexIds.every(
    (id) => (newBoardHexes?.[id]?.terrain ?? '') === HexTerrain.empty,
  )
  const isVerticalClearanceForPiece = newHexIds.every((_, i) => {
    const clearanceHexIds = Array(
      verticalObstructionTemplates?.[piece.id]?.[i] ?? piece.height,
    )
      .fill(0)
      .map((_, j) => {
        const altitude = newPieceAltitude + 1 + j
        return genBoardHexID({ ...piecePlaneCoords[i], altitude })
      })
    return clearanceHexIds.every((clearanceHexId) => {
      const hex = newBoardHexes?.[clearanceHexId]
      if (!hex) return true // if no boardHex is written, then it is definitely empty
      const terrain = hex?.terrain
      const isBlocked = isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)
      return !isBlocked
    })
  })
  const isCastleWallUnder = underHexIds.some(
    (id) => newBoardHexes?.[id]?.terrain === HexTerrain.castle,
  )
  const isPlacingWallWalkOnWall =
    piece.terrain === HexTerrain.wallWalk && isSpaceFree && isCastleWallUnder
  const isPlacingLandTile =
    (isFluidTerrainHex(piece.terrain) || isSolidTerrainHex(piece.terrain)) &&
    !isPlacingWallWalkOnWall
  // isObstaclePieceSupported: EXCEPTION MADE FOR OBSTACLES WITH FLUID BASES, THEY CAN BRIDGE
  const isObstaclePieceSupported =
    isSolidUnderAll ||
    (isBridgingObstaclePieceID(piece.id) && isSolidUnderAtLeastOne) ||
    isPlacingOnTable
  const isLadderPieceSupported = isSolidUnderAll || isLadderAuxiliaryUnderAll
  const isBattlementPieceSupported_TODO = true // TODO: compute
  const isPlacingObstacle =
    isObstaclePieceID(piece.id) &&
    isSpaceFree &&
    isVerticalClearanceForPiece &&
    isObstaclePieceSupported
  const isLadderPieceID = piece.terrain === HexTerrain.ladder
  const isPlacingLadder =
    isLadderPieceID &&
    isSpaceFree &&
    isVerticalClearanceForPiece &&
    isLadderPieceSupported
  const isBattlementPieceID = piece.terrain === HexTerrain.battlement
  const isRoadWallPieceID = piece.terrain === HexTerrain.roadWall
  const isRoadWallPieceSupported_TODO = true // TODO: compute
  const isPlacingBattlement =
    isBattlementPieceID && isBattlementPieceSupported_TODO
  const isPlacingRoadWall = isRoadWallPieceID && isRoadWallPieceSupported_TODO

  // LAUR WALL ADDONS: Autoadd piece id, render from boardPieces
  if (
    piece.terrain === HexTerrain.laurWall &&
    piece.id !== Pieces.laurWallPillar
  ) {
    // write the new laur addon piece
    newBoardPieces[pieceID] = piece.id
  }
  // ROADWALLS: Autoadd piece id, render from boardPieces
  if (isPlacingRoadWall) {
    try {
      // Battlements are just going to write piece ID, no matter what, and we will render from that
      // write the new battlement piece
      newBoardPieces[pieceID] = piece.id
    } catch (error) {
      console.log('Error placing roadwall piece error:', error)
    }
  }
  // BATTLEMENTS: Autoadd piece id, render from boardPieces
  if (isPlacingBattlement) {
    try {
      // Battlements are just going to write piece ID, no matter what, and we will render from that
      // write the new battlement piece
      newBoardPieces[ladderBattlementPieceID] = piece.id
    } catch (error) {
      console.log('Error placing battlement piece:', error)
    }
  }

  // ALL PIECES BELOW ARE RENDERED FROM BOARD HEXES

  // LADDERS
  if (isPlacingLadder) {
    // const vertices = [ladderPieceRotation + 2, ladderPieceRotation + 3]
    // const buddyHex = genBoardHexID({ ...hexUtilsAdd(pieceCoords, hexUtilsGetNeighborForRotation(ladderPieceRotation)), altitude: newPieceAltitude })
    try {
      newHexIds.forEach((newHexID, i) => {
        // const hexUnderneath = newBoardHexes?.[underHexIds[i]]
        // remove caps covered by this obstacle
        // newBoardHexes[hexUnderneath.id].isCap = false
        // write in the new hex
        newBoardHexes[newHexID] = {
          id: newHexID,
          q: piecePlaneCoords[i].q,
          r: piecePlaneCoords[i].r,
          s: piecePlaneCoords[i].s,
          altitude: newPieceAltitude,
          terrain: piece.terrain,
          pieceID: ladderBattlementPieceID,
          pieceRotation: ladderBattlementPieceRotation,
          isObstacleOrigin: true, // ladders have one origin, and one vertical clearance auxiliary
          isObstacleAuxiliary: false,
          obstacleHeight: piece.height,
        }
        // write in the new vertical clearances, this will block some pieces at these coordinates
        Array(piece.height)
          .fill(0)
          .forEach((_, j) => {
            const clearanceHexAltitude = newPieceAltitude + 1 + j
            const clearanceID = genBoardHexID({
              ...piecePlaneCoords[i],
              altitude: clearanceHexAltitude,
            })
            newBoardHexes[clearanceID] = {
              id: clearanceID,
              q: piecePlaneCoords[i].q,
              r: piecePlaneCoords[i].r,
              s: piecePlaneCoords[i].s,
              altitude: clearanceHexAltitude,
              terrain: piece.terrain,
              pieceID: ladderBattlementPieceID,
              pieceRotation: ladderBattlementPieceRotation,
              isObstacleOrigin: false, // ladders have one origin, and one vertical clearance auxiliary
              isObstacleAuxiliary: false,
              obstacleHeight: piece.height, // probably unused
              isVerticalClearanceHex: true // ladders have one origin, and one vertical clearance auxiliary
            }
          })
      })

      // write the new ladder piece
      newBoardPieces[ladderBattlementPieceID] = piece.id
    } catch (error) {
      console.log('🚀 ~ placing ladder piece error:', error)
    }
  }
  // RUINS
  if (piece.terrain === HexTerrain.ruin) {
    const isSolidUnderAllSupportHexes = underHexIds.every((_, i) => {
      // Ruins only need to be supported under their center of mass, and we could be more liberal than this (allowing combinations of certain hexes)
      // See https://github.com/Dissolutio/heroscape-map-editor/issues/7
      const isRequiredToSupportThisOne =
        verticalSupportTemplates?.[piece.id]?.[i]
      return isRequiredToSupportThisOne
        ? isSolidTerrainHex(newBoardHexes?.[underHexIds[i]]?.terrain)
        : true
    })
    const isSpaceFreeForRuin = newHexIds.every((newID, i) => {
      // Ruins, and LaurAddons, only block at certain angles per rotation, unlike obstacles that block everything
      // Here is where we calculate our Ruin we are placing versus the ruin on the hex, can they co-exist?
      const hex = newBoardHexes?.[newID]
      if (!hex) return true
      const terrain = hex?.terrain
      const isForNewInterior = interiorHexTemplates?.[piece.id]?.[i] > 0 // origin & aux hexes
      const isBlocked =
        isSolidTerrainHex(terrain) ||
        isFluidTerrainHex(terrain) ||
        (isForNewInterior && hex.isObstacleOrigin)
      // ||
      // (isForNewInterior && hex.isObstacleAuxiliary)
      return !isBlocked
    })

    const isPlacingRuin =
      isSpaceFreeForRuin &&
      isSolidUnderAllSupportHexes &&
      isVerticalClearanceForPiece
    if (isPlacingRuin) {
      newHexIds.forEach((newHexID, i) => {
        const isObstacleAuxiliary = interiorHexTemplates[piece.id][i] === 1 // 1 marks auxiliary hexes, 2 marks the origin, in these template arrays
        const isPieceOrigin = i === 0 // hacking off the template order, should be 0 but we shift the template for ruins, (because then the wallWalk template handily matches the vertical clearance of a ruin)

        // write in vertical clearances for all the hexes a ruin borders
        Array(verticalObstructionTemplates[piece.id][i])
          .fill(0)
          .forEach((_, j) => {
            const clearanceHexAltitude = newPieceAltitude + j
            const clearanceID = genBoardHexID({
              ...piecePlaneCoords[i],
              altitude: clearanceHexAltitude,
            })
            if (!newBoardHexes[clearanceID]) {
              // BUGFIX: only write in vertical clearance if nothing is already there? But...this seems an incomplete solution
              newBoardHexes[clearanceID] = {
                id: clearanceID,
                q: piecePlaneCoords[i].q,
                r: piecePlaneCoords[i].r,
                s: piecePlaneCoords[i].s,
                altitude: clearanceHexAltitude,
                terrain: piece.terrain,
                pieceID,
                pieceRotation: rotation,
                isVerticalClearanceHex: true
              }
            }
          })

        // write in the new ruin hex only for one, the one that will get drawn, all the rest are simply marked as occupied
        if (isPieceOrigin) {
          newBoardHexes[newHexID] = {
            id: newHexID,
            q: piecePlaneCoords[i].q,
            r: piecePlaneCoords[i].r,
            s: piecePlaneCoords[i].s,
            altitude: newPieceAltitude,
            terrain: piece.terrain,
            pieceID,
            pieceRotation: rotation,
            isObstacleOrigin: true,
          }
        }
        if (isObstacleAuxiliary) {
          newBoardHexes[newHexID] = {
            id: newHexID,
            q: piecePlaneCoords[i].q,
            r: piecePlaneCoords[i].r,
            s: piecePlaneCoords[i].s,
            altitude: newPieceAltitude,
            terrain: piece.terrain,
            pieceID,
            pieceRotation: rotation,
            isObstacleOrigin: false,
            isObstacleAuxiliary: true,
          }
        }
      })
      // write the new piece
      newBoardPieces[pieceID] = piece.id
    }
  }

  // CASTLE BASE
  if (piece.id.includes(PiecePrefixes.castleBase)) {
    const isCastleBaseSupported = isPlacingOnTable || isSolidUnderAtLeastOne // castle bases are all 1-hex, currently
    const isPlacingCastleBase = isSpaceFree && isCastleBaseSupported
    if (isPlacingCastleBase) {
      newHexIds.forEach((newHexID, i) => {
        const hexUnderneath = newBoardHexes?.[underHexIds[i]]
        const isSolidUnderneath = isSolidTerrainHex(hexUnderneath?.terrain)
        if (isSolidUnderneath || isPlacingOnTable) {
          // covers up the cap below
          // remove old cap
          newBoardHexes[hexUnderneath.id].isCap = false
        }
        newBoardHexes[newHexID] = {
          id: newHexID,
          q: piecePlaneCoords[i].q,
          r: piecePlaneCoords[i].r,
          s: piecePlaneCoords[i].s,
          altitude: newPieceAltitude,
          terrain: piece.terrain,
          pieceID,
          pieceRotation: rotation,
        }
      })
      // write the new piece
      newBoardPieces[pieceID] = piece.id
    }
  }
  // CASTLE WALL / ARCH
  if (isCastleWallPiece || isCastleArchPiece) {
    const isCastleUnderAll = underHexIds.every(
      (id) =>
        newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleBase) ||
        newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleWall) ||
        newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleArch),
    )
    const isCastleWallSupported =
      isSolidUnderAll || isEmptyUnderAll || isCastleUnderAll
    const isSolidUnder2OuterHexes = underHexIds.every(
      (id, i) =>
        i === 1 ? true : isSolidTerrainHex(newBoardHexes?.[id]?.terrain ?? ''),
      // i=0, i=2, those are the 2 "outer" hexes of the 3-hex arch
    )
    const isCastleArchSupported = isSolidUnder2OuterHexes || isEmptyUnderAll
    const isPlacingCastleWallOrCastleArch =
      ((isCastleArchPiece && isCastleArchSupported) ||
        (isCastleWallPiece && isCastleWallSupported)) &&
      isSpaceFree &&
      isVerticalClearanceForPiece
    if (isPlacingCastleWallOrCastleArch) {
      newHexIds.forEach((newHexID, i) => {
        const hexUnderneath = newBoardHexes?.[underHexIds[i]]
        const isHexUnderneathCastleBase = hexUnderneath?.pieceID.includes(
          PiecePrefixes.castleBase,
        )
        const wallAltitude = isHexUnderneathCastleBase
          ? placementAltitude
          : newPieceAltitude
        const obstacleHeight =
          piece.height -
          (isHexUnderneathCastleBase || isSolidUnderAll || isEmptyUnderAll
            ? 0
            : 1)
        if (isHexUnderneathCastleBase) {
          /* 
           A naked castle-base (which is rare and weird) is a piece we track.
           But once a wall is placed on the base, we only track the wall piece, and overwrite the base piece.
           */
          newBoardHexes[hexUnderneath.id] = {
            id: hexUnderneath.id,
            q: piecePlaneCoords[i].q,
            r: piecePlaneCoords[i].r,
            s: piecePlaneCoords[i].s,
            altitude: wallAltitude,
            terrain: piece.terrain,
            pieceID,
            pieceRotation: rotation,
            isObstacleOrigin: i === 0 ? true : false, // first hex marks the wall/arch model
            isObstacleAuxiliary: i !== 0 ? true : false, // arches have 2 aux hexes that render only an under-hex-cap
            obstacleHeight,
          }
        } else {
          // remove the cap from land hex below
          newBoardHexes[hexUnderneath.id].isCap = false
          newBoardHexes[newHexID] = {
            id: newHexID,
            q: piecePlaneCoords[i].q,
            r: piecePlaneCoords[i].r,
            s: piecePlaneCoords[i].s,
            altitude: wallAltitude,
            terrain: piece.terrain,
            pieceID,
            pieceRotation: rotation,
            isObstacleOrigin: i === 0 ? true : false, // The first boardHex is marked to render the obstacle model
            isObstacleAuxiliary: i !== 0 ? true : false,
            obstacleHeight,
          }
        }

        // vertical clearances will be adjusted to start lower if placing on a base
        Array(obstacleHeight)
          .fill(0)
          .forEach((_, j) => {
            const clearanceHexAltitude = wallAltitude + 1 + j
            const clearanceID = genBoardHexID({
              ...piecePlaneCoords[i],
              altitude: clearanceHexAltitude,
            })
            newBoardHexes[clearanceID] = {
              id: clearanceID,
              q: piecePlaneCoords[i].q,
              r: piecePlaneCoords[i].r,
              s: piecePlaneCoords[i].s,
              altitude: clearanceHexAltitude,
              terrain: piece.terrain,
              pieceID,
              pieceRotation: rotation,
              isVerticalClearanceHex: true
            }
          })
      })
      // write the new piece
      newBoardPieces[pieceID] = piece.id
    }
  }
  // WALLWALK ONTO WALL
  if (isPlacingWallWalkOnWall) {
    newHexIds.forEach((newHexID, iForEach) => {
      const hexAbove = newBoardHexes?.[overHexIds[iForEach]]
      const isSolidAbove = isSolidTerrainHex(hexAbove?.terrain)
      newBoardHexes[newHexID] = {
        id: newHexID,
        q: piecePlaneCoords[iForEach].q,
        r: piecePlaneCoords[iForEach].r,
        s: piecePlaneCoords[iForEach].s,
        altitude: newPieceAltitude,
        terrain: piece.terrain,
        pieceID,
        pieceRotation: rotation,
        isCap: !isSolidAbove,
        isObstacleOrigin: iForEach === 0, // mark subterrain origin hex
        isObstacleAuxiliary: iForEach !== 0, // mark non-origin hex
      }
    })
    // write the new piece
    newBoardPieces[pieceID] = piece.id
  }
  // OBSTACLES: trees, bushes, palms, glaciers, outcrops, laurPillar
  if (isPlacingObstacle) {
    newHexIds.forEach((newHexID, i) => {
      const hexUnderneath = newBoardHexes?.[underHexIds[i]]
      // remove caps covered by this obstacle
      if (hexUnderneath) {
        newBoardHexes[hexUnderneath.id].isCap = false
      }
      // write in the new hex
      newBoardHexes[newHexID] = {
        id: newHexID,
        q: piecePlaneCoords[i].q,
        r: piecePlaneCoords[i].r,
        s: piecePlaneCoords[i].s,
        altitude: newPieceAltitude,
        terrain: piece.terrain,
        pieceID,
        pieceRotation: rotation,
        isObstacleOrigin: i === 0 ? true : false, //only the first hex is an origin (because we made the template arrays this way. with origin hex at index 0)
        isObstacleAuxiliary: i !== 0 ? true : false, // big tree, glaciers/outcrops, have aux hexes that render only a cap
        obstacleHeight: piece.height,
      }
      // write in the new vertical clearances, this will block some pieces at these coordinates
      Array(piece.height)
        .fill(0)
        .forEach((_, j) => {
          const clearanceHexAltitude = newPieceAltitude + 1 + j
          const clearanceID = genBoardHexID({
            ...piecePlaneCoords[i],
            altitude: clearanceHexAltitude,
          })
          newBoardHexes[clearanceID] = {
            id: clearanceID,
            q: piecePlaneCoords[i].q,
            r: piecePlaneCoords[i].r,
            s: piecePlaneCoords[i].s,
            altitude: clearanceHexAltitude,
            terrain: piece.terrain,
            pieceID,
            pieceRotation: rotation,
            isVerticalClearanceHex: true
          }
        })
    })

    // write the new piece
    newBoardPieces[pieceID] = piece.id
  }
  // LAND
  if (isPlacingLandTile) {
    // castle-wallwalk placed here as normal land
    const isLandPieceSupported = isPlacingOnTable || isSolidUnderAtLeastOne
    if (isSpaceFree && isLandPieceSupported) {
      try {
        newHexIds.forEach((newHexID, iForEach) => {
          const hexUnderneath = newBoardHexes?.[underHexIds[iForEach]]
          const hexAbove = newBoardHexes?.[overHexIds[iForEach]]
          const isSolidAbove = isSolidTerrainHex(hexAbove?.terrain)
          const isSolidUnderneath = isSolidTerrainHex(hexUnderneath?.terrain)
          if (isSolidUnderneath || isPlacingOnTable) {
            // solids and fluids can replace the cap below
            // remove cap beneath this land hex
            newBoardHexes[hexUnderneath.id].isCap = false
          }

          newBoardHexes[newHexID] = {
            id: newHexID,
            q: piecePlaneCoords[iForEach].q,
            r: piecePlaneCoords[iForEach].r,
            s: piecePlaneCoords[iForEach].s,
            altitude: newPieceAltitude,
            terrain: piece.terrain,
            pieceID,
            pieceRotation: rotation,
            isCap: !isSolidAbove, // not a cap if solid hex directly above
            isObstacleOrigin: iForEach === 0, // mark subterrain origin hex
            isObstacleAuxiliary: iForEach !== 0, // mark non-origin hex
            interlockType: interlockTemplates[piece.template][iForEach],
            interlockRotation:
              interlockRotationTemplates[piece.template][iForEach],
          }
        })
      } catch (error) {
        console.log('🚀 ~ newHexIds.forEach ~ error:', error)
      }
      // write the new piece
      newBoardPieces[pieceID] = piece.id
    }
  }
  return { newBoardHexes, newBoardPieces, error }
}
