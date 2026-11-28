import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import { getMapShareUrlParams } from '../utils/mapShareUrl'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('public share-link docs', () => {
  it('loads the documented example without dropped pieces or warnings', async () => {
    const example = await import(
      new URL('../../docs/examples/encode-share-link.mjs', import.meta.url).href
    )
    const url = new URL(example.shareUrl)
    expect(url.pathname).toBe('/hs')

    const { m } = getMapShareUrlParams(url.search)
    if (!m) throw new Error('Docs example has no map parameter')

    const { hexMap, boardPiecesEncodedArr } = parseMapDataArrayFromCrushed(m)
    const normalized = normalizeBoardPiecesWithDropped(boardPiecesEncodedArr)
    const loaded = buildupJsonFileMap(
      normalized.boardPieces,
      hexMap,
      normalized.droppedPieces,
    )
    const enqueueSnackbar = vi.fn()
    const consoleWarning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    warnAboutLoadedMap(enqueueSnackbar, loaded)

    expect(loaded.droppedPieces).toEqual([])
    expect(loaded.boardPieces.map((piece) => piece.inventoryID).sort()).toEqual(
      ['g7', 'tr10', 'z1'],
    )
    expect(enqueueSnackbar).not.toHaveBeenCalled()
    expect(consoleWarning).not.toHaveBeenCalled()
  })

  it('limits CORS headers to the /format/* Netlify rule', () => {
    const headers = readFileSync(
      new URL('../../public/_headers', import.meta.url),
      'utf8',
    )
    const rules = headers
      .split(/\n\s*\n/)
      .map((block) =>
        block
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#')),
      )
      .filter((lines) => lines[0]?.startsWith('/'))
    const corsRules = rules.filter((lines) =>
      lines.some((line) => line.startsWith('Access-Control-Allow-Origin:')),
    )

    expect(corsRules).toHaveLength(1)
    expect(corsRules[0]).toEqual([
      '/format/*',
      'Access-Control-Allow-Origin: *',
      'Cache-Control: public, max-age=3600',
    ])
  })
})
