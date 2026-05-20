import { pieceCodes } from './pieceCodes'
import { getVSTilePlacementOffset } from './rotationTransforms'
import { hexUtilsCubeToOddR } from '../utils/hex-utils'
import { piecesSoFar } from './pieces'
import type { BoardPiece, BoardPieces, HexMap, VirtualScapeMap, VirtualScapeTile } from '../types'
import { Pieces } from '../types'

const isLittleEndian = true
const virtualScapeVersion = 0.0007
const virtualScapeTileVersion = 0.0003
const defaultTileColor = 'rgba(0,160,0,0)'
const defaultGlyphLetter = 'T'

let offset = 0

const startZoneColorByInventoryID: Record<string, string> = {
  [Pieces.startZone1]: 'rgba(255,0,0,0)',
  [Pieces.startZone2]: 'rgba(0,255,0,0)',
  [Pieces.startZone3]: 'rgba(0,0,255,0)',
  [Pieces.startZone4]: 'rgba(255,255,0,0)',
  [Pieces.startZone5]: 'rgba(255,0,255,0)',
  [Pieces.startZone6]: 'rgba(0,255,255,0)',
  [Pieces.startZone7]: 'rgba(255,128,0,0)',
  [Pieces.startZone8]: 'rgba(128,0,255,0)',
}

// These codes appear in pieceCodes as intermediate app-internal values used during
// import but are NOT real VirtualScape tile types and must never be written to .hsc
// files or VirtualScape will crash:
//   17001 – wellspring personal tile was remapped to this fake code on import
//   17101 – laur wall pillar; "never existed in virtualscape" (see readVirtualscapeMapFile.ts)
//   15002-15009 – individual start zone sub-types created by this app;
//                 VS only knows type 15001, with colour differentiating each zone
const ARTIFICIAL_PIECE_CODES = new Set([
  17001, 17101,
  15002, 15003, 15004, 15005, 15006, 15007, 15008, 15009,
])

const directVirtualScapeTypeByInventoryID = Object.entries(pieceCodes).reduce(
  (acc, [pieceCode, inventoryID]) => {
    const code = Number(pieceCode)
    if (!inventoryID || inventoryID === Pieces.concrete6 || ARTIFICIAL_PIECE_CODES.has(code)) {
      return acc
    }
    if (!(inventoryID in acc)) {
      acc[inventoryID] = code
    }
    return acc
  },
  {} as Record<string, number>,
)

type VirtualScapeExportResult = {
  arrayBuffer: ArrayBuffer
  map: VirtualScapeMap
  omittedPieceCounts: Record<string, number>
}

export function writeVirtualScapeMapFile({
  hexMap,
  boardPieces,
}: {
  hexMap: HexMap
  boardPieces: BoardPieces
}): VirtualScapeExportResult {
  const omittedPieceCounts: Record<string, number> = {}
  const tiles: VirtualScapeTile[] = []

  for (const boardPiece of boardPieces) {
    const exportedTile = boardPieceToVirtualScapeTile(boardPiece)
    if (!exportedTile) {
      omittedPieceCounts[boardPiece.inventoryID] =
        (omittedPieceCounts[boardPiece.inventoryID] ?? 0) + 1
      continue
    }
    tiles.push(exportedTile)
  }

  tiles.sort((a, b) => a.posZ - b.posZ)

  const virtualScapeMap: VirtualScapeMap = {
    version: virtualScapeVersion,
    name: hexMap.name ?? '',
    author: hexMap.author ?? '',
    playerNumber: '',
    scenario: plainTextToRtf(hexMap.mapNotes ?? ''),
    levelPerPage: 6,
    printingTransparency: 80,
    printingGrid: true,
    printTileNumber: false,
    printStartAreaAsLevel: true,
    tileCount: tiles.length,
    tiles,
  }

  const totalLength = getVirtualScapeMapByteLength(virtualScapeMap)
  const arrayBuffer = new ArrayBuffer(totalLength)
  const dataView = new DataView(arrayBuffer)
  offset = 0

  setFloat64(dataView, virtualScapeMap.version)
  writeCString(dataView, virtualScapeMap.name)
  writeCString(dataView, virtualScapeMap.author)
  writeCString(dataView, virtualScapeMap.playerNumber)
  writeScenario(dataView, virtualScapeMap.scenario)
  setInt32(dataView, virtualScapeMap.levelPerPage)
  setInt32(dataView, virtualScapeMap.printingTransparency)
  setInt32(dataView, virtualScapeMap.printingGrid ? 1 : 0)
  setInt32(dataView, virtualScapeMap.printTileNumber ? 1 : 0)
  setInt32(dataView, virtualScapeMap.printStartAreaAsLevel ? 1 : 0)
  setInt32(dataView, virtualScapeMap.tiles.length)

  for (const tile of virtualScapeMap.tiles) {
    writeTile(dataView, tile)
  }

  return {
    arrayBuffer,
    map: virtualScapeMap,
    omittedPieceCounts,
  }
}

