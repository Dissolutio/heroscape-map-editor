import bmp from 'bmp-js'
import { PNG } from 'pngjs'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  capOrmTemplates,
  normalGreenFlipSources,
  sideOrmTemplates,
  sideRepair,
  terrainTextures,
} from './textures/terrain-textures.config.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sourceRoot = join(root, 'textures')
const outputRoot = join(root, 'public/textures')
const capSize = { width: 256, height: 256 }
const sideSize = { width: 128, height: 32 }
const neutralNormal = [128, 128, 255, 255]
const sideEvidenceFont = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
}
const pngOptions = {
  colorType: 6,
  deflateLevel: 9,
  deflateStrategy: 3,
  filterType: 4,
}

function readImage(source) {
  const path = join(sourceRoot, source)
  const bytes = readFileSync(path)
  const image = source.endsWith('.bmp')
    ? bmp.decode(bytes)
    : PNG.sync.read(bytes)
  const expectedSize =
    source.startsWith('sides/') || source.startsWith('side-')
      ? sideSize
      : capSize

  if (
    image.width !== expectedSize.width ||
    image.height !== expectedSize.height
  ) {
    throw new Error(
      `${source} is ${image.width}x${image.height}; expected ` +
        `${expectedSize.width}x${expectedSize.height}`,
    )
  }

  const data = Buffer.from(image.data)
  if (source.endsWith('.bmp')) {
    for (let i = 0; i < data.length; i += 4) {
      const blue = data[i + 1]
      const green = data[i + 2]
      const red = data[i + 3]
      data[i] = red
      data[i + 1] = green
      data[i + 2] = blue
      data[i + 3] = 255
    }
  }

  return { width: image.width, height: image.height, data }
}

function cloneImage(image) {
  return {
    width: image.width,
    height: image.height,
    data: Buffer.from(image.data),
  }
}

function pixelOffset(image, x, y) {
  return (y * image.width + x) * 4
}

function normalizeNormalAt(image, x, y) {
  const offset = pixelOffset(image, x, y)
  const vector = [
    image.data[offset] / 127.5 - 1,
    image.data[offset + 1] / 127.5 - 1,
    image.data[offset + 2] / 127.5 - 1,
  ]
  const length = Math.hypot(...vector)
  if (length === 0) {
    image.data[offset] = neutralNormal[0]
    image.data[offset + 1] = neutralNormal[1]
    image.data[offset + 2] = neutralNormal[2]
    return
  }

  for (let channel = 0; channel < 3; channel += 1) {
    image.data[offset + channel] = Math.round(
      ((vector[channel] / length + 1) * 255) / 2,
    )
  }
}

function repairSideImage(source, { normal = false, edgeColumns } = {}) {
  const image = cloneImage(source)
  const columns = edgeColumns ?? sideRepair.edgeBlendColumns

  if (!Number.isInteger(columns) || columns < 1 || columns * 2 > image.width) {
    throw new Error(`Invalid side edge blend width: ${columns}`)
  }

  const row2Offset = pixelOffset(image, 0, 2)
  for (let y = 0; y < 2; y += 1) {
    const destinationOffset = pixelOffset(image, 0, y)
    image.data.copy(
      image.data,
      destinationOffset,
      row2Offset,
      row2Offset + image.width * 4,
    )
  }

  for (let y = 0; y < image.height; y += 1) {
    const leftOffset = pixelOffset(image, 0, y)
    const rightOffset = pixelOffset(image, image.width - 1, y)
    const target = Array.from(
      { length: 3 },
      (_, channel) =>
        (image.data[leftOffset + channel] + image.data[rightOffset + channel]) /
        2,
    )

    for (let distance = 0; distance < columns; distance += 1) {
      const weight = (columns - distance) / columns
      const xPositions = [distance, image.width - 1 - distance]
      for (const x of xPositions) {
        const offset = pixelOffset(image, x, y)
        for (let channel = 0; channel < 3; channel += 1) {
          image.data[offset + channel] = Math.round(
            image.data[offset + channel] * (1 - weight) +
              target[channel] * weight,
          )
        }
        if (normal) normalizeNormalAt(image, x, y)
      }
    }
  }

  return image
}

