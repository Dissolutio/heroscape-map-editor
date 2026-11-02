import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rotateSelectedPieces } from '../controls/rotateSelectedPieces'
import { placementBlockedMessages } from '../data/placement'
import {
  getRotationHotkeyTarget,
  isRotationHotkeyReady,
} from '../data/rotationHotkey'
import useBoundStore from '../store/store'
import type { CubeCoordinate } from '../types'
import { makeTable, place } from './helpers/board'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

describe('rotation hotkey priority', () => {
  it.each([
    ['dragging with a selection and marker', true, 1, true, 'drag'],
    ['selected pieces before a marker', false, 1, true, 'selection'],
    ['selected objective marker', false, 0, true, 'objective-marker'],
    ['pen mode when nothing is selected', false, 0, false, 'pen-mode'],
  ] as const)('targets %s', (_name, isDragging, count, marker, target) => {
    expect(
      getRotationHotkeyTarget({
        isDragging,
        selectedPieceCount: count,
        hasSelectedObjectiveMarker: marker,
      }),
    ).toBe(target)
  })

  it('throttles repeated non-drag hotkeys at the wheel cooldown', () => {
    expect(isRotationHotkeyReady(null, 0)).toBe(true)
    expect(isRotationHotkeyReady(0, 119)).toBe(false)
    expect(isRotationHotkeyReady(0, 120)).toBe(true)
  })
})

describe('selected-piece rotation hotkeys', () => {
  beforeEach(() => {
    useBoundStore.temporal.getState().clear()
  })

  it('uses the button rotation behavior and records one undo step', () => {
    const placed = place({
      board: makeTable(8),
      pieceID: 'g1',
      uid: 'ROTATE',
      at: { q: 2, r: 2, s: -4 },
      altitude: 0,
    })
    if (placed.error) throw new Error(String(placed.error))
    useBoundStore.setState({
      boardHexes: placed.board.boardHexes,
      boardPieces: placed.board.boardPieces,
      selectedPieceIDs: ['ROTATE'],
      rotationPivot: null,
    })
    useBoundStore.temporal.getState().clear()

    rotateSelectedPieces(-1)

    expect(useBoundStore.getState().boardPieces[0].rotation).toBe(5)
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    useBoundStore.temporal.getState().undo()
    expect(useBoundStore.getState().boardPieces[0].rotation).toBe(0)
  })

  it('shows the existing refusal when a group rotation leaves the map', async () => {
    const table = makeTable(5)
    const coordinates = Object.values(table.boardHexes)
      .filter((hex) => hex.altitude === 0)
      .map(({ q, r, s }) => ({ q, r, s }))
    const onMap = new Set(coordinates.map(coordKey))
    const pivot = coordinates.find((candidate) =>
      coordinates.some(
        (member) =>
          coordKey(candidate) !== coordKey(member) &&
          !onMap.has(coordKey(rotateAroundPivot(member, candidate, 1))),
      ),
    )
    if (!pivot) throw new Error('Could not find an off-map rotation fixture')
    const member = coordinates.find(
      (candidate) =>
        coordKey(candidate) !== coordKey(pivot) &&
        !onMap.has(coordKey(rotateAroundPivot(candidate, pivot, 1))),
    )
    if (!member) throw new Error('Could not find an off-map member')

    const first = place({
      board: table,
      pieceID: 'g1',
      uid: 'PIVOT',
      at: pivot,
      altitude: 0,
    })
    if (first.error) throw new Error(String(first.error))
    const second = place({
      board: first.board,
      pieceID: 'r1',
      uid: 'MEMBER',
      at: member,
      altitude: 0,
    })
    if (second.error) throw new Error(String(second.error))
    useBoundStore.setState({
      boardHexes: second.board.boardHexes,
      boardPieces: second.board.boardPieces,
      selectedPieceIDs: ['MEMBER', 'PIVOT'],
      rotationPivot: null,
    })
    useBoundStore.temporal.getState().clear()

    rotateSelectedPieces(1)

    const { enqueueSnackbar } = await import('notistack')
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: placementBlockedMessages.offMap,
        variant: 'warning',
      }),
    )
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(0)
    expect(useBoundStore.getState().boardPieces).toEqual(
      second.board.boardPieces,
    )
  })
})

const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`

function rotateAroundPivot(
  coords: CubeCoordinate,
  pivot: CubeCoordinate,
  direction: 1 | -1,
) {
  const relative = {
    q: coords.q - pivot.q,
    r: coords.r - pivot.r,
    s: coords.s - pivot.s,
  }
  const rotated =
    direction === 1
      ? { q: -relative.r, r: -relative.s, s: -relative.q }
      : { q: -relative.s, r: -relative.q, s: -relative.r }
  return {
    q: pivot.q + rotated.q,
    r: pivot.r + rotated.r,
    s: pivot.s + rotated.s,
  }
}