export function writeVirtualScapeArrayBuffer(
  input?: { hexMap: HexMap; boardPieces: BoardPieces },
) {
  if (!input) {
    const emptyMap: HexMap = {
      id: '',
      name: '',
      author: '',
      shape: 'rectangle',
      length: 0,
      width: 0,
    }
    return writeVirtualScapeMapFile({ hexMap: emptyMap, boardPieces: [] })
  }
  return writeVirtualScapeMapFile(input)
}

function boardPieceToVirtualScapeTile(
  boardPiece: BoardPiece,
): VirtualScapeTile | undefined {
  const pieceData = piecesSoFar[boardPiece.inventoryID]
  if (!pieceData) {
    return undefined
  }

  const type = getVirtualScapeTypeForInventoryID(boardPiece.inventoryID)
  if (type === undefined) {
    return undefined
  }

  const rotation = getVirtualScapeRotation(boardPiece)
  const posCube = getVirtualScapeTileCoords(boardPiece, pieceData.template, rotation)
  const oddR = hexUtilsCubeToOddR(posCube)
  const colorf =
    startZoneColorByInventoryID[boardPiece.inventoryID] ?? defaultTileColor
  const posZ =
    boardPiece.inventoryID === Pieces.marvel ||
      boardPiece.inventoryID === Pieces.marvelBroken ||
      boardPiece.inventoryID === Pieces.marvelNoUpper ||
      boardPiece.inventoryID === Pieces.marvelNoUpperBroken
      ? boardPiece.altitude - 1
      : boardPiece.altitude

  if (posZ < 0) {
    return undefined
  }

  return {
    type,
    version: virtualScapeTileVersion,
    rotation,
    posX: oddR.x,
    posY: oddR.y,
    posZ,
    glyphLetter: defaultGlyphLetter,
    glyphName: '',
    startName: '',
    colorf,
    figure: {
      name: '',
      name2: '',
    },
    personal: {
      pieceSize: 0,
      textureTop: '',
      textureSide: '',
      letter: '',
      name: '',
    },
  }
}

function getVirtualScapeTypeForInventoryID(inventoryID: string): number | undefined {
  // All start zones share a single VS type; colour (set in startZoneColorByInventoryID)
  // is what differentiates them in VirtualScape
  if (inventoryID in startZoneColorByInventoryID) {
    return 15001
  }
  // Treasure glyphs don't exist in VS; export as the standard power glyph placeholder
  if (inventoryID === Pieces.glyphTreasure) {
    return 14063
  }
  if (
    inventoryID === Pieces.marvel ||
    inventoryID === Pieces.marvelNoUpper
  ) {
    return 11006
  }
  if (
    inventoryID === Pieces.marvelBroken ||
    inventoryID === Pieces.marvelNoUpperBroken
  ) {
    return 11007
  }
  // concrete6 is a synthetic base piece created on import; omit on export
  if (inventoryID === Pieces.concrete6) {
    return undefined
  }
  // Any inventory ID without a confirmed VS code (e.g. wellspringWater1 → 17001,
  // laurWallSquarePillar → 17101) will return undefined here and be omitted
  return directVirtualScapeTypeByInventoryID[inventoryID]
}

function getVirtualScapeRotation(boardPiece: BoardPiece) {
  if (
    boardPiece.inventoryID === Pieces.ladder ||
    boardPiece.inventoryID === Pieces.battlement
  ) {
    return (boardPiece.rotation + 5) % 6
  }
  return boardPiece.rotation % 6
}

function getVirtualScapeTileCoords(
  boardPiece: BoardPiece,
  template: string,
  rotation: number,
) {
  const placementOffset = getVSTilePlacementOffset({ rotation, template })
  return {
    q: boardPiece.pieceCoords.q - placementOffset.q,
    r: boardPiece.pieceCoords.r - placementOffset.r,
    s: boardPiece.pieceCoords.s - placementOffset.s,
  }
}

function getVirtualScapeMapByteLength(virtualScapeMap: VirtualScapeMap) {
  let length = 0
  length += 8
  length += getCStringByteLength(virtualScapeMap.name)
  length += getCStringByteLength(virtualScapeMap.author)
  length += getCStringByteLength(virtualScapeMap.playerNumber)
  length += 4 + new TextEncoder().encode(virtualScapeMap.scenario).length
  length += 4 * 6
  for (const tile of virtualScapeMap.tiles) {
    length += getTileByteLength(tile)
  }
  return length
}

