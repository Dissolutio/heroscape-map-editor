import type { BoardPiece, BoardPieces, HexMap } from '../types'
import { Pieces } from '../types'
import { hexUtilsCubeToOddR } from '../utils/hex-utils'
import {
  getVirtualscapeLadderBattlementRotation,
  getVirtualscapeLaurRotation,
  getVirtualscapeRopeLadderAltitude,
  getVirtualscapeShieldRotation,
} from './readVirtualscapeMapFile'
import { getSeatedGroupUIDs } from './seatedObstacles'
import { isLaurPillarID } from './laurPillarStacking'
import { isPortAddonPieceID } from './portPieces'
import { piecesSoFar } from './pieces'
import { rebuildBoardStateFromPieces } from './rebuildBoardState'
import { getVirtualscapeAnchorOffset } from './rotationTransforms'
import {
  virtualscapeLaurPillarBaseName,
  virtualscapeNamedPieceNames,
  virtualscapePieceCodesByID,
} from './pieceCodes'
import { virtualscapeTileMetadata } from './virtualscapeTileMetadata'

export type SkippedPiece = {
  inventoryID: string
  title: string
}

type ExportTile = {
  type: number
  version: number
  rotation: number
  posX: number
  posY: number
  posZ: number
  glyphLetter: number
  glyphName: string
  startName: string
  color: readonly [number, number, number, number]
  virtualscapeName: string
}

const metadataByName = new Map(
  virtualscapeTileMetadata
    .filter(({ name }) => name)
    .map((metadata) => [metadata.name, metadata]),
)
const metadataByCode = new Map(
  virtualscapeTileMetadata.map((metadata) => [metadata.type, metadata]),
)
const startZoneColors = [
  [255, 0, 0, 0],
  [0, 255, 0, 0],
  [0, 0, 255, 0],
  [255, 255, 0, 0],
  [255, 0, 255, 0],
  [0, 255, 255, 0],
  [255, 128, 0, 0],
  [128, 0, 255, 0],
] as const

function getTileMetadata(inventoryID: string) {
  const name = virtualscapeNamedPieceNames[inventoryID]
  if (name) {
    const metadata = metadataByName.get(name)
    if (metadata) return metadata
  }
  const code = virtualscapePieceCodesByID[inventoryID]
  return code ? metadataByCode.get(Number(code)) : undefined
}

function getExportRotation(piece: BoardPiece) {
  if (piece.inventoryID === Pieces.deflectorShield) {
    return getVirtualscapeShieldRotation(piece.rotation)
  }
  if (
    piece.inventoryID === Pieces.ladder ||
    piece.inventoryID === Pieces.battlement
  ) {
    return getVirtualscapeLadderBattlementRotation(piece.rotation)
  }
  return getVirtualscapeLaurRotation(piece.inventoryID, piece.rotation)
}

function getVirtualscapeCoordinate(
  piece: BoardPiece,
  rotation: number,
  template: string,
) {
  const anchorOffset = getVirtualscapeAnchorOffset(template, rotation)
  return {
    q: piece.pieceCoords.q - anchorOffset.q,
    r: piece.pieceCoords.r - anchorOffset.r,
    s: piece.pieceCoords.s - anchorOffset.s,
  }
}

function createTile(
  metadata: NonNullable<ReturnType<typeof getTileMetadata>>,
  piece: BoardPiece,
  options: {
    type?: number
    rotation?: number
    altitude?: number
    startName?: string
    color?: readonly [number, number, number, number]
    virtualscapeName?: string
  } = {},
): ExportTile {
  const rotation = options.rotation ?? getExportRotation(piece)
  const virtualscapeCoordinate = getVirtualscapeCoordinate(
    piece,
    rotation,
    piecesSoFar[piece.inventoryID]?.template ?? '1',
  )
  const { x, y } = hexUtilsCubeToOddR(virtualscapeCoordinate)
  return {
    type: options.type ?? metadata.type,
    version: 0.0003,
    rotation,
    posX: x,
    posY: y,
    posZ: options.altitude ?? piece.altitude,
    glyphLetter: metadata.glyph,
    glyphName: '',
    startName: options.startName ?? '',
    color: options.color ?? metadata.color,
    virtualscapeName: options.virtualscapeName ?? metadata.name,
  }
}

