import type { BoardHexes, BoardPieces, CubeCoordinate, Piece } from '../types'
import { Pieces } from '../types'
import { hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import type { HexEdgeId } from './hexGrid/edgesAndNodes'
import getPieceTemplateCoords from './rotationTransforms'
import { terrainSetsByShortID } from './terrainSets'
import { piecesSoFar } from './pieces'

export type SeatedObstacleDefinition = {
  allowedBaseIDs: readonly string[]
  baseFootprint: 'six-hex' | 'same-size' | 'one-per-hex'
  defaultBaseID: string
}

type SeatedObstacleRule =
  | SeatedObstacleDefinition
  | ((setsUsed: readonly string[]) => SeatedObstacleDefinition)

const contemporaryBases = [
  Pieces.shadow1,
  Pieces.lava1,
  Pieces.toxicWater1,
] as const

const rockOutcrop3: SeatedObstacleRule = (setsUsed) => {
  const isClassicOnly =
    setsUsed.length > 0 &&
    setsUsed.every(
      (setID) =>
        terrainSetsByShortID[setID as keyof typeof terrainSetsByShortID]
          ?.era === 'classic',
    )

  return isClassicOnly
    ? {
        allowedBaseIDs: [Pieces.shadow3],
        baseFootprint: 'same-size',
        defaultBaseID: Pieces.shadow3,
      }
    : {
        allowedBaseIDs: contemporaryBases,
        baseFootprint: 'one-per-hex',
        defaultBaseID: Pieces.shadow1,
      }
}

// Virtualscape draws the hive and Marvel bases itself. Import/export work
// should restore these bases on import and skip them on export.
export const seatedObstacleTable: Record<string, SeatedObstacleRule> = {
  [Pieces.hive]: {
    allowedBaseIDs: [Pieces.swampWater6],
    baseFootprint: 'six-hex',
    defaultBaseID: Pieces.swampWater6,
  },
  [Pieces.marvel]: {
    allowedBaseIDs: [Pieces.concrete6],
    baseFootprint: 'six-hex',
    defaultBaseID: Pieces.concrete6,
  },
  [Pieces.marvelBroken]: {
    allowedBaseIDs: [Pieces.concrete6],
    baseFootprint: 'six-hex',
    defaultBaseID: Pieces.concrete6,
  },
  [Pieces.marvelNoUpper]: {
    allowedBaseIDs: [Pieces.concrete6],
    baseFootprint: 'six-hex',
    defaultBaseID: Pieces.concrete6,
  },
  [Pieces.marvelNoUpperBroken]: {
    allowedBaseIDs: [Pieces.concrete6],
    baseFootprint: 'six-hex',
    defaultBaseID: Pieces.concrete6,
  },
  [Pieces.glacier1]: {
    allowedBaseIDs: [Pieces.ice1],
    baseFootprint: 'same-size',
    defaultBaseID: Pieces.ice1,
  },
  [Pieces.glacier3]: {
    allowedBaseIDs: [Pieces.ice3],
    baseFootprint: 'same-size',
    defaultBaseID: Pieces.ice3,
  },
  [Pieces.glacier4]: {
    allowedBaseIDs: [Pieces.ice4],
    baseFootprint: 'same-size',
    defaultBaseID: Pieces.ice4,
  },
  [Pieces.glacier6]: {
    allowedBaseIDs: [Pieces.ice6],
    baseFootprint: 'six-hex',
    defaultBaseID: Pieces.ice6,
  },
  [Pieces.outcrop1]: {
    allowedBaseIDs: contemporaryBases,
    baseFootprint: 'one-per-hex',
    defaultBaseID: Pieces.shadow1,
  },
  [Pieces.outcrop3]: rockOutcrop3,
  [Pieces.lavaRockOutcrop1]: {
    allowedBaseIDs: contemporaryBases,
    baseFootprint: 'one-per-hex',
    defaultBaseID: Pieces.lava1,
  },
  [Pieces.lavaRockOutcrop3]: {
    allowedBaseIDs: contemporaryBases,
    baseFootprint: 'one-per-hex',
    defaultBaseID: Pieces.lava1,
  },
  [Pieces.toxicOutcrop1]: {
    allowedBaseIDs: contemporaryBases,
    baseFootprint: 'one-per-hex',
    defaultBaseID: Pieces.toxicWater1,
  },
  [Pieces.toxicOutcrop3]: {
    allowedBaseIDs: contemporaryBases,
    baseFootprint: 'one-per-hex',
    defaultBaseID: Pieces.toxicWater1,
  },
}

export function getSeatedObstacleDefinition(
  pieceID: string,
  setsUsed: readonly string[] = [],
): SeatedObstacleDefinition | undefined {
  const rule = seatedObstacleTable[pieceID]
  return typeof rule === 'function' ? rule(setsUsed) : rule
}

export type SeatedBasePlacement = {
  piece: Piece
  coords: CubeCoordinate
  rotation: number
}

export function getDefaultSeatedBasePlacements(
  pieceID: string,
  coords: CubeCoordinate,
  rotation: number,
  setsUsed: readonly string[] = [],
): SeatedBasePlacement[] {
  const definition = getSeatedObstacleDefinition(pieceID, setsUsed)
  const basePiece = definition && piecesSoFar[definition.defaultBaseID]
  const obstaclePiece = piecesSoFar[pieceID]
  if (!definition || !basePiece || !obstaclePiece) return []
  if (definition.baseFootprint !== 'one-per-hex') {
    return [{ piece: basePiece, coords, rotation }]
  }
  return getPieceTemplateCoords({
    clickedHex: coords,
    rotation,
    template: obstaclePiece.template,
    isVsTile: false,
  }).map((baseCoords) => ({
    piece: basePiece,
    coords: baseCoords,
    rotation: 0,
  }))
}

export type ExistingSeatedBase = {
  boardPiece: BoardPieces[number]
  surfaceAltitude: number
}

export function getExistingSeatedBases(
  pieceID: string,
  coords: CubeCoordinate,
  rotation: number,
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
  setsUsed: readonly string[] = [],
): ExistingSeatedBase[] {
  const obstaclePiece = piecesSoFar[pieceID]
  const definition = getSeatedObstacleDefinition(pieceID, setsUsed)
  if (!obstaclePiece || !definition) return []
  const obstacleCoords = getPieceTemplateCoords({
    clickedHex: coords,
    rotation,
    template: obstaclePiece.template,
    isVsTile: false,
  })
  const obstacleHexIDs = new Set(
    obstacleCoords.map((hex) => genBoardHexID({ ...hex, altitude: 0 })),
  )
  const sameSize =
    definition.baseFootprint === 'six-hex' ||
    definition.baseFootprint === 'same-size'

  return boardPieces.flatMap((boardPiece) => {
    if (!definition.allowedBaseIDs.includes(boardPiece.inventoryID)) return []
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece) return []
    const baseCoords = getFootprintCoords(piece, boardPiece)
    if (
      sameSize
        ? baseCoords.length !== obstacleCoords.length ||
          baseCoords.some(
            (hex) =>
              !obstacleHexIDs.has(genBoardHexID({ ...hex, altitude: 0 })),
          )
        : baseCoords.length !== 1 ||
          !obstacleHexIDs.has(genBoardHexID({ ...baseCoords[0], altitude: 0 }))
    ) {
      return []
    }

    const surfaceHexes = Object.values(boardHexes).filter(
      (hex) =>
        hex.boardPieceUID === boardPiece.uid &&
        !hex.isVerticalClearanceHex &&
        baseCoords.some(
          (coords) =>
            coords.q === hex.q && coords.r === hex.r && coords.s === hex.s,
        ),
    )
    const surfaceAltitude = Math.max(...surfaceHexes.map((hex) => hex.altitude))
    return Number.isFinite(surfaceAltitude)
      ? [{ boardPiece, surfaceAltitude }]
      : []
  })
}

