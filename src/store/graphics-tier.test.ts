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

    expect(loadTerrainTextureArrays).toHaveBeenNthCalledWith(2, 'medium', {
      onProgress: expect.any(Function),
    })
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

  it('falls back to Medium when High texture loading fails', async () => {
    loadTerrainTextureArrays
      .mockResolvedValueOnce({
        error: new Error('PBR offline'),
        status: 'error',
      })
      .mockResolvedValueOnce({
        manifest: {},
        status: 'ready',
        textures: { 'caps-diffuse.png': {}, 'sides-diffuse.png': {} },
      })
    const store = await createUISliceStore()

    await store.getState().setGraphicsTier('high')

    expect(loadTerrainTextureArrays).toHaveBeenNthCalledWith(
      1,
      'high',
      expect.objectContaining({ onProgress: expect.any(Function) }),
    )
    expect(loadTerrainTextureArrays).toHaveBeenNthCalledWith(
      2,
      'medium',
      expect.objectContaining({ onProgress: expect.any(Function) }),
    )
    expect(store.getState()).toMatchObject({
      graphicsTier: 'high',
      effectiveGraphicsTier: 'medium',
      textureLoadStatus: 'fallback',
      textureLoadProgress: { loaded: 2, total: 2 },
    })
  })

  it('enables lights and shadows when High is selected', async () => {
    loadTerrainTextureArrays.mockResolvedValue({
      manifest: {},
      status: 'ready',
      textures: {},
    })
    const store = await createUISliceStore()

    await store.getState().setGraphicsTier('high')

    expect(store.getState()).toMatchObject({
      graphicsTier: 'high',
      effectiveGraphicsTier: 'high',
      textureLoadStatus: 'ready',
      isLightsAndShadowsRender: true,
    })
    store.getState().toggleIsLightsAndShadowsRender(false)
    expect(store.getState().isLightsAndShadowsRender).toBe(false)
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

  it('seeds the placement preview from the latest pointer hit on pen switch', async () => {
    const store = await createUISliceStore()
    const { clearLastPointerWorldPoint, rememberPointerWorldPoint } =
      await import('../world/hoverWorldPoint')
    store.getState().togglePenMode('select')
    rememberPointerWorldPoint({ x: 2, z: 3 })

    store.getState().togglePenMode('g')

    expect(store.getState().hoveredWorldPoint).toEqual({ x: 2, z: 3 })
    clearLastPointerWorldPoint()
  })
})