function flipGreen(image) {
  const result = cloneImage(image)
  for (let offset = 1; offset < result.data.length; offset += 4) {
    result.data[offset] = 255 - result.data[offset]
  }
  return result
}

function readNormal(source) {
  const image = readImage(source)
  return normalGreenFlipSources.includes(source) ? flipGreen(image) : image
}

function makeStrip(layers) {
  if (layers.length === 0)
    throw new Error('Cannot write an empty texture strip')
  const { width, height } = layers[0]
  const image = {
    width,
    height: height * layers.length,
    data: Buffer.alloc(width * height * layers.length * 4),
  }

  layers.forEach((layer, index) => {
    if (layer.width !== width || layer.height !== height) {
      throw new Error('Texture strip layers must have equal dimensions')
    }
    layer.data.copy(image.data, index * width * height * 4)
  })

  return image
}

function resolveChannel(value, side, sideRepairs, normal = false) {
  if (typeof value === 'number') return () => value
  const source = readImage(value)
  const image =
    side && sideRepairs
      ? repairSideImage(source, {
          normal,
          edgeColumns:
            sideRepair.edgeBlendOverrides[value] ?? sideRepair.edgeBlendColumns,
        })
      : source
  return (pixel) => image.data[pixel * 4]
}

function makeOrmLayer(template, side, sideRepairs) {
  const width = side ? sideSize.width : capSize.width
  const height = side ? sideSize.height : capSize.height
  const channels = [
    resolveChannel(template.ao, side, sideRepairs),
    resolveChannel(template.roughness, side, sideRepairs),
    resolveChannel(template.metalness, side, sideRepairs),
    resolveChannel(template.height, side, sideRepairs),
  ]
  const image = {
    width,
    height,
    data: Buffer.alloc(width * height * 4),
  }

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    for (let channel = 0; channel < 4; channel += 1) {
      image.data[pixel * 4 + channel] = channels[channel](pixel)
    }
  }
  return image
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject)
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortedObject(value[key])]),
    )
  }
  return value
}

function encodePng(image) {
  return PNG.sync.write(image, pngOptions)
}

function addOutput(outputs, name, image, colorSpace) {
  outputs.set(name, {
    bytes: encodePng(image),
    metadata: {
      width: image.width,
      height: image.height,
      frameWidth: image.width,
      frameHeight: image.height,
      layers: 1,
      colorSpace,
    },
  })
}

function addStrip(outputs, name, layers, colorSpace) {
  const image = makeStrip(layers)
  addOutput(outputs, name, image, colorSpace)
  outputs.get(name).metadata.frameHeight = layers[0].height
  outputs.get(name).metadata.layers = layers.length
}

function drawText(image, text, x, y, color) {
  let cursorX = x
  for (const letter of text) {
    const glyph = sideEvidenceFont[letter]
    if (!glyph) {
      cursorX += 6
      continue
    }
    for (let glyphY = 0; glyphY < glyph.length; glyphY += 1) {
      for (let glyphX = 0; glyphX < glyph[glyphY].length; glyphX += 1) {
        if (glyph[glyphY][glyphX] !== '1') continue
        const offset = pixelOffset(image, cursorX + glyphX, y + glyphY)
        image.data.set(color, offset)
      }
    }
    cursorX += 6
  }
}

function drawRepeatedTexture(sheet, texture, x, y) {
  for (let level = 0; level < 3; level += 1) {
    for (let repeat = 0; repeat < 2; repeat += 1) {
      for (let row = 0; row < texture.height; row += 1) {
        const source = pixelOffset(texture, 0, row)
        const destination = pixelOffset(
          sheet,
          x + repeat * texture.width,
          y + level * texture.height + row,
        )
        texture.data.copy(
          sheet.data,
          destination,
          source,
          source + texture.width * 4,
        )
      }
    }
  }
}

