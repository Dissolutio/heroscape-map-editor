import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import { inflateBoardPiecesFromIds } from '../utils/map-utils'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'

describe('new map details', () => {
  it.each([
    ['rectangle', makeRectangleScenario],
    ['hexagon', makeHexagonScenario],
  ] as const)(
    'stores author and notes on a new %s map',
    (_shape, createMap) => {
      const map = createMap({
        mapName: 'New Scenario',
        author: 'Map Builder',
        mapNotes: 'Scenario notes',
      })
      const loaded = buildupJsonFileMap(map.boardPieces, map.hexMap)

      expect(loaded.hexMap).toMatchObject({
        name: 'New Scenario',
        author: 'Map Builder',
        mapNotes: 'Scenario notes',
      })
    },
  )

  it('keeps the author in share links but omits map notes', () => {
    const map = makeRectangleScenario({
      mapName: 'Shared Scenario',
      author: 'Map Builder',
      mapNotes: 'Private notes',
    })
    const fileData = JSON.parse(
      JSON.stringify({
        hexMap: map.hexMap,
        boardPieces: map.boardPieces,
      }),
    )
    const fileLoaded = buildupJsonFileMap(fileData.boardPieces, fileData.hexMap)
    const parsed = parseMapDataArrayFromCrushed(
      getUrlMapString({
        hexMap: map.hexMap,
        boardPieces: map.boardPieces,
      }),
    )
    const loaded = buildupJsonFileMap(
      inflateBoardPiecesFromIds(parsed.boardPiecesEncodedArr),
      parsed.hexMap,
    )

    expect(fileLoaded.hexMap).toMatchObject({
      author: 'Map Builder',
      mapNotes: 'Private notes',
    })
    expect(loaded.hexMap.author).toBe('Map Builder')
    expect(loaded.hexMap.mapNotes).toBe('')
  })

  it('loads maps created without author or notes', () => {
    const map = makeRectangleScenario()
    const loaded = buildupJsonFileMap(map.boardPieces, map.hexMap)

    expect(loaded.hexMap.author).toBe('')
    expect(loaded.hexMap.mapNotes).toBeUndefined()
  })
})