function getFootprintCoords(piece: Piece, boardPiece: BoardPieces[number]) {
  return getPieceTemplateCoords({
    clickedHex: boardPiece.pieceCoords,
    rotation: boardPiece.rotation,
    template: piece.template,
    isVsTile: false,
  })
}

function getSeatedBaseUIDs(
  obstacle: BoardPieces[number],
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
  setsUsed: readonly string[],
) {
  const obstaclePiece = piecesSoFar[obstacle.inventoryID]
  const definition = getSeatedObstacleDefinition(obstacle.inventoryID, setsUsed)
  if (!obstaclePiece || !definition) return []
  const obstacleCoords = getFootprintCoords(obstaclePiece, obstacle)
  const obstacleHexIDs = new Set(
    obstacleCoords.map((coords) => genBoardHexID({ ...coords, altitude: 0 })),
  )
  const sameSize =
    definition.baseFootprint === 'six-hex' ||
    definition.baseFootprint === 'same-size'

  return boardPieces.flatMap((base) => {
    if (!definition.allowedBaseIDs.includes(base.inventoryID)) return []
    const basePiece = piecesSoFar[base.inventoryID]
    if (!basePiece) return []
    const baseCoords = getFootprintCoords(basePiece, base)
    if (
      sameSize
        ? baseCoords.length !== obstacleCoords.length ||
          baseCoords.some(
            (coords) =>
              !obstacleHexIDs.has(genBoardHexID({ ...coords, altitude: 0 })),
          )
        : baseCoords.length !== 1 ||
          !obstacleHexIDs.has(genBoardHexID({ ...baseCoords[0], altitude: 0 }))
    ) {
      return []
    }
    const isDirectlyUnder = baseCoords.some(
      (coords) =>
        boardHexes[genBoardHexID({ ...coords, altitude: obstacle.altitude })]
          ?.boardPieceUID === base.uid,
    )
    return isDirectlyUnder ? [base.uid] : []
  })
}

