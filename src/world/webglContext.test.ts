import { describe, expect, it, vi } from 'vitest'
import type { WebGLRenderer, WebGLRendererParameters } from 'three'
import {
  collectWebGLDiagnosticsFromCanvas,
  createWebGLRenderer,
  WebGLContextCreationError,
} from './webglContext'

describe('createWebGLRenderer', () => {
  const canvas = {} as HTMLCanvasElement

  it('retries without antialiasing when the first configuration fails', () => {
    const renderer = {} as WebGLRenderer
    const createRenderer = vi
      .fn<(params: WebGLRendererParameters) => WebGLRenderer>()
      .mockImplementationOnce(() => {
        throw new Error('context attributes rejected')
      })
      .mockReturnValueOnce(renderer)

    expect(createWebGLRenderer(canvas, createRenderer)).toBe(renderer)
    expect(createRenderer).toHaveBeenCalledTimes(2)
    expect(createRenderer.mock.calls[0][0]).toMatchObject({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    expect(createRenderer.mock.calls[1][0]).toMatchObject({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })
  })

  it('tries default power preference after antialiasing fails', () => {
    const createRenderer = vi
      .fn<(params: WebGLRendererParameters) => WebGLRenderer>()
      .mockImplementationOnce(() => {
        throw new Error('high-performance rejected')
      })
      .mockImplementationOnce(() => {
        throw new Error('antialias rejected')
      })
      .mockReturnValueOnce({} as WebGLRenderer)

    createWebGLRenderer(canvas, createRenderer)

    expect(createRenderer).toHaveBeenCalledTimes(3)
    expect(createRenderer.mock.calls[2][0]).toMatchObject({
      antialias: false,
      powerPreference: 'default',
    })
  })

  it('reports all failed attempts when no configuration works', () => {
    const createRenderer = vi.fn(() => {
      throw new Error('no context')
    })

    let thrownError: unknown
    try {
      createWebGLRenderer(canvas, createRenderer)
    } catch (error) {
      thrownError = error
    }

    expect(thrownError).toBeInstanceOf(WebGLContextCreationError)
    expect(thrownError).toMatchObject({
      attempts: [
        { name: 'current', error: 'no context' },
        { name: 'antialias-off', error: 'no context' },
        { name: 'default-power-preference', error: 'no context' },
      ],
    })
  })
})

describe('collectWebGLDiagnosticsFromCanvas', () => {
  it('collects browser and context data when the debug extension is missing', () => {
    const context = {
      MAX_TEXTURE_SIZE: 3379,
      getExtension: vi.fn(() => null),
      getParameter: vi.fn(() => 8192),
    } as unknown as WebGL2RenderingContext
    const canvas = {
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement
    const diagnostics = collectWebGLDiagnosticsFromCanvas(
      [{ name: 'current', error: 'failed' }],
      {
        userAgent: 'test browser',
        devicePixelRatio: 2,
        tauri: true,
      },
      canvas,
    )

    expect(diagnostics).toMatchObject({
      userAgent: 'test browser',
      devicePixelRatio: 2,
      tauri: true,
      maxTextureSize: 8192,
      webgl2: true,
      vendor: null,
      renderer: null,
      softwareRendererGuess: false,
      attempts: [{ name: 'current', error: 'failed' }],
    })
    expect(context.getExtension).toHaveBeenCalledWith(
      'WEBGL_debug_renderer_info',
    )
  })

  it('guesses software rendering from the unmasked renderer', () => {
    const extension = {
      UNMASKED_VENDOR_WEBGL: 37445,
      UNMASKED_RENDERER_WEBGL: 37446,
    }
    const context = {
      MAX_TEXTURE_SIZE: 3379,
      getExtension: vi.fn(() => extension),
      getParameter: vi.fn((parameter: number) => {
        if (parameter === 3379) return 4096
        if (parameter === 37445) return 'Google'
        return 'ANGLE (Google, SwiftShader)'
      }),
    } as unknown as WebGL2RenderingContext
    const canvas = {
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement

    expect(
      collectWebGLDiagnosticsFromCanvas(
        [],
        { userAgent: 'test', devicePixelRatio: 1, tauri: false },
        canvas,
      ),
    ).toMatchObject({
      vendor: 'Google',
      renderer: 'ANGLE (Google, SwiftShader)',
      softwareRendererGuess: true,
    })
  })

  it('records WebGL 1 as insufficient for the current renderer', () => {
    const context = {
      MAX_TEXTURE_SIZE: 3379,
      getExtension: vi.fn(() => null),
      getParameter: vi.fn(() => 4096),
    } as unknown as WebGLRenderingContext
    const canvas = {
      getContext: vi.fn((type: string) => (type === 'webgl' ? context : null)),
    } as unknown as HTMLCanvasElement
    const diagnostics = collectWebGLDiagnosticsFromCanvas(
      [],
      { userAgent: 'test', devicePixelRatio: 1, tauri: false },
      canvas,
    )

    expect(diagnostics.webgl2).toBe(false)
    expect(diagnostics.maxTextureSize).toBe(4096)
    expect(diagnostics.webgl1Fallback).toContain('Unavailable')
  })
})
