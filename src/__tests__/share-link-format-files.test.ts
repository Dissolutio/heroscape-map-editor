import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import { makeTable, place } from './helpers/board'
import { piecesSoFar } from '../data/pieces'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import {
  MAX_SHARE_URL_LENGTH,
  SHARE_URL_FALLBACK_DROP_ORDER,
} from '../data/shareUrlConstants'
import { ROUTES } from '../ROUTES'
import {
  MAP_SHARE_URL_PARAM_KEYS,
  MAP_SHARE_VIEW_PARAM_VALUES,
  getMapShareUrlParams,
} from '../utils/mapShareUrl'
import { generateFormatFiles } from '../../scripts/format/generateFormatFiles'
import { generateHexMapSchema } from '../../scripts/format/schema'
import type { CubeCoordinate } from '../types'

const root = process.cwd()
const packageLock = JSON.parse(
  readFileSync(resolve(root, 'package-lock.json'), 'utf8'),
) as {
  packages: Record<string, { version?: string }>
}
const jsoncrushVersion = packageLock.packages['node_modules/jsoncrush']?.version

if (!jsoncrushVersion) {
  throw new Error('Could not read the locked jsoncrush version')
}

const files = generateFormatFiles({
  hexMapSchema: generateHexMapSchema(root),
  jsoncrushVersion,
  generatedAt: '2026-01-01T00:00:00.000Z',
  gitCommit: 'test-commit',
})
const shareLinkSchema = JSON.parse(files['format/share-link.schema.json']!)
const pieces = JSON.parse(files['format/pieces.json']!) as PieceFormatEntry[]
const version = JSON.parse(files['format/version.json']!) as {
  formatVersion: number
  jsoncrushVersion: string
  route: string
  mapParam: string
  viewParam: { name: string; values: Record<string, string> }
  maxUrlLength: number
  fallbackDropOrder: string[]
}

type PieceFormatEntry = {
  id: string
  title: string
  terrain: string
  size: number
  height: number
  template: string
  footprints?: {
    rotation: number
    offsets: CubeCoordinate[]
  }[]
}

const contractShareUrl = readFileSync(
  new URL('./fixtures/share-link-contract/share-url.txt', import.meta.url),
  'utf8',
).trim()

function sortCoordinates(coordinates: CubeCoordinate[]) {
  return [...coordinates].sort((a, b) => a.q - b.q || a.r - b.r || a.s - b.s)
}

function placedFootprint(pieceID: string, rotation: number) {
  const table = makeTable(50)
  const uid = `manifest-${pieceID}-${rotation}`
  const placed = place({
    board: table,
    pieceID,
    at: table.center,
    altitude: 0,
    rotation,
    uid,
    permissive: true,
  })
  if (placed.error) {
    throw new Error(`Could not place ${pieceID}: ${placed.error.message}`)
  }

  return sortCoordinates(
    Object.values(placed.board.boardHexes)
      .filter((hex) => hex.boardPieceUID === uid && !hex.isVerticalClearanceHex)
      .map((hex) => ({
        q: hex.q - table.center.q,
        r: hex.r - table.center.r,
        s: hex.s - table.center.s,
      })),
  )
}

describe('generated share-link format files', () => {
  it('accepts the decoded step-1 contract fixture with the generated schema', () => {
    const { m } = getMapShareUrlParams(new URL(contractShareUrl).search)
    if (!m) throw new Error('Contract URL has no map parameter')

    const { hexMap, boardPiecesEncodedArr } = parseMapDataArrayFromCrushed(m)
    const payload = [hexMap, ...boardPiecesEncodedArr]
    const ajv = new Ajv2020()

    expect(ajv.validate(shareLinkSchema, payload)).toBe(true)
  })

  it('rejects malformed encoded piece strings', () => {
    const { m } = getMapShareUrlParams(new URL(contractShareUrl).search)
    if (!m) throw new Error('Contract URL has no map parameter')

    const { hexMap } = parseMapDataArrayFromCrushed(m)
    const ajv = new Ajv2020()

    expect(ajv.validate(shareLinkSchema, [hexMap, 'not-a-piece-string'])).toBe(
      false,
    )
  })

  it('includes every registered piece and its required metadata', () => {
    expect(pieces.map(({ id }) => id)).toEqual(
      Object.keys(piecesSoFar).sort((a, b) => a.localeCompare(b)),
    )
    for (const piece of pieces) {
      expect(piece).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          terrain: expect.any(String),
          size: expect.any(Number),
          height: expect.any(Number),
          template: expect.any(String),
        }),
      )
    }
  })

  it.each([
    ['g7', 2],
    ['g24', 1],
    ['y0', 3],
  ])(
    'matches placement footprints for %s at rotations 0 and %i',
    (pieceID, otherRotation) => {
      const entry = pieces.find(({ id }) => id === pieceID)
      expect(entry?.footprints).toBeDefined()

      for (const rotation of [0, otherRotation]) {
        const generated = entry?.footprints?.find(
          (footprint) => footprint.rotation === rotation,
        )
        expect(generated).toBeDefined()
        expect(sortCoordinates(generated!.offsets)).toEqual(
          placedFootprint(pieceID, rotation),
        )
      }
    },
  )

  it('uses the app constants in version.json', () => {
    expect(version).toMatchObject({
      formatVersion: 1,
      jsoncrushVersion,
      route: ROUTES.heroscapeHome,
      mapParam: MAP_SHARE_URL_PARAM_KEYS.map,
      viewParam: {
        name: MAP_SHARE_URL_PARAM_KEYS.viewMode,
        values: {
          [MAP_SHARE_VIEW_PARAM_VALUES.pdf]: 'PDF',
          [MAP_SHARE_VIEW_PARAM_VALUES.twoD]: '2D',
          default: '3D',
        },
      },
      maxUrlLength: MAX_SHARE_URL_LENGTH,
      fallbackDropOrder: [...SHARE_URL_FALLBACK_DROP_ORDER],
    })
  })
})