export function getSeatedGroupUIDs(
  uid: string,
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
  setsUsed: readonly string[] = [],
) {
  const matchingObstacles = boardPieces.flatMap((obstacle) => {
    if (!getSeatedObstacleDefinition(obstacle.inventoryID, setsUsed)) {
      return []
    }
    const baseUIDs = getSeatedBaseUIDs(
      obstacle,
      boardHexes,
      boardPieces,
      setsUsed,
    )
    return baseUIDs.includes(uid) || obstacle.uid === uid
      ? [{ obstacle, baseUIDs }]
      : []
  })
  if (matchingObstacles.length !== 1) return [uid]
  const match = matchingObstacles[0]
  return match ? [match.obstacle.uid, ...match.baseUIDs] : [uid]
}

export type SeatedMove = {
  uid: string
  newPieceCoords: CubeCoordinate
  newAltitude?: number
  newRotation?: number
  newEdgeId?: HexEdgeId
}

export function includeSeatedMoves(
  moves: SeatedMove[],
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
  setsUsed: readonly string[] = [],
): SeatedMove[] {
  const expanded = [...moves]
  const movesByUID = new Map(moves.map((move) => [move.uid, move]))

  for (const move of moves) {
    const groupUIDs = getSeatedGroupUIDs(
      move.uid,
      boardHexes,
      boardPieces,
      setsUsed,
    )
    const missingUIDs = groupUIDs.filter((uid) => !movesByUID.has(uid))
    if (!missingUIDs.length) continue
    const obstacle = boardPieces.find(
      (boardPiece) =>
        groupUIDs.includes(boardPiece.uid) &&
        getSeatedObstacleDefinition(boardPiece.inventoryID, setsUsed),
    )
    if (!obstacle) continue
    const obstaclePiece = piecesSoFar[obstacle.inventoryID]
    if (!obstaclePiece) continue

    const obstacleMove = movesByUID.get(obstacle.uid)
    if (obstacleMove) {
      const oldCoords = getPieceTemplateCoords({
        clickedHex: obstacle.pieceCoords,
        rotation: obstacle.rotation,
        template: obstaclePiece.template,
        isVsTile: false,
      })
      const newCoords = getPieceTemplateCoords({
        clickedHex: obstacleMove.newPieceCoords,
        rotation: obstacleMove.newRotation ?? obstacle.rotation,
        template: obstaclePiece.template,
        isVsTile: false,
      })
      const definition = getSeatedObstacleDefinition(
        obstacle.inventoryID,
        setsUsed,
      )
      for (const uid of missingUIDs) {
        const base = boardPieces.find((piece) => piece.uid === uid)
        if (!base) continue
        let newPieceCoords = obstacleMove.newPieceCoords
        let newRotation = obstacleMove.newRotation ?? obstacle.rotation
        if (definition?.baseFootprint === 'one-per-hex') {
          const index = oldCoords.findIndex(
            (coords) =>
              coords.q === base.pieceCoords.q &&
              coords.r === base.pieceCoords.r &&
              coords.s === base.pieceCoords.s,
          )
          if (index >= 0 && newCoords[index]) {
            newPieceCoords = newCoords[index]
            newRotation = base.rotation
          }
        }
        const baseMove: SeatedMove = {
          uid,
          newPieceCoords,
          newAltitude:
            (obstacleMove.newAltitude ?? obstacle.altitude) -
            (obstacle.altitude - base.altitude),
          newRotation,
        }
        expanded.push(baseMove)
        movesByUID.set(uid, baseMove)
      }
      continue
    }

    const anchor = boardPieces.find((piece) => piece.uid === move.uid)
    if (!anchor) continue
    const steps =
      ((((move.newRotation ?? anchor.rotation) - anchor.rotation) % 6) + 6) % 6
    for (const uid of missingUIDs) {
      const member = boardPieces.find((piece) => piece.uid === uid)
      if (!member) continue
      let relative = {
        q: member.pieceCoords.q - anchor.pieceCoords.q,
        r: member.pieceCoords.r - anchor.pieceCoords.r,
        s: member.pieceCoords.s - anchor.pieceCoords.s,
      }
      for (let step = 0; step < steps; step++) {
        relative = hexUtilsRotateAroundOrigin_000(relative, 1)
      }
      const memberMove: SeatedMove = {
        uid,
        newPieceCoords: {
          q: move.newPieceCoords.q + relative.q,
          r: move.newPieceCoords.r + relative.r,
          s: move.newPieceCoords.s + relative.s,
        },
        newAltitude:
          (move.newAltitude ?? anchor.altitude) +
          (member.altitude - anchor.altitude),
        newRotation: (((member.rotation + steps) % 6) + 6) % 6,
      }
      expanded.push(memberMove)
      movesByUID.set(uid, memberMove)
    }
  }
  return expanded
}
