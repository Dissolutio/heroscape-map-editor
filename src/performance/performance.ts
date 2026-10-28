import {
  InstancedMesh,
  InstancedBufferAttribute,
  Mesh,
  Raycaster,
  type BufferAttribute,
  type Scene,
  type WebGLRenderer,
} from 'three'
import useBoundStore from '../store/store'
import { getTerrainTextureArrayStats } from '../world/textures/terrainTextureArrays'
import { getTrackedStoreSubscribers } from './performanceFlags'

export {
  isPerformanceBenchmark,
  isPerformanceEnabled,
  performanceSeconds,
} from './performanceFlags'

export type PerformanceSnapshot = {
  fps: number
  frameAverageMs: number
  frameP95Ms: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  programs: number
  jsHeapBytes: number | null
  storeUpdatesPerSecond: number
  pointerEventsPerSecond: number
  raycastMsPerPointerMove: number
  reactCommitsPerSecond: number
  reactRenderMsPerSecond: number
  sceneObjects: number
  storeSubscribers: number
  pendingTimers: number
  pendingAnimationFrames: number
  devicePixelRatio: number
  canvasWidth: number
  canvasHeight: number
  drawingBufferWidth: number
  drawingBufferHeight: number
  glRenderer: string
  typedArrayBytes: number
  geometryTypedArrayBytes: number
  textureCpuBytes: number
  instanceMeshCount: number
  instanceMatrixBytes: number
  instanceAttributeCount: number
  instanceAttributeBytes: number
  decodedTextureCpuBytes: number
  manifestBytes: number
  textureArrayCount: number
  topDrawCallSources: DrawCallSource[]
}

export type DrawCallSource = {
  source: string
  drawCalls: number
  triangles: number
}

export type LeakSample = Pick<
  PerformanceSnapshot,
  | 'sceneObjects'
  | 'geometries'
  | 'textures'
  | 'programs'
  | 'jsHeapBytes'
  | 'storeSubscribers'
  | 'pendingTimers'
  | 'pendingAnimationFrames'
>

type StoreListener = Parameters<typeof useBoundStore.subscribe>[0]

let frameTimes: number[] = []
let previousFrameTime: number | undefined
let storeUpdates = 0
let pointerEvents = 0
let raycastTimeMs = 0
let reactCommits = 0
let reactRenderTimeMs = 0
let pendingTimers = new Set<number>()
let pendingAnimationFrames = new Set<number>()
let lastSnapshotAt = 0
let lastStoreUpdates = 0
let lastPointerEvents = 0
let lastRaycastTimeMs = 0
let lastReactCommits = 0
let lastReactRenderTimeMs = 0
const drawCallTotals = new Map<string, DrawCallSource>()
const instrumentedMeshes = new Set<Mesh>()
const originalOnBeforeRender = new WeakMap<Mesh, Mesh['onBeforeRender']>()

const getSceneObjectCount = (scene: Scene) => {
  let count = 0
  scene.traverse(() => {
    count += 1
  })
  return count
}

function addArrayBytes(value: unknown, seen: Set<ArrayBufferLike>) {
  if (!ArrayBuffer.isView(value)) return 0
  const buffer = value.buffer
  if (seen.has(buffer)) return 0
  seen.add(buffer)
  return buffer.byteLength
}

function getPieceSource(object: Mesh) {
  let current: Mesh | null = object
  while (current) {
    const inventoryID = current.userData.inventoryID
    if (typeof inventoryID === 'string') return inventoryID
    current = current.parent as Mesh | null
  }
  return 'Land / other'
}

function getDrawTriangles(mesh: Mesh, renderGroup: unknown) {
  const geometry = mesh.geometry
  const totalCount =
    geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0
  const groupCount =
    renderGroup &&
    typeof renderGroup === 'object' &&
    'count' in renderGroup &&
    typeof renderGroup.count === 'number'
      ? renderGroup.count
      : geometry.drawRange.count
  const count = Math.min(totalCount, groupCount)
  return (
    Math.floor(count / 3) * (mesh instanceof InstancedMesh ? mesh.count : 1)
  )
}

