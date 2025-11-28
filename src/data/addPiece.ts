import { clone } from 'lodash'
import {
  type AddRemovePieceError,
  type AddRemovePieceReturn,
  type BoardHexes,
  type BoardPieces,
  type CubeCoordinate,
  HexTerrain,
  type Piece,
  PiecePrefixes,
  Pieces,
} from '../types'
import {
  isBridgingObstaclePieceID,
  isFluidTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { genBoardHexID, genPieceID } from '../utils/map-utils'
import interlockRotationTemplates from './interlock-rotations'
import interlockTemplates from './interlock-templates'
import getPieceTemplateCoords from './rotationTransforms'
import {
  verticalObstructionTemplates,
  verticalSupportTemplates,
} from './vertical-obstruction-templates'

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
}: {
  piece: Piece
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  pieceCoords: CubeCoordinate
  placementAltitude: number
  rotation: number
  isVsTile: boolean
}): AddRemovePieceReturn {
  let addPieceError: AddRemovePieceError
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
  const isGlyphPiece =
    piece.terrain === HexTerrain.glyphPower ||
    piece.terrain === HexTerrain.glyphTreasure
  const isStartZonePiece = piece.terrain === HexTerrain.startZone
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
  const isLandUnderAll = underHexIds.every(
    (id) =>
      isSolidTerrainHex(newBoardHexes?.[id]?.terrain ?? '') ||
      isFluidTerrainHex(newBoardHexes?.[id]?.terrain ?? ''),
  )
  const isLadderAuxiliaryUnderAll = underHexIds.every((id) => {
    return (
      (newBoardHexes?.[id]?.terrain ?? '') === HexTerrain.ladder &&
      newBoardHexes?.[id]?.isVerticalClearanceHex === true
    )
  })
  const isEmptyUnderAll = underHexIds.every(
    (id) => (newBoardHexes?.[id]?.terrain ?? '') === HexTerrain.empty,
  )
  const isVerticalClearanceForPiece = newHexIds.every((_, i) => {
    const clearanceHexIds = Array(
      verticalObstructionTemplates?.[piece.id]?.[i] ?? piece.height,
    )
      .fill(0)
      .map((_, j) => {
        const altitude = newPieceAltitude + j
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
    ((piece.id === Pieces.laurWallSquarePillar ||
      piece.id === Pieces.laurWallTrianglePillar ||
      isGlyphPiece ||
      isStartZonePiece) &&
      isLandUnderAll) || // Laur wall pillars, and glyphs, can be placed on fluid tiles, per Renegade
    (isBridgingObstaclePieceID(piece.id) && isSolidUnderAtLeastOne) || // some multi-hex fluid-tile based obstacles (glaciers-4/6, hive) can bridge over gaps
    (isPlacingOnTable && !isGlyphPiece) // glyphs cannot go directly on table
  const isLadderPieceSupported =
    isPlacingOnTable || isSolidUnderAll || isLadderAuxiliaryUnderAll
  const isBattlementPieceSupported_true = true // TODO: validate pieces
  const isPlacingObstacle =
    piece.isObstaclePiece &&
    isSpaceFree &&
    isVerticalClearanceForPiece &&
    isObstaclePieceSupported
  const isLadderPieceID = piece.terrain === HexTerrain.ladder
  const isBattlementPieceID = piece.terrain === HexTerrain.battlement
  const isRoadWallPieceID = piece.terrain === HexTerrain.roadWall
  const isRoadWallPieceSupported_true = true // TODO: validate pieces
  const isPlacingBattlement =
    isBattlementPieceID && isBattlementPieceSupported_true
  const isPlacingRoadWall = isRoadWallPieceID && isRoadWallPieceSupported_true

  // LAUR WALL ADDONS: Autoadd piece id, render from boardPieces
  if (piece.terrain === HexTerrain.laurWallAddon) {
    try {
      // add the new laur addon piece
      newBoardPieces.push(pieceID)
    } catch (error) {
      addPieceError = { message: 'Unable to place laur wall addon', error }
    }
  }
  // ROADWALLS: Autoadd piece id, render from boardPieces
  if (isPlacingRoadWall) {
    try {
      // Add the new roadwall piece
      newBoardPieces.push(pieceID)
    } catch (error) {
      addPieceError = { message: 'Unable to place roadwall', error }
    }
  }
  // BATTLEMENTS: Autoadd piece id, render from boardPieces
  if (isPlacingBattlement) {
    try {
      // Add the new battlement piece
      newBoardPieces.push(ladderBattlementPieceID)
    } catch (error) {
      addPieceError = { message: 'Unable to place battlement', error }
    }
  }

  // ALL PIECES BELOW ARE RENDERED FROM BOARD HEXES

  // LADDERS
  if (isLadderPieceID) {
    const isPlacingLadder =
      isLadderPieceID &&
      isSpaceFree &&
      isVerticalClearanceForPiece &&
      isLadderPieceSupported
    if (isPlacingLadder) {
      newHexIds.forEach((newHexID, i) => {
        const hexUnderneath = newBoardHexes?.[underHexIds[i]]
        // remove caps covered by this obstacle
        if (newBoardHexes?.[hexUnderneath?.id]?.isCap) {
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
          pieceID: ladderBattlementPieceID,
          inventoryID: piece.id,
          pieceRotation: ladderBattlementPieceRotation,
          isObstacleOrigin: true, // ladders have one origin, and one vertical clearance auxiliary
          isObstacleAuxiliary: false,
          obstacleHeight: piece.height,
        }
        // write in the new vertical clearances, this will block some pieces at these coordinates
        Array(piece.height)
          .fill(0)
          .forEach((_, j) => {
            if (j === 0) {
              // SKIP the first hex, it's the ladder origin hex
              return
            }
            const clearanceHexAltitude = newPieceAltitude + j
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
              inventoryID: piece.id,
              pieceRotation: ladderBattlementPieceRotation,
              isObstacleOrigin: false, // ladders have one origin, and one vertical clearance auxiliary
              isObstacleAuxiliary: false,
              obstacleHeight: piece.height, // probably unused
              isVerticalClearanceHex: true, // ladders have one origin, and one vertical clearance auxiliary
            }
          })
      })
      // add the new ladder piece
      newBoardPieces.push(ladderBattlementPieceID)
    } else {
      addPieceError = { message: 'Unable to place ladder' }
    }
  }
  // RUINS / FORTIFIED WALL
  if (piece.terrain === HexTerrain.ruin || piece.terrain === HexTerrain.fortifiedWall) {
    const isSolidUnderAllSupportHexes = underHexIds.every((_, i) => {
      // Ruins only need to be supported under their center of mass, and we could be more liberal than this (allowing combinations of certain hexes)
      // See https://github.com/Dissolutio/heroscape-map-editor/issues/7
      const isRequiredToSupportThisOne =
        verticalSupportTemplates?.[piece.id]?.[i]
      return isRequiredToSupportThisOne
        ? isSolidTerrainHex(newBoardHexes?.[underHexIds[i]]?.terrain)
        : true
    })
    const isSpaceFreeForRuin = newHexIds.every((newID) => {
      // Ruins, and LaurAddons, only block at certain angles per rotation, unlike obstacles that block everything
      // Here is where we calculate our Ruin we are placing versus the ruin on the hex, can they co-exist?
      const hex = newBoardHexes?.[newID]
      if (!hex) return true
      const terrain = hex?.terrain
      const isBlocked =
        isSolidTerrainHex(terrain) ||
        isFluidTerrainHex(terrain) ||
        hex.isObstacleOrigin
      // (isForNewInterior && hex.isObstacleAuxiliary)
      return !isBlocked
    })

    const isPlacingRuin =
      isSpaceFreeForRuin &&
      isSolidUnderAllSupportHexes &&
      isVerticalClearanceForPiece
    if (isPlacingRuin) {
      newHexIds.forEach((newHexID, i) => {
        const isObstacleOrigin = i === 0 // hacking off the template order, should be 0 but we shift the template for ruins, (because then the wallWalk template handily matches the vertical clearance of a ruin)
        const isObstacleAuxiliary = i > 0

        // write in vertical clearances for all the hexes a ruin borders
        // these are writing inside the loop for all ground-level hexes
        Array(verticalObstructionTemplates?.[piece.id]?.[i] ?? piece.height)
          .fill(0)
          .forEach((_, j) => {
            if (j === 0) {
              // SKIP the first hex, it's the obstacle origin/auxiliary hex
              return
            }
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
                inventoryID: piece.id,
                pieceRotation: rotation,
                isVerticalClearanceHex: true,
              }
            }
          })

        // write in the new ruin hex origin and auxiliary
        newBoardHexes[newHexID] = {
          id: newHexID,
          q: piecePlaneCoords[i].q,
          r: piecePlaneCoords[i].r,
          s: piecePlaneCoords[i].s,
          altitude: newPieceAltitude,
          terrain: piece.terrain,
          pieceID,
          inventoryID: piece.id,
          pieceRotation: rotation,
          isObstacleOrigin: isObstacleOrigin,
          isObstacleAuxiliary,
        }
      })
      // add the new piece
      newBoardPieces.push(pieceID)
    } else {
      if (!isSpaceFreeForRuin) {
        addPieceError = { message: 'Not enough space for ruin' }
      }
      if (!isSolidUnderAllSupportHexes) {
        addPieceError = {
          message: 'Ruins need solid ground under their three central hexes',
        }
      }
      if (!isVerticalClearanceForPiece) {
        addPieceError = { message: 'Not enough vertical clearance for ruins' }
      }
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
        newBoardHexes[hexUnderneath.id].isCap = false
        newBoardHexes[newHexID] = {
          id: newHexID,
          q: piecePlaneCoords[i].q,
          r: piecePlaneCoords[i].r,
          s: piecePlaneCoords[i].s,
          altitude: newPieceAltitude,
          terrain: piece.terrain,
          pieceID,
          inventoryID: piece.id,
          pieceRotation: rotation,
          isObstacleOrigin: true,
        }
      })
    } else {
      if (!isSpaceFree) {
        addPieceError = { message: 'No space free for castle base' }
      }
      if (!isCastleBaseSupported) {
        addPieceError = { message: 'Castle base is not supported there' }
      }
    }
    // add the new piece
    newBoardPieces.push(pieceID)
  }
  // CASTLE ARCH (no error reporting)
  if (isCastleArchPiece) {
    const isSolidUnder2OuterHexes = underHexIds.every(
      (id, i) =>
        i === 1 ? true : isSolidTerrainHex(newBoardHexes?.[id]?.terrain ?? ''),
      // i=0, i=2, those are the 2 "outer" hexes of the 3-hex arch
    )
    const isCastleArchSupported = isSolidUnder2OuterHexes || isEmptyUnderAll
    const isPlacingCastleArch =
      isCastleArchPiece &&
      isCastleArchSupported &&
      isSpaceFree &&
      isVerticalClearanceForPiece
    if (isPlacingCastleArch) {
      newHexIds.forEach((newHexID, i) => {
        const hexUnderneath = newBoardHexes?.[underHexIds[i]]
        const obstacleHeight = piece.height
        // remove the cap from land hex below
        newBoardHexes[hexUnderneath.id].isCap = false
        newBoardHexes[newHexID] = {
          id: newHexID,
          q: piecePlaneCoords[i].q,
          r: piecePlaneCoords[i].r,
          s: piecePlaneCoords[i].s,
          altitude: newPieceAltitude,
          terrain: piece.terrain,
          pieceID,
          inventoryID: piece.id,
          pieceRotation: rotation,
          isObstacleOrigin: i === 0, // The first boardHex is marked to render the obstacle model
          isObstacleAuxiliary: i !== 0,
          obstacleHeight,
        }

        // vertical clearances
        Array(obstacleHeight)
          .fill(0)
          .forEach((_, j) => {
            // For some reason castle walls don't ignore the first one, perhaps accounted for upstream
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
              inventoryID: piece.id,
              pieceRotation: rotation,
              isVerticalClearanceHex: true,
            }
          })
      })
      // add the new piece
      newBoardPieces.push(pieceID)
    }
  }
  // CASTLE WALL (no error reporting)
  if (isCastleWallPiece) {
    const isCastleUnderAll = underHexIds.every(
      (id) =>
        newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleBase) ||
        newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleWall) ||
        newBoardHexes?.[id]?.pieceID.includes(PiecePrefixes.castleArch),
    )
    const isCastleWallSupported =
      isSolidUnderAll || isEmptyUnderAll || isCastleUnderAll
    const isPlacingCastleWall =
      isCastleWallPiece &&
      isCastleWallSupported &&
      isSpaceFree &&
      isVerticalClearanceForPiece
    if (isPlacingCastleWall) {
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
            inventoryID: piece.id,
            pieceRotation: rotation,
            isObstacleOrigin: i === 0, // first hex marks the wall/arch model
            isObstacleAuxiliary: i !== 0, // arches have 2 aux hexes that render only an under-hex-cap
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
            inventoryID: piece.id,
            pieceRotation: rotation,
            isObstacleOrigin: i === 0, // The first boardHex is marked to render the obstacle model
            isObstacleAuxiliary: i !== 0,
            obstacleHeight,
          }
        }

        // vertical clearances will be adjusted to start lower if placing on a base
        Array(obstacleHeight)
          .fill(0)
          .forEach((_, j) => {
            // For some reason castle walls don't ignore the first one, perhaps accounted for upstream
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
              inventoryID: piece.id,
              pieceRotation: rotation,
              isVerticalClearanceHex: true,
            }
          })
      })
      // add the new piece
      newBoardPieces.push(pieceID)
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
        inventoryID: piece.id,
        pieceRotation: rotation,
        isCap: !isSolidAbove,
        isObstacleOrigin: iForEach === 0, // mark subterrain origin hex
        isObstacleAuxiliary: iForEach !== 0, // mark non-origin hex
      }
    })
    // add the new piece
    newBoardPieces.push(pieceID)
  }
  // OBSTACLES: trees, bushes, palms, glaciers, outcrops, laurPillar
  if (isPlacingObstacle) {
    newHexIds.forEach((newHexID, i) => {
      const hexUnderneath = newBoardHexes?.[underHexIds[i]]
      // remove caps covered by this obstacle
      if (hexUnderneath) {
        newBoardHexes[hexUnderneath.id].isCap = false
      }
      // write in the new base level hexes (origin+auxiliaries)
      newBoardHexes[newHexID] = {
        id: newHexID,
        q: piecePlaneCoords[i].q,
        r: piecePlaneCoords[i].r,
        s: piecePlaneCoords[i].s,
        altitude: newPieceAltitude,
        terrain: piece.terrain,
        pieceID,
        inventoryID: piece.id,
        pieceRotation: rotation,
        isObstacleOrigin: i === 0, //only the first hex is an origin (because we made the template arrays this way. with origin hex at index 0)
        isObstacleAuxiliary: i !== 0, // big tree, glaciers/outcrops, have aux hexes that render only a cap
        obstacleHeight: piece.height,
      }
      //  if we have a vertical obstruction template for an obstacle, use it, otherwise use its height
      if (verticalObstructionTemplates[piece.id]) {
        try {
          // write in vertical clearances for the different parts of obstacle
          Array(verticalObstructionTemplates[piece.id][i])
            .fill(0)
            .forEach((_, j) => {
              if (j === 0) {
                // SKIP the first hex, it's the obstacle origin/auxiliary hex
                return
              }
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
                  inventoryID: piece.id,
                  pieceRotation: rotation,
                  isVerticalClearanceHex: true,
                }
              }
            })
        } catch (error) {
          addPieceError = {
            message: 'Failed to fill out vertical obstruction for obstacle',
            error,
          }
        }
      } else {
        try {
          // write in the new vertical clearances, this will block some pieces at these coordinates
          Array(piece.height)
            .fill(0)
            .forEach((_, j) => {
              if (j === 0) {
                // SKIP the first hex, it's the obstacle origin/auxiliary hex
                return
              }
              const clearanceHexAltitude = newPieceAltitude + j
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
                inventoryID: piece.id,
                pieceRotation: rotation,
                isVerticalClearanceHex: true,
              }
            })
        } catch (error) {
          addPieceError = {
            message: 'Failed placing vertical clearance for obstacle',
            error,
          }
        }
      }
    })

    // add the new piece
    newBoardPieces.push(pieceID)
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
            inventoryID: piece.id,
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
        addPieceError = { message: 'Could not place land tile', error }
      }
      // add the new piece
      newBoardPieces.push(pieceID)
    }
  }
  return { newBoardHexes, newBoardPieces, error: addPieceError }
}