function getTileByteLength(tile: VirtualScapeTile) {
  let length = 0
  length += 4
  length += 8
  length += 4 * 4
  length += 1
  length += getCStringByteLength(tile.glyphName)
  length += getCStringByteLength(tile.startName)
  length += 4
  if (Math.floor(tile.type / 1000) === 17) {
    length += 4
    length += getCStringByteLength(tile.personal.textureTop)
    length += getCStringByteLength(tile.personal.textureSide)
    length += getCStringByteLength(tile.personal.letter)
    length += getCStringByteLength(tile.personal.name)
  }
  if (Math.floor(tile.type / 1000) === 18) {
    length += getCStringByteLength(tile.figure.name)
    length += getCStringByteLength(tile.figure.name2)
  }
  return length
}

function writeTile(dataView: DataView, tile: VirtualScapeTile) {
  setInt32(dataView, tile.type)
  setFloat64(dataView, tile.version)
  setInt32(dataView, tile.rotation)
  setInt32(dataView, tile.posX)
  setInt32(dataView, tile.posY)
  setInt32(dataView, tile.posZ)
  setUint8(dataView, tile.glyphLetter.charCodeAt(0) || defaultGlyphLetter.charCodeAt(0))
  writeCString(dataView, tile.glyphName)
  writeCString(dataView, tile.startName)
  const color = parseRgba(tile.colorf)
  setUint8(dataView, color.r)
  setUint8(dataView, color.g)
  setUint8(dataView, color.b)
  setUint8(dataView, color.a)

  if (Math.floor(tile.type / 1000) === 17) {
    setInt32(dataView, tile.personal.pieceSize)
    writeCString(dataView, tile.personal.textureTop)
    writeCString(dataView, tile.personal.textureSide)
    writeCString(dataView, tile.personal.letter)
    writeCString(dataView, tile.personal.name)
  }
  if (Math.floor(tile.type / 1000) === 18) {
    writeCString(dataView, tile.figure.name)
    writeCString(dataView, tile.figure.name2)
  }
}

function setFloat64(dataView: DataView, value: number) {
  dataView.setFloat64(offset, value, isLittleEndian)
  offset += 8
}
function setInt32(dataView: DataView, value: number) {
  dataView.setInt32(offset, value, isLittleEndian)
  offset += 4
}
function setInt16(dataView: DataView, value: number) {
  dataView.setInt16(offset, value, isLittleEndian)
  offset += 2
}
function setUint16(dataView: DataView, value: number) {
  dataView.setUint16(offset, value, isLittleEndian)
  offset += 2
}
function setUint8(dataView: DataView, value: number) {
  dataView.setUint8(offset, value)
  offset += 1
}

function writeScenario(dataView: DataView, scenario: string) {
  const encodedScenario = new TextEncoder().encode(scenario)
  setInt32(dataView, encodedScenario.length)
  for (const byte of encodedScenario) {
    setUint8(dataView, byte)
  }
}

function writeCString(dataView: DataView, value: string) {
  setUint16(dataView, 0xfeff)
  setUint8(dataView, 0xff)
  writeCStringLength(dataView, value.length)
  for (let i = 0; i < value.length; i++) {
    setInt16(dataView, value.charCodeAt(i))
  }
}

function writeCStringLength(dataView: DataView, length: number) {
  if (length < 0xff) {
    setUint8(dataView, length)
    return
  }

  setUint8(dataView, 0xff)
  if (length <= 0xfffd) {
    setUint16(dataView, length)
    return
  }

  setUint16(dataView, 0xffff)
  setInt32(dataView, length)
}

function getCStringByteLength(value: string) {
  return 3 + getCStringLengthEncodingByteLength(value.length) + value.length * 2
}

function getCStringLengthEncodingByteLength(length: number) {
  if (length < 0xff) {
    return 1
  }
  if (length <= 0xfffd) {
    return 3
  }
  return 7
}

function parseRgba(colorf: string) {
  const rgbaMatch = colorf.match(
    /^rgba\((\d+),(\d+),(\d+),(\d+)\)$/,
  )
  if (!rgbaMatch) {
    return { r: 0, g: 160, b: 0, a: 0 }
  }
  return {
    r: Number(rgbaMatch[1]),
    g: Number(rgbaMatch[2]),
    b: Number(rgbaMatch[3]),
    a: Number(rgbaMatch[4]),
  }
}

function plainTextToRtf(text: string) {
  let escapedText = ''

  for (let i = 0; i < text.length; i++) {
    const character = text[i]
    const charCode = character.charCodeAt(0)

    if (character === '\r') {
      if (text[i + 1] === '\n') {
        i += 1
      }
      escapedText += '\\par\n'
      continue
    }
    if (character === '\n') {
      escapedText += '\\par\n'
      continue
    }
    if (character === '\\') {
      escapedText += '\\\\'
      continue
    }
    if (character === '{') {
      escapedText += '\\{'
      continue
    }
    if (character === '}') {
      escapedText += '\\}'
      continue
    }
    if (charCode > 127) {
      escapedText += `\\u${charCode}?`
      continue
    }

    escapedText += character
  }

  return `{\\rtf1\\ansi ${escapedText}}`
}