function instrumentDrawCallSources(scene: Scene) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh) || originalOnBeforeRender.has(object)) return
    const original = object.onBeforeRender
    originalOnBeforeRender.set(object, original)
    instrumentedMeshes.add(object)
    object.onBeforeRender = function (
      this: Mesh,
      renderer,
      renderedScene,
      camera,
      geometry,
      material,
      group,
    ) {
      const source = getPieceSource(this)
      const total = drawCallTotals.get(source) ?? {
        source,
        drawCalls: 0,
        triangles: 0,
      }
      total.drawCalls += 1
      total.triangles += getDrawTriangles(this, group)
      drawCallTotals.set(source, total)
      original.call(
        this,
        renderer,
        renderedScene,
        camera,
        geometry,
        material,
        group,
      )
    }
  })
}

export function getSceneMemoryStats(scene: Scene) {
  const allBuffers = new Set<ArrayBufferLike>()
  const geometryBuffers = new Set<ArrayBufferLike>()
  const textureBuffers = new Set<ArrayBufferLike>()
  const instanceMatrixBuffers = new Set<ArrayBufferLike>()
  const instanceAttributeBuffers = new Set<ArrayBufferLike>()
  let instanceMeshCount = 0
  let instanceAttributeCount = 0

  scene.traverse((object) => {
    const mesh = object as Mesh
    if (mesh.geometry) {
      for (const attribute of Object.values(mesh.geometry.attributes)) {
        if (attribute instanceof InstancedBufferAttribute) {
          instanceAttributeCount += 1
          addArrayBytes(attribute.array, instanceAttributeBuffers)
        } else {
          addArrayBytes((attribute as BufferAttribute).array, geometryBuffers)
        }
      }
      if (mesh.geometry.index) {
        addArrayBytes(mesh.geometry.index.array, geometryBuffers)
      }
    }
    if (mesh instanceof InstancedMesh) {
      instanceMeshCount += 1
      addArrayBytes(mesh.instanceMatrix.array, instanceMatrixBuffers)
      if (mesh.instanceColor) {
        addArrayBytes(mesh.instanceColor.array, instanceAttributeBuffers)
      }
    }
    if (mesh.material) {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value && typeof value === 'object' && 'isTexture' in value) {
            const texture = value as {
              image?: { data?: unknown }
              source?: { data?: { data?: unknown } }
            }
            addArrayBytes(
              texture.source?.data?.data ?? texture.image?.data,
              textureBuffers,
            )
          }
        }
      }
    }
  })

  for (const buffer of geometryBuffers) allBuffers.add(buffer)
  for (const buffer of textureBuffers) allBuffers.add(buffer)
  for (const buffer of instanceMatrixBuffers) allBuffers.add(buffer)
  for (const buffer of instanceAttributeBuffers) allBuffers.add(buffer)
  const byteLength = (buffers: Set<ArrayBufferLike>) =>
    [...buffers].reduce((total, buffer) => total + buffer.byteLength, 0)
  return {
    typedArrayBytes: byteLength(allBuffers),
    geometryTypedArrayBytes: byteLength(geometryBuffers),
    textureCpuBytes: byteLength(textureBuffers),
    instanceMeshCount,
    instanceMatrixBytes: byteLength(instanceMatrixBuffers),
    instanceAttributeCount,
    instanceAttributeBytes: byteLength(instanceAttributeBuffers),
  }
}

const recordStoreUpdate: StoreListener = () => {
  storeUpdates += 1
}

