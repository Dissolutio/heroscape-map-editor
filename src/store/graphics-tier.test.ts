import { createStore } from 'zustand/vanilla'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from './store'

const { loadTerrainTextureArrays, enqueueSnackbar } = vi.hoisted(() => ({
  loadTerrainTextureArrays: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))

vi.mock('../world/textures/terrainTextureArrays', () => ({
  loadTerrainTextureArrays,
}))
vi.mock('notistack', () => ({ enqueueSnackbar }))

async function createUISliceStore() {
  vi.resetModules()
  const { default: createUISlice } = await import('./ui-slice')
  return createStore<AppState>()(
    (...args) => ({ ...createUISlice(...args) }) as AppState,
  )
}

afterEach(() => {
  loadTerrainTextureArrays.mockReset()
  enqueueSnackbar.mockReset()
  vi.restoreAllMocks()
})

describe('graphics tier store state', () => {
  it('does not load textures when Lowest is selected', async () => {
    const store = await createUISliceStore()
    await store.getState().setGraphicsTier('low')

    expect(loadTerrainTextureArrays).not.toHaveBeenCalled()
    expect(store.getState()).toMatchObject({
      graphicsTier: 'low',
      effectiveGraphicsTier: 'low',
      textureLoadStatus: 'idle',
    })
  })

  it('falls back to Lowest after a failed download without changing preference', async () => {
    loadTerrainTextureArrays.mockResolvedValue({
      error: new Error('offline'),
      status: 'error',
    })
    const store = await createUISliceStore()

    await store.getState().setGraphicsTier('high')

    expect(store.getState()).toMatchObject({
      graphicsTier: 'high',
      effectiveGraphicsTier: 'low',
      textureLoadStatus: 'error',
    })
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not load terrain textures: offline',
        variant: 'error',
      }),
    )
  })

  it('ignores a stale load result after the user selects Lowest', async () => {
    let finishLoad:
      | ((result: {
          manifest: object
          status: 'ready'
          textures: object
        }) => void)
      | undefined
    loadTerrainTextureArrays.mockReturnValue(
      new Promise((resolve) => {
        finishLoad = resolve
      }),
    )
    const store = await createUISliceStore()

    const loading = store.getState().setGraphicsTier('medium')
    await store.getState().setGraphicsTier('low')
    finishLoad?.({ manifest: {}, status: 'ready', textures: {} })
    await loading

    expect(store.getState()).toMatchObject({
      graphicsTier: 'low',
      effectiveGraphicsTier: 'low',
      textureLoadStatus: 'idle',
    })
    expect(enqueueSnackbar).not.toHaveBeenCalled()
  })
})