export function buildSideRepairContactSheet() {
  const sources = [
    ...new Set(
      Object.values(terrainTextures)
        .map((entry) => entry.sideDiffuse)
        .filter((source) => source),
    ),
  ]
  const columns = 4
  const cellWidth = 512
  const cellHeight = 118
  const rows = Math.ceil(sources.length / columns)
  const sheet = {
    width: columns * cellWidth,
    height: rows * cellHeight,
    data: Buffer.alloc(columns * cellWidth * rows * cellHeight * 4, 245),
  }
  for (let offset = 3; offset < sheet.data.length; offset += 4) {
    sheet.data[offset] = 255
  }

  sources.forEach((source, index) => {
    const x = (index % columns) * cellWidth
    const y = Math.floor(index / columns) * cellHeight
    const before = readImage(source)
    const after = repairSideImage(before)
    const fileLabel = source
      .split('/')
      .at(-1)
      .replace(/\.png$/i, '')
    drawText(sheet, fileLabel.toUpperCase(), x + 3, y + 2, [25, 25, 25, 255])
    drawText(sheet, 'BEFORE', x + 3, y + 12, [25, 25, 25, 255])
    drawText(sheet, 'AFTER', x + 259, y + 12, [25, 25, 25, 255])
    drawRepeatedTexture(sheet, before, x, y + 22)
    drawRepeatedTexture(sheet, after, x + 256, y + 22)
  })

  return encodePng(sheet)
}

export function buildTextureOutputs({ sideRepairs = true } = {}) {
  const terrains = Object.entries(terrainTextures)
  const capTerrains = terrains.filter(([, entry]) => entry.capDiffuse)
  const capLayersByTerrain = new Map(
    capTerrains.map(([name], index) => [name, index]),
  )
  const sideSources = [
    ...new Set(
      terrains.map(([, entry]) => entry.sideDiffuse).filter((source) => source),
    ),
  ]
  const sideLayersBySource = new Map(
    sideSources.map((source, index) => [source, index]),
  )
  const capOrmNames = [...new Set(terrains.map(([, entry]) => entry.capOrm))]
  const sideOrmNames = [
    ...new Set(
      terrains
        .filter(([, entry]) => entry.sideDiffuse)
        .map(([, entry]) => entry.sideOrm),
    ),
  ]
  const capNormalNames = ['sand', 'road', 'flat']
  const sideNormalNames = ['solid', 'fluid']
  const outputs = new Map()

  addStrip(
    outputs,
    'caps-diffuse.png',
    capTerrains.map(([, entry]) => readImage(entry.capDiffuse)),
    'srgb',
  )
  addStrip(
    outputs,
    'caps-diffuse-pbr.png',
    capTerrains.map(([, entry]) =>
      readImage(entry.capDiffusePbr ?? entry.capDiffuse),
    ),
    'srgb',
  )
  addStrip(
    outputs,
    'sides-diffuse.png',
    sideSources.map((source) => {
      const image = readImage(source)
      return sideRepairs ? repairSideImage(image) : image
    }),
    'srgb',
  )

  addStrip(
    outputs,
    'caps-orm.png',
    capOrmNames.map((name) =>
      makeOrmLayer(capOrmTemplates[name], false, sideRepairs),
    ),
    'data',
  )
  const capNormals = {
    sand: readNormal('cap-sand-normal.bmp'),
    road: readNormal('cap-road-normal.bmp'),
    flat: {
      width: capSize.width,
      height: capSize.height,
      data: Buffer.alloc(capSize.width * capSize.height * 4),
    },
  }
  for (let offset = 0; offset < capNormals.flat.data.length; offset += 4) {
    capNormals.flat.data.set(neutralNormal, offset)
  }
  addStrip(
    outputs,
    'caps-normal.png',
    capNormalNames.map((name) => capNormals[name]),
    'data',
  )

  addStrip(
    outputs,
    'sides-orm.png',
    sideOrmNames.map((name) =>
      makeOrmLayer(sideOrmTemplates[name], true, sideRepairs),
    ),
    'data',
  )
  const sideNormals = {}
  for (const [name, source] of [
    ['solid', 'side-solid-normal.bmp'],
    ['fluid', 'side-fluid-normal.bmp'],
  ]) {
    let image = readNormal(source)
    if (sideRepairs) image = repairSideImage(image, { normal: true })
    sideNormals[name] = image
  }
  addStrip(
    outputs,
    'sides-normal.png',
    sideNormalNames.map((name) => sideNormals[name]),
    'data',
  )

  const capOrmLayers = new Map(capOrmNames.map((name, index) => [name, index]))
  const sideOrmLayers = new Map(
    sideOrmNames.map((name, index) => [name, index]),
  )
  const capNormalLayers = new Map(
    capNormalNames.map((name, index) => [name, index]),
  )
  const sideNormalLayers = new Map(
    sideNormalNames.map((name, index) => [name, index]),
  )
  const manifestTerrains = Object.fromEntries(
    terrains.map(([name, entry]) => [
      name,
      {
        capDiffuseLayer: capLayersByTerrain.get(name) ?? -1,
        capDiffusePbrLayer: capLayersByTerrain.get(name) ?? -1,
        capOrmLayer: capOrmLayers.get(entry.capOrm) ?? -1,
        capNormalLayer: capNormalLayers.get(entry.capNormal) ?? -1,
        sideDiffuseLayer: sideLayersBySource.get(entry.sideDiffuse) ?? -1,
        sideOrmLayer: entry.sideDiffuse
          ? (sideOrmLayers.get(entry.sideOrm) ?? -1)
          : -1,
        sideNormalLayer: entry.sideDiffuse
          ? (sideNormalLayers.get(entry.sideNormal) ?? -1)
          : -1,
        flatColor: entry.flatColor ?? null,
        allowRandomRotation: entry.allowRandomRotation,
        isFluid: entry.isFluid,
      },
    ]),
  )
  const fileMetadata = Object.fromEntries(
    [...outputs].map(([name, output]) => [name, output.metadata]),
  )
  const manifest = sortedObject({
    version: 1,
    normalConvention: 'opengl',
    terrainOrder: terrains.map(([name]) => name),
    terrains: manifestTerrains,
    files: fileMetadata,
  })
  outputs.set('manifest.json', {
    bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
    metadata: null,
  })

  return outputs
}

