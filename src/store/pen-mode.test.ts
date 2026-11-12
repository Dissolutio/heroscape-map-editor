import { createStore } from 'zustand/vanilla'
import { describe, expect, it, vi } from 'vitest'
import { Pieces } from '../types'
import type { AppState } from './store'

const { loadTerrainTextureArrays } = vi.hoisted(() => ({
  loadTerrainTextureArrays: vi.fn(),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))
vi.mock('../world/textures/terrainTextureArrays', () => ({
  loadTerrainTextureArrays,
}))

async function createUISliceStore() {
  vi.resetModules()
  const { default: createUISlice } = await import('./ui-slice')
  return createStore<AppState>()(
    (...args) => ({ ...createUISlice(...args) }) as AppState,
  )
}

describe('family pen mode selection', () => {
  it('updates Ship Wall to Ship Bow when its size changes and selects Wall again', async () => {
    const store = await createUISliceStore()
    const state = store.getState()

    state.togglePenMode(Pieces.shipWall)
    state.togglePieceSize(2)
    expect(store.getState()).toMatchObject({
      penMode: Pieces.shipBow,
      pieceSize: 2,
      lastPenMode: Pieces.shipBow,
      lastPenSize: 2,
    })

    store.getState().togglePenMode(Pieces.shipWall)
    expect(store.getState()).toMatchObject({
      penMode: Pieces.shipWall,
      pieceSize: 1,
      lastPenMode: Pieces.shipWall,
      lastPenSize: 1,
    })
  })

  it('updates Laur Jungle Tree to Underbrush and selects the tree again', async () => {
    const store = await createUISliceStore()

    store.getState().togglePenMode(Pieces.laurPalm13)
    store.getState().togglePieceSize(4)
    expect(store.getState()).toMatchObject({
      penMode: Pieces.laurBrush10,
      pieceSize: 4,
      lastPenMode: Pieces.laurBrush10,
      lastPenSize: 4,
    })

    store.getState().togglePenMode(Pieces.laurPalm13)
    expect(store.getState()).toMatchObject({
      penMode: Pieces.laurPalm13,
      pieceSize: 1,
      lastPenMode: Pieces.laurPalm13,
      lastPenSize: 1,
    })
  })

  it('restores the selected family member and size after Select mode', async () => {
    const store = await createUISliceStore()

    store.getState().togglePenMode(Pieces.shipWall)
    store.getState().togglePieceSize(2)
    store.getState().togglePenMode('select')
    store.getState().toggleLastPenMode()

    expect(store.getState()).toMatchObject({
      penMode: Pieces.shipBow,
      pieceSize: 2,
      lastPenMode: Pieces.shipBow,
      lastPenSize: 2,
    })
  })
})