export function writeVirtualscapeMap(
  hexMap: HexMap,
  boardPieces: BoardPieces,
): { buffer: ArrayBuffer; skipped: SkippedPiece[] } {
  const skippedByID = new Map<string, SkippedPiece>()
  const addSkipped = (inventoryID: string, title?: string) => {
    if (!skippedByID.has(inventoryID)) {
      skippedByID.set(inventoryID, {
        inventoryID,
        title: title ?? piecesSoFar[inventoryID]?.title ?? inventoryID,
      })
    }
  }
  const boardHexes = rebuildBoardStateFromPieces(boardPieces).boardHexes
  const marvelBaseUIDs = new Set<string>()
  for (const piece of boardPieces) {
    if (
      piece.inventoryID !== Pieces.marvel &&
      piece.inventoryID !== Pieces.marvelBroken &&
      piece.inventoryID !== Pieces.marvelNoUpper &&
      piece.inventoryID !== Pieces.marvelNoUpperBroken
    ) {
      continue
    }
    for (const uid of getSeatedGroupUIDs(piece.uid, boardHexes, boardPieces)) {
      if (uid !== piece.uid) marvelBaseUIDs.add(uid)
    }
  }

  const tiles: ExportTile[] = []
  for (const piece of boardPieces) {
    if (marvelBaseUIDs.has(piece.uid)) continue
    if (piece.inventoryID.startsWith('z')) {
      const player = Number(piece.inventoryID.slice(1))
      const color = startZoneColors[player - 1]
      const startZoneMetadata = metadataByCode.get(15001)
      if (!color || !startZoneMetadata) {
        addSkipped(piece.inventoryID)
        continue
      }
      tiles.push(
        createTile(startZoneMetadata, piece, {
          type: 15001,
          color,
        }),
      )
      continue
    }
    const metadata = getTileMetadata(piece.inventoryID)
    if (!metadata) {
      addSkipped(piece.inventoryID)
      continue
    }

    const isPillar = isLaurPillarID(piece.inventoryID)
    const hasPillarAtCoords = isPortAddonPieceID(piece.inventoryID)
      ? boardPieces.some(
          (other) =>
            isLaurPillarID(other.inventoryID) &&
            other.pieceCoords.q === piece.pieceCoords.q &&
            other.pieceCoords.r === piece.pieceCoords.r &&
            other.pieceCoords.s === piece.pieceCoords.s,
        )
      : false
    const rotation = getExportRotation(piece)
    const altitude =
      piece.inventoryID === Pieces.ropeLadder
        ? getVirtualscapeRopeLadderAltitude(piece.altitude)
        : piece.altitude + (isPillar || hasPillarAtCoords ? 1 : 0)
    tiles.push(createTile(metadata, piece, { rotation, altitude }))

    if (isPillar) {
      const baseMetadata = metadataByName.get(virtualscapeLaurPillarBaseName)
      if (baseMetadata) {
        tiles.push(
          createTile(baseMetadata, piece, {
            rotation,
            altitude: piece.altitude,
            virtualscapeName: virtualscapeLaurPillarBaseName,
          }),
        )
      }
    }
  }

  for (const marker of hexMap.objectiveMarkers ?? []) {
    if (
      marker.size !== 1 ||
      marker.content.kind !== 'number' ||
      marker.content.value < 1 ||
      marker.content.value > 6
    ) {
      addSkipped('objective-marker', 'Objective marker')
      continue
    }
    const metadata = metadataByCode.get(15100 + marker.content.value)
    if (!metadata) {
      addSkipped('objective-marker', 'Objective marker')
      continue
    }
    const { x, y } = hexUtilsCubeToOddR(marker.anchor)
    tiles.push({
      type: metadata.type,
      version: 0.0003,
      rotation: marker.rotation,
      posX: x,
      posY: y,
      posZ: marker.anchor.altitude,
      glyphLetter: metadata.glyph,
      glyphName: '',
      startName: marker.name ?? '',
      color: metadata.color,
      virtualscapeName: '',
    })
  }

  const writer = new BinaryWriter()
  writer.setFloat64(0.0007)
  writer.writeCString(hexMap.name)
  writer.writeCString(hexMap.author)
  writer.writeCString('')
  writer.writeScenario(hexMap.mapNotes ?? '')
  writer.setInt32(6)
  writer.setInt32(80)
  writer.setInt32(1)
  writer.setInt32(0)
  writer.setInt32(1)
  writer.setInt32(tiles.length)
  for (const tile of tiles) writer.writeTile(tile)
  return {
    buffer: writer.toArrayBuffer(),
    skipped: [...skippedByID.values()],
  }
}

class BinaryWriter {
  private readonly bytes: number[] = []

  setUint8(value: number) {
    this.bytes.push(value & 0xff)
  }

  setUint16(value: number) {
    this.bytes.push(value & 0xff, (value >>> 8) & 0xff)
  }

  setInt32(value: number) {
    const bytes = new Uint8Array(4)
    new DataView(bytes.buffer).setInt32(0, value, true)
    this.bytes.push(...bytes)
  }

  setFloat64(value: number) {
    const bytes = new Uint8Array(8)
    new DataView(bytes.buffer).setFloat64(0, value, true)
    this.bytes.push(...bytes)
  }

  // MFC CArchive CString: FF FE FF marks UTF-16 text (Virtualscape always
  // writes it, even for empty strings). Without it MFC reads the length as
  // a count of single-byte characters and the rest of the file misaligns.
  writeCString(value: string) {
    const length = value.length
    this.setUint8(0xff)
    this.setUint16(0xfffe)
    if (length < 0xff) {
      this.setUint8(length)
    } else {
      this.setUint8(0xff)
      if (length < 0xfffe) {
        this.setUint16(length)
      } else {
        this.setUint16(0xffff)
        this.setInt32(length)
      }
    }
    for (let index = 0; index < length; index += 1) {
      this.setUint16(value.charCodeAt(index))
    }
  }

  writeScenario(value: string) {
    const bytes = new TextEncoder().encode(value)
    this.setInt32(bytes.length)
    for (const byte of bytes) this.setUint8(byte)
  }

  writeTile(tile: ExportTile) {
    this.setInt32(tile.type)
    this.setFloat64(tile.version)
    this.setInt32(tile.rotation)
    this.setInt32(tile.posX)
    this.setInt32(tile.posY)
    this.setInt32(tile.posZ)
    this.setUint8(tile.glyphLetter)
    this.writeCString(tile.glyphName)
    this.writeCString(tile.startName)
    for (const color of tile.color) this.setUint8(color)
    if (Math.floor(tile.type / 1000) === 28) {
      this.writeCString(tile.virtualscapeName)
    }
    if (Math.floor(tile.type / 1000) === 17) {
      this.setInt32(0)
      this.writeCString('')
      this.writeCString('')
      this.writeCString('')
      this.writeCString('')
    }
    if (Math.floor(tile.type / 1000) === 18) {
      this.writeCString('')
      this.writeCString('')
    }
  }

  toArrayBuffer() {
    return Uint8Array.from(this.bytes).buffer
  }
}
