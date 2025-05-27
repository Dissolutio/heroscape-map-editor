import type { MapFileState, VirtualScapeMap, VirtualScapeTile } from '../types'

/* 
This function reads a specific binary file format used by VirtualScape.
VirtualScape map editor: https://github.com/dkniffin/virtualscape
*/
const isLittleEndian = true
let offset = 0
export function processVirtualScapeArrayBuffer(arrayBuffer: ArrayBuffer) {
  const dataView = new DataView(arrayBuffer as ArrayBuffer)
  offset = 0
  const virtualScapeMap: VirtualScapeMap = {
    version: 0,
    name: '',
    author: '',
    playerNumber: '',
    scenario: '',
    levelPerPage: 0,
    printingTransparency: 0,
    printingGrid: false,
    printTileNumber: false,
    printStartAreaAsLevel: true,
    tileCount: 0,
    tiles: [],
  }

  // file version "0.0007" only one ever seen
  virtualScapeMap.version = getFloat64(dataView)
  virtualScapeMap.name = readCString(dataView)
  virtualScapeMap.author = readCString(dataView)
  virtualScapeMap.playerNumber = readCString(dataView)
  const scenarioLength = getInt32(dataView)
  let scenarioRichText = ''
  for (let i = 0; i < scenarioLength; i++) {
    scenarioRichText += String.fromCharCode(getUint8(dataView))
  }
  virtualScapeMap.scenario = rtfToText(scenarioRichText)
  virtualScapeMap.levelPerPage = getInt32(dataView)
  virtualScapeMap.printingTransparency = getInt32(dataView)
  virtualScapeMap.printingGrid = getInt32(dataView) !== 0
  virtualScapeMap.printTileNumber = getInt32(dataView) !== 0
  virtualScapeMap.printStartAreaAsLevel = getInt32(dataView) !== 0
  virtualScapeMap.tileCount = getInt32(dataView)

  for (let i = 0; i < virtualScapeMap.tileCount; i++) {
    // if all C-string fields above were empty, then tiles start at byte 48
    const tile: VirtualScapeTile = {
      type: 0,
      version: 0.0003,
      rotation: 0,
      posX: 0,
      posY: 0,
      posZ: 0,
      glyphLetter: '',
      glyphName: '',
      startName: '',
      colorf: '',
      // isFigureTile: false,
      figure: {
        name: '',
        name2: '',
      },
      // isPersonalTile: false,
      personal: {
        pieceSize: 0,
        textureTop: '',
        textureSide: '',
        letter: '',
        name: '',
      },
    }
    // type designates a unique piece/tile in heroscape
    tile.type = getInt32(dataView)
    // tile version "0.0003" only one tested or seen
    tile.version = getFloat64(dataView)
    // 6 rotations progress clockwise, 0-5
    tile.rotation = getInt32(dataView)
    // x,y are "odd-r" offset hex coordinates: https://www.redblobgames.com/grids/hexagons/#coordinates
    tile.posX = getInt32(dataView)
    tile.posY = getInt32(dataView)
    // z is altitude in our world
    tile.posZ = getInt32(dataView)
    // glyphLetter reliably is stored and read in files
    tile.glyphLetter = String.fromCharCode(getUint8(dataView))
    // glyphName is empty on some tests of files, do not use it
    tile.glyphName = readCString(dataView)
    tile.startName = readCString(dataView)
    // this
    const red = getUint8(dataView)
    const green = getUint8(dataView)
    const blue = getUint8(dataView)
    const alpha = getUint8(dataView)
    tile.colorf = `rgba(${red},${green},${blue},${alpha})`

    if (Math.floor(tile.type / 1000) === 17) {
      // "personal" tiles have additional data
      // tile.isPersonalTile = true
      tile.personal.pieceSize = getInt32(dataView)
      tile.personal.textureTop = readCString(dataView) // My Ice.bmp
      tile.personal.textureSide = readCString(dataView) // My IceSide.bmp
      tile.personal.letter = readCString(dataView)
      tile.personal.name = readCString(dataView)
    }
    if (Math.floor(tile.type / 1000) === 18) {
      // "figure" tiles have additional data
      // tile.isFigureTile = true
      tile.figure.name = readCString(dataView)
      tile.figure.name2 = readCString(dataView)
    }
    virtualScapeMap.tiles.push(tile)
  }

  // sort by posZ, so we can build from the bottom up (posZ is altitude in virtualscape)
  virtualScapeMap.tiles.sort((a, b) => {
    return a.posZ - b.posZ
  })
  return virtualScapeMap
}