export function checkTextureOutputs(outputs, destination = outputRoot) {
  const differences = []
  for (const [name, output] of outputs) {
    let existing
    try {
      existing = readFileSync(join(destination, name))
    } catch (error) {
      if (error.code === 'ENOENT') {
        differences.push(`${name}: missing`)
        continue
      }
      throw error
    }
    if (!existing.equals(output.bytes)) differences.push(`${name}: differs`)
  }
  return differences
}

function main(args) {
  const allowedArgs = new Set([
    '--check',
    '--no-side-repairs',
    '--contact-sheet',
  ])
  const unknownArgs = args.filter((arg) => !allowedArgs.has(arg))
  if (unknownArgs.length) {
    throw new Error(`Unknown option(s): ${unknownArgs.join(', ')}`)
  }
  if (args.includes('--contact-sheet')) {
    if (args.length !== 1) {
      throw new Error('--contact-sheet cannot be combined with other options')
    }
    const path = join(root, 'docs/evidence/texture-side-repairs.png')
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, buildSideRepairContactSheet())
    process.stdout.write('Wrote docs/evidence/texture-side-repairs.png.\n')
    return
  }
  const outputs = buildTextureOutputs({
    sideRepairs: !args.includes('--no-side-repairs'),
  })

  if (args.includes('--check')) {
    const differences = checkTextureOutputs(outputs)
    if (differences.length) {
      process.stderr.write(`${differences.join('\n')}\n`)
      process.exitCode = 1
    } else {
      process.stdout.write('Packed textures match committed outputs.\n')
    }
    return
  }

  mkdirSync(outputRoot, { recursive: true })
  for (const [name, output] of outputs) {
    const path = join(outputRoot, name)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, output.bytes)
  }
  process.stdout.write(`Wrote ${outputs.size} texture outputs.\n`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