export function startPerformanceCollection(
  canvas: HTMLCanvasElement,
  renderer: WebGLRenderer,
  scene: Scene,
) {
  drawCallTotals.clear()
  instrumentedMeshes.clear()
  frameTimes = []
  previousFrameTime = undefined
  storeUpdates = 0
  pointerEvents = 0
  raycastTimeMs = 0
  reactCommits = 0
  reactRenderTimeMs = 0
  lastSnapshotAt = performance.now()
  lastStoreUpdates = 0
  lastPointerEvents = 0
  lastRaycastTimeMs = 0
  lastReactCommits = 0
  lastReactRenderTimeMs = 0
  pendingTimers = new Set()
  pendingAnimationFrames = new Set()

  const onPointerMove = () => {
    pointerEvents += 1
  }
  canvas.addEventListener('pointermove', onPointerMove, true)
  const unsubscribe = useBoundStore.subscribe(recordStoreUpdate)

  const originalIntersectObject = Raycaster.prototype.intersectObject
  const originalIntersectObjects = Raycaster.prototype.intersectObjects
  const timedIntersectObject = function (
    this: Raycaster,
    ...args: Parameters<typeof originalIntersectObject>
  ) {
    const start = performance.now()
    try {
      return Reflect.apply(originalIntersectObject, this, args)
    } finally {
      raycastTimeMs += performance.now() - start
    }
  } as typeof originalIntersectObject
  const timedIntersectObjects = function (
    this: Raycaster,
    ...args: Parameters<typeof originalIntersectObjects>
  ) {
    const start = performance.now()
    try {
      return Reflect.apply(originalIntersectObjects, this, args)
    } finally {
      raycastTimeMs += performance.now() - start
    }
  } as typeof originalIntersectObjects
  Raycaster.prototype.intersectObject = timedIntersectObject
  Raycaster.prototype.intersectObjects = timedIntersectObjects

  const originalSetTimeout = window.setTimeout
  const originalClearTimeout = window.clearTimeout
  const originalRequestAnimationFrame =
    window.requestAnimationFrame.bind(window)
  const originalCancelAnimationFrame = window.cancelAnimationFrame.bind(window)
  const setTimeoutWithTracking = ((
    callback: TimerHandler,
    delay?: number,
    ...args: unknown[]
  ) => {
    let handle: number
    if (typeof callback !== 'function') {
      handle = Reflect.apply(originalSetTimeout, window, [
        callback,
        delay,
        ...args,
      ]) as number
      pendingTimers.add(handle)
      Reflect.apply(originalSetTimeout, window, [
        () => pendingTimers.delete(handle),
        delay,
      ])
      return handle
    }
    const wrapped = (...callbackArgs: unknown[]) => {
      pendingTimers.delete(handle)
      callback(...(callbackArgs as never[]))
    }
    handle = Reflect.apply(originalSetTimeout, window, [
      wrapped,
      delay,
      ...args,
    ]) as number
    pendingTimers.add(handle)
    return handle
  }) as unknown as typeof window.setTimeout
  const clearTimeoutWithTracking = ((handle: number) => {
    pendingTimers.delete(handle)
    Reflect.apply(originalClearTimeout, window, [handle])
  }) as typeof window.clearTimeout
  const requestAnimationFrameWithTracking: typeof window.requestAnimationFrame =
    (callback) => {
      let handle = 0
      handle = originalRequestAnimationFrame((time) => {
        pendingAnimationFrames.delete(handle)
        callback(time)
      })
      pendingAnimationFrames.add(handle)
      return handle
    }
  const cancelAnimationFrameWithTracking: typeof window.cancelAnimationFrame = (
    handle,
  ) => {
    pendingAnimationFrames.delete(handle)
    originalCancelAnimationFrame(handle)
  }
  window.setTimeout = setTimeoutWithTracking
  window.clearTimeout = clearTimeoutWithTracking
  window.requestAnimationFrame = requestAnimationFrameWithTracking
  window.cancelAnimationFrame = cancelAnimationFrameWithTracking

  const sampleFrame = (now: number) => {
    if (previousFrameTime !== undefined) {
      frameTimes.push(now - previousFrameTime)
      if (frameTimes.length > 12000) frameTimes.shift()
    }
    previousFrameTime = now
  }

  const percentile = (values: number[], fraction: number) => {
    if (!values.length) return 0
    const sorted = [...values].sort((a, b) => a - b)
    return (
      sorted[
        Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))
      ] ?? 0
    )
  }

  const takeSnapshot = (): PerformanceSnapshot => {
    instrumentDrawCallSources(scene)
    const now = performance.now()
    const elapsedSeconds = Math.max((now - lastSnapshotAt) / 1000, 0.001)
    const recentFrames = frameTimes.slice(-60)
    const frameAverageMs = recentFrames.length
      ? recentFrames.reduce((total, frame) => total + frame, 0) /
        recentFrames.length
      : 0
    const memory = renderer.info.memory
    const context = renderer.getContext()
    const heapBytes =
      'memory' in performance
        ? (
            performance as Performance & {
              memory?: { usedJSHeapSize?: number }
            }
          ).memory?.usedJSHeapSize
        : undefined
    const snapshot: PerformanceSnapshot = {
      fps: frameAverageMs ? 1000 / frameAverageMs : 0,
      frameAverageMs,
      frameP95Ms: percentile(recentFrames, 0.95),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
      programs: renderer.info.programs?.length ?? 0,
      jsHeapBytes: heapBytes ?? null,
      storeUpdatesPerSecond: (storeUpdates - lastStoreUpdates) / elapsedSeconds,
      pointerEventsPerSecond:
        (pointerEvents - lastPointerEvents) / elapsedSeconds,
      raycastMsPerPointerMove:
        (raycastTimeMs - lastRaycastTimeMs) /
        Math.max(pointerEvents - lastPointerEvents, 1),
      reactCommitsPerSecond: (reactCommits - lastReactCommits) / elapsedSeconds,
      reactRenderMsPerSecond:
        (reactRenderTimeMs - lastReactRenderTimeMs) / elapsedSeconds,
      sceneObjects: getSceneObjectCount(scene),
      storeSubscribers: getTrackedStoreSubscribers(),
      pendingTimers: pendingTimers.size,
      pendingAnimationFrames: pendingAnimationFrames.size,
      devicePixelRatio: window.devicePixelRatio,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
      drawingBufferWidth: canvas.width,
      drawingBufferHeight: canvas.height,
      glRenderer: String(context.getParameter(context.RENDERER)),
      ...getSceneMemoryStats(scene),
      decodedTextureCpuBytes: getTerrainTextureArrayStats().cpuBytes,
      manifestBytes: getTerrainTextureArrayStats().manifestBytes,
      textureArrayCount: getTerrainTextureArrayStats().textureArrayCount,
      topDrawCallSources: [...drawCallTotals.values()]
        .sort((a, b) => b.drawCalls - a.drawCalls)
        .slice(0, 15),
    }
    lastSnapshotAt = now
    lastStoreUpdates = storeUpdates
    lastPointerEvents = pointerEvents
    lastRaycastTimeMs = raycastTimeMs
    lastReactCommits = reactCommits
    lastReactRenderTimeMs = reactRenderTimeMs
    return snapshot
  }

  return {
    sampleFrame,
    takeSnapshot,
    instrumentDrawCallSources: () => instrumentDrawCallSources(scene),
    resetDrawCallSources: () => drawCallTotals.clear(),
    frameStatsSince: (start: number) => {
      const values = frameTimes.slice(start)
      if (!values.length) return { averageMs: 0, p95Ms: 0, count: 0 }
      const sorted = [...values].sort((a, b) => a - b)
      return {
        averageMs:
          values.reduce((total, frame) => total + frame, 0) / values.length,
        p95Ms:
          sorted[
            Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length))
          ] ?? 0,
        count: values.length,
      }
    },
    counterTotals: () => ({
      storeUpdates,
      pointerEvents,
      raycastTimeMs,
      reactCommits,
      reactRenderTimeMs,
    }),
    frameCount: () => frameTimes.length,
    stop: () => {
      for (const mesh of instrumentedMeshes) {
        const original = originalOnBeforeRender.get(mesh)
        if (original && mesh.onBeforeRender !== original) {
          mesh.onBeforeRender = original
        }
        originalOnBeforeRender.delete(mesh)
      }
      instrumentedMeshes.clear()
      canvas.removeEventListener('pointermove', onPointerMove, true)
      unsubscribe()
      if (Raycaster.prototype.intersectObject === timedIntersectObject) {
        Raycaster.prototype.intersectObject = originalIntersectObject
      }
      if (Raycaster.prototype.intersectObjects === timedIntersectObjects) {
        Raycaster.prototype.intersectObjects = originalIntersectObjects
      }
      window.setTimeout = originalSetTimeout
      window.clearTimeout = originalClearTimeout
      window.requestAnimationFrame = originalRequestAnimationFrame
      window.cancelAnimationFrame = originalCancelAnimationFrame
      pendingTimers.clear()
      pendingAnimationFrames.clear()
    },
  }
}

export function recordReactRender(durationMs: number) {
  reactCommits += 1
  reactRenderTimeMs += durationMs
}

export function getMonotonicLeakMetrics(samples: LeakSample[]) {
  if (samples.length < 3) return []
  const keys: (keyof LeakSample)[] = [
    'sceneObjects',
    'geometries',
    'textures',
    'programs',
    'jsHeapBytes',
    'storeSubscribers',
    'pendingTimers',
    'pendingAnimationFrames',
  ]
  return keys.filter((key) => {
    const values = samples.map((sample) => sample[key])
    const numericValues = values.filter(
      (value): value is number => typeof value === 'number',
    )
    return (
      numericValues.length === values.length &&
      numericValues
        .slice(1)
        .every((value, index) => value >= (numericValues[index] ?? value)) &&
      numericValues.some(
        (value, index) =>
          index > 0 && value > (numericValues[index - 1] ?? value),
      )
    )
  })
}