function getFloat64(dataView: DataView): number {
  const val = dataView.getFloat64(offset, isLittleEndian)
  offset += 8
  return val
}
function getInt32(dataView: DataView): number {
  const val = dataView.getInt32(offset, isLittleEndian)
  offset += 4
  return val
}
function getUint32(dataView: DataView): number {
  const val = dataView.getUint32(offset, isLittleEndian)
  offset += 4
  return val
}
function getInt16(dataView: DataView): number {
  const val = dataView.getInt16(offset, isLittleEndian)
  offset += 2
  return val
}
function getUint16(dataView: DataView): number {
  const val = dataView.getUint16(offset, isLittleEndian)
  offset += 2
  return val
}
function getUint8(dataView: DataView): number {
  const val = dataView.getUint8(offset)
  offset += 1
  return val
}
function readCString(dataView: DataView): string {
  const length = readCStringLength(dataView)
  let value = ''
  for (let i = 0; i < length; i++) {
    value += String.fromCodePoint(getInt16(dataView))
  }
  return value
}
function readCStringLength(dataView: DataView): number {
  let length = 0
  const byte = getUint8(dataView)
  if (byte !== 0xff) {
    // Case 1: If the first byte is not 0xFF, it directly represents the length.
    length = byte
  } else {
    // Case 2: If the first byte is 0xFF, read the next 2 bytes as a 16-bit unsigned integer.
    const short = getUint16(dataView)

    if (short === 0xfffe) {
      // Case 2a: If the 16-bit value is 0xFFFE, recursively call `readCStringLength`.
      // This indicates that the length is encoded in a more complex way.
      return readCStringLength(dataView)
    }
    if (short === 0xffff) {
      // Case 2b: If the 16-bit value is 0xFFFF, read the next 4 bytes as a 32-bit unsigned integer.
      // This represents a very large string length.
      length = getUint32(dataView)
    } else {
      // Case 2c: Otherwise, the 16-bit value itself represents the length.
      length = short
    }
  }
  return length
}
function rtfToText(rtf: string) {
  // https://stackoverflow.com/questions/29922771/convert-rtf-to-and-from-plain-text
  rtf = rtf.replace(/\\par[d]?/g, '')
  return rtf
    .replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, '')
    .trim()
}

export default function readVirtualscapeMapFile(
  file: File,
): Promise<VirtualScapeMap> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const arrayBuffer = reader.result
      const virtualScapeMap = processVirtualScapeArrayBuffer(
        arrayBuffer as ArrayBuffer,
      )
      resolve(virtualScapeMap)
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsArrayBuffer(file)
  })
}
export async function processGZippedJsonArrayBuffer(
  arrayBuffer: ArrayBuffer,
  readableStream?: ReadableStream<Uint8Array> | null,
) {
  try {
    const stream = readableStream || new Blob([arrayBuffer ?? '']).stream()
    const decompressedStream = stream.pipeThrough(
      new DecompressionStream('gzip'),
    )
    const decompressedData = await new Response(decompressedStream).text()
    const data: MapFileState = JSON.parse(decompressedData)
    return data
  } catch (error) {
    console.error(error)
  }
}
export function readGzipMapFile(file: File): Promise<MapFileState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      const arrayBuffer = reader.result
      try {
        const compressedBlob = new Blob([arrayBuffer ?? ''])
        const decompressedStream = compressedBlob
          .stream()
          .pipeThrough(new DecompressionStream('gzip'))
        const decompressedData = await new Response(decompressedStream).text()
        const data: MapFileState = JSON.parse(decompressedData)
        resolve(data)
      } catch (error) {
        console.error(error)
      }
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsArrayBuffer(file)
  })
}
