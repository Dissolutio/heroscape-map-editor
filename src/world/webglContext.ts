import { WebGLRenderer, type WebGLRendererParameters } from 'three'

export type WebGLAttemptFailure = {
  name: string
  error: string
}

export class WebGLContextCreationError extends Error {
  attempts: WebGLAttemptFailure[]
  diagnostics?: WebGLDiagnostics

  constructor(attempts: WebGLAttemptFailure[]) {
    super('Unable to create a WebGL 2 context.')
    this.name = 'WebGLContextCreationError'
    this.attempts = attempts
  }
}

export type WebGLContextInfo = {
  vendor: string | null
  renderer: string | null
  maxTextureSize: number | null
  webgl2: boolean
  softwareRendererGuess: boolean
}

export type WebGLDiagnostics = {
  attempts: WebGLAttemptFailure[]
  userAgent: string
  devicePixelRatio: number
  tauri: boolean
  vendor: string | null
  renderer: string | null
  maxTextureSize: number | null
  webgl2: boolean
  softwareRendererGuess: boolean
  webgl1Fallback: string
}

type RendererFactory = (params: WebGLRendererParameters) => WebGLRenderer

const rendererAttempts = [
  {
    name: 'current',
    options: { antialias: true, powerPreference: 'high-performance' },
  },
  {
    name: 'antialias-off',
    options: { antialias: false, powerPreference: 'high-performance' },
  },
  {
    name: 'default-power-preference',
    options: { antialias: false, powerPreference: 'default' },
  },
] as const

export function createWebGLRenderer(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  createRenderer: RendererFactory = (params) => new WebGLRenderer(params),
): WebGLRenderer {
  const failures: WebGLAttemptFailure[] = []

  for (const attempt of rendererAttempts) {
    try {
      return createRenderer({
        canvas,
        alpha: true,
        ...attempt.options,
      })
    } catch (error) {
      failures.push({
        name: attempt.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  throw new WebGLContextCreationError(failures)
}

export function readWebGLContextInfo(
  context: WebGLRenderingContext | WebGL2RenderingContext | null,
  webgl2: boolean,
): WebGLContextInfo {
  let vendor: string | null = null
  let renderer: string | null = null
  let maxTextureSize: number | null = null

  if (context) {
    try {
      maxTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE)
      const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        vendor = context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        renderer = context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      }
    } catch {
      vendor = null
      renderer = null
      maxTextureSize = null
    }
  }

  return {
    vendor,
    renderer,
    maxTextureSize,
    webgl2,
    softwareRendererGuess:
      renderer !== null &&
      /swiftshader|llvmpipe|Microsoft Basic Render Driver/i.test(renderer),
  }
}

export function collectWebGLDiagnostics(
  attempts: WebGLAttemptFailure[],
  environment: {
    userAgent: string
    devicePixelRatio: number
    tauri: boolean
  },
  context: WebGLRenderingContext | WebGL2RenderingContext | null,
  webgl2: boolean,
): WebGLDiagnostics {
  return {
    attempts,
    ...environment,
    ...readWebGLContextInfo(context, webgl2),
    webgl1Fallback:
      'Unavailable: Three.js WebGLRenderer requires WebGL 2 (since r163).',
  }
}

export function collectWebGLDiagnosticsFromCanvas(
  attempts: WebGLAttemptFailure[],
  environment: {
    userAgent: string
    devicePixelRatio: number
    tauri: boolean
  },
  canvas: HTMLCanvasElement,
): WebGLDiagnostics {
  let context: WebGLRenderingContext | WebGL2RenderingContext | null = null
  let webgl2 = false

  try {
    context = canvas.getContext('webgl2')
    webgl2 = context !== null
  } catch {
    context = null
  }

  if (!context) {
    try {
      context = canvas.getContext('webgl')
    } catch {
      context = null
    }
  }

  return collectWebGLDiagnostics(attempts, environment, context, webgl2)
}
