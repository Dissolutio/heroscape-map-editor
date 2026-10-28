import { Box, Button, Typography } from '@mui/material'
import { useFrame, useThree } from '@react-three/fiber'
import { useSnackbar } from 'notistack'
import { useEffect, useRef, useState } from 'react'
import { Vector3 } from 'three'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import {
  getMonotonicLeakMetrics,
  isPerformanceBenchmark,
  isPerformanceEnabled,
  performanceSeconds,
  startPerformanceCollection,
  type LeakSample,
  type PerformanceSnapshot,
} from './performance'

type PerformanceController = ReturnType<typeof startPerformanceCollection>
type BenchmarkPhase = 'orbit' | 'pointer' | null

let activeController: PerformanceController | null = null
let benchmarkPhase: BenchmarkPhase = null
let pointerSweepActive = false
let lastSnapshot: PerformanceSnapshot | null = null
let benchmarkResults: Record<string, unknown>[] = []
let leakResults: { samples: LeakSample[]; growing: string[] } | null = null

const nextFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

function PerformanceProbe() {
  const { gl, scene, camera } = useThree()
  const restorePose = useRef<{
    position: Vector3
    quaternion: typeof camera.quaternion
  } | null>(null)

  useEffect(() => {
    const collection = startPerformanceCollection(gl.domElement, gl, scene)
    activeController = collection
    window.dispatchEvent(new Event('hexoscape-performance-ready'))
    const publish = () => {
      lastSnapshot = collection.takeSnapshot()
      window.dispatchEvent(
        new CustomEvent('hexoscape-performance-snapshot', {
          detail: lastSnapshot,
        }),
      )
    }
    const interval = window.setInterval(publish, 1000)
    return () => {
      window.clearInterval(interval)
      collection.stop()
      if (activeController === collection) activeController = null
    }
  }, [gl, scene])

  useFrame((_, delta) => {
    activeController?.sampleFrame(performance.now())
    if (benchmarkPhase === 'orbit') {
      if (!restorePose.current) {
        restorePose.current = {
          position: camera.position.clone(),
          quaternion: camera.quaternion.clone(),
        }
      }
      camera.position.applyAxisAngle(new Vector3(0, 1, 0), delta * 0.12)
      camera.lookAt(0, 0, 0)
    } else if (restorePose.current) {
      camera.position.copy(restorePose.current.position)
      camera.quaternion.copy(restorePose.current.quaternion)
      restorePose.current = null
    }
  })

  return null
}

function dispatchPointerSweep(canvas: HTMLCanvasElement) {
  const bounds = canvas.getBoundingClientRect()
  let step = 0
  let requestID = 0
  pointerSweepActive = true
  const move = () => {
    if (!pointerSweepActive) return
    const columns = 18
    const rows = 12
    const column = step % columns
    const row = Math.floor(step / columns) % rows
    const clientX = bounds.left + ((column + 0.5) / columns) * bounds.width
    const clientY = bounds.top + ((row + 0.5) / rows) * bounds.height
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX,
        clientY,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    )
    step += 1
    requestID = window.requestAnimationFrame(move)
  }
  requestID = window.requestAnimationFrame(move)
  return () => {
    pointerSweepActive = false
    window.cancelAnimationFrame(requestID)
  }
}

async function measurePhase(
  phase: Exclude<BenchmarkPhase, null>,
  seconds: number,
) {
  const controller = activeController
  if (!controller) throw new Error('Performance collection is not ready')
  const startFrame = controller.frameCount()
  const startCounters = controller.counterTotals()
  const startedAt = performance.now()
  benchmarkPhase = phase
  const canvas = document.querySelector('canvas')
  const stopPointerSweep =
    phase === 'pointer' && canvas
      ? dispatchPointerSweep(canvas)
      : () => undefined
  await new Promise<void>((resolve) =>
    window.setTimeout(resolve, seconds * 1000),
  )
  benchmarkPhase = null
  stopPointerSweep()
  await nextFrame()
  const durationSeconds = (performance.now() - startedAt) / 1000
  const endCounters = controller.counterTotals()
  const pointerEvents = endCounters.pointerEvents - startCounters.pointerEvents
  return {
    durationSeconds,
    ...controller.frameStatsSince(startFrame),
    storeUpdatesPerSecond:
      (endCounters.storeUpdates - startCounters.storeUpdates) / durationSeconds,
    pointerEventsPerSecond: pointerEvents / durationSeconds,
    raycastMsPerPointerMove:
      (endCounters.raycastTimeMs - startCounters.raycastTimeMs) /
      Math.max(pointerEvents, 1),
    reactCommitsPerSecond:
      (endCounters.reactCommits - startCounters.reactCommits) / durationSeconds,
    reactRenderMsPerSecond:
      (endCounters.reactRenderTimeMs - startCounters.reactRenderTimeMs) /
      durationSeconds,
  }
}

async function loadBenchmarkMap() {
  const response = await fetch('/json-maps/All_Tiles_SVG_Test.json')
  if (!response.ok) {
    throw new Error(`Could not load benchmark map (${response.status})`)
  }
  const savedMap = await response.json()
  const map = buildupJsonFileMap(savedMap.boardPieces, savedMap.hexMap)
  useBoundStore.getState().loadMap(map, { holdAutosave: true })
}

async function runBenchmark() {
  await loadBenchmarkMap()
  const store = useBoundStore.getState()
  const controller = activeController
  if (!controller) throw new Error('Performance collection is not ready')
  const previousSettings = {
    tier: useBoundStore.getState().graphicsTier,
    lights: useBoundStore.getState().isLightsAndShadowsRender,
  }
  const configurations: { tier: 'low' | 'medium'; lights: boolean }[] = [
    { tier: 'low', lights: false },
    { tier: 'low', lights: true },
    ...(new URLSearchParams(window.location.search).get('perHexLand') === '1'
      ? [
          { tier: 'medium' as const, lights: false },
          { tier: 'medium' as const, lights: true },
        ]
      : []),
  ]
  benchmarkResults = []
  try {
    for (const configuration of configurations) {
      await store.setGraphicsTier(configuration.tier)
      if (
        configuration.tier === 'medium' &&
        useBoundStore.getState().textureLoadStatus !== 'ready'
      ) {
        continue
      }
      useBoundStore
        .getState()
        .toggleIsLightsAndShadowsRender(configuration.lights)
      await nextFrame()
      await nextFrame()
      controller.resetDrawCallSources()
      const camera = await measurePhase('orbit', performanceSeconds)
      const pointer = await measurePhase('pointer', performanceSeconds)
      const resources = controller.takeSnapshot()
      const result = {
        renderer:
          new URLSearchParams(window.location.search).get('perHexLand') === '1'
            ? 'per-hex'
            : 'old',
        ...configuration,
        environment: {
          devicePixelRatio: window.devicePixelRatio,
          canvasWidth: document.querySelector('canvas')?.clientWidth ?? 0,
          canvasHeight: document.querySelector('canvas')?.clientHeight ?? 0,
          drawingBufferWidth: document.querySelector('canvas')?.width ?? 0,
          drawingBufferHeight: document.querySelector('canvas')?.height ?? 0,
          glRenderer: resources.glRenderer,
        },
        resources,
        camera,
        pointer,
      }
      benchmarkResults.push(result)
      console.table([result])
    }
  } finally {
    await store.setGraphicsTier(previousSettings.tier)
    useBoundStore
      .getState()
      .toggleIsLightsAndShadowsRender(previousSettings.lights)
  }
  console.table(benchmarkResults)
  window.dispatchEvent(
    new CustomEvent('hexoscape-performance-benchmark-complete', {
      detail: benchmarkResults,
    }),
  )
}

async function runLeakCheck() {
  const canvas = document.querySelector('canvas')
  if (!canvas || !activeController) return
  await loadBenchmarkMap()
  const stopPointerSweep = dispatchPointerSweep(canvas)
  const samples: LeakSample[] = []
  const startedAt = performance.now()
  while (performance.now() - startedAt < 120_000) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 5000))
    const snapshot = activeController?.takeSnapshot()
    if (!snapshot) break
    samples.push({
      sceneObjects: snapshot.sceneObjects,
      geometries: snapshot.geometries,
      textures: snapshot.textures,
      programs: snapshot.programs,
      jsHeapBytes: snapshot.jsHeapBytes,
      storeSubscribers: snapshot.storeSubscribers,
      pendingTimers: snapshot.pendingTimers,
      pendingAnimationFrames: snapshot.pendingAnimationFrames,
    })
    console.table(samples)
  }
  stopPointerSweep()
  leakResults = { samples, growing: getMonotonicLeakMetrics(samples) }
  console.info('Performance leak check', leakResults)
  window.dispatchEvent(
    new CustomEvent('hexoscape-performance-leak-complete', {
      detail: leakResults,
    }),
  )
}

export function PerformanceOverlay() {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(
    lastSnapshot,
  )
  const [running, setRunning] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const onSnapshot = (event: Event) => {
      setSnapshot((event as CustomEvent<PerformanceSnapshot>).detail ?? null)
    }
    const onComplete = () => setRunning(false)
    window.addEventListener('hexoscape-performance-snapshot', onSnapshot)
    window.addEventListener(
      'hexoscape-performance-benchmark-complete',
      onComplete,
    )
    window.addEventListener('hexoscape-performance-leak-complete', onComplete)
    const startAutomaticBenchmark = () => {
      if (
        isPerformanceBenchmark &&
        activeController &&
        !sessionStorage.getItem('hexoscape-perf-benchmark-ran')
      ) {
        sessionStorage.setItem('hexoscape-perf-benchmark-ran', '1')
        setRunning(true)
        void runBenchmark()
          .catch((error: unknown) =>
            enqueueSnackbar(`Performance benchmark failed: ${String(error)}`, {
              variant: 'error',
            }),
          )
          .finally(() => setRunning(false))
      }
    }
    window.addEventListener(
      'hexoscape-performance-ready',
      startAutomaticBenchmark,
    )
    startAutomaticBenchmark()
    return () => {
      window.removeEventListener('hexoscape-performance-snapshot', onSnapshot)
      window.removeEventListener(
        'hexoscape-performance-benchmark-complete',
        onComplete,
      )
      window.removeEventListener(
        'hexoscape-performance-leak-complete',
        onComplete,
      )
      window.removeEventListener(
        'hexoscape-performance-ready',
        startAutomaticBenchmark,
      )
    }
  }, [enqueueSnackbar])

  if (!isPerformanceEnabled) return null

  const visibleMetrics = snapshot
    ? [
        `Frame: ${snapshot.frameAverageMs.toFixed(2)} ms avg / ${snapshot.frameP95Ms.toFixed(2)} ms p95`,
        `FPS: ${snapshot.fps.toFixed(1)}`,
        `Draw calls: ${snapshot.drawCalls} | triangles: ${snapshot.triangles}`,
        `Geometries: ${snapshot.geometries} | textures: ${snapshot.textures} | programs: ${snapshot.programs}`,
        `Heap: ${snapshot.jsHeapBytes === null ? 'unavailable' : `${(snapshot.jsHeapBytes / 1048576).toFixed(1)} MiB`}`,
        `Store: ${snapshot.storeUpdatesPerSecond.toFixed(1)}/s | pointer: ${snapshot.pointerEventsPerSecond.toFixed(1)}/s`,
        `Raycast: ${snapshot.raycastMsPerPointerMove.toFixed(3)} ms/pointer`,
        `React MapDisplay3D: ${snapshot.reactCommitsPerSecond.toFixed(1)} commits/s, ${snapshot.reactRenderMsPerSecond.toFixed(1)} ms/s`,
        `Scene objects: ${snapshot.sceneObjects} | subscribers: ${snapshot.storeSubscribers} | timers: ${snapshot.pendingTimers} | rAF: ${snapshot.pendingAnimationFrames}`,
        `Typed arrays: ${(snapshot.typedArrayBytes / 1048576).toFixed(1)} MiB total | geometry ${(snapshot.geometryTypedArrayBytes / 1048576).toFixed(1)} MiB | texture ${(snapshot.textureCpuBytes / 1048576).toFixed(1)} MiB`,
        `Instances: ${snapshot.instanceMeshCount} meshes | matrices ${(snapshot.instanceMatrixBytes / 1048576).toFixed(1)} MiB | ${snapshot.instanceAttributeCount} attributes / ${(snapshot.instanceAttributeBytes / 1048576).toFixed(1)} MiB`,
        `Texture arrays: ${snapshot.textureArrayCount} | decoded CPU ${(snapshot.decodedTextureCpuBytes / 1048576).toFixed(1)} MiB | manifest ${(snapshot.manifestBytes / 1024).toFixed(1)} KiB`,
        `Top draw-call sources: ${snapshot.topDrawCallSources.map(({ source, drawCalls, triangles }) => `${source} ${drawCalls} calls / ${triangles} tris`).join('; ') || 'Collecting…'}`,
        `DPR: ${snapshot.devicePixelRatio} | canvas: ${snapshot.canvasWidth}×${snapshot.canvasHeight} CSS / ${snapshot.drawingBufferWidth}×${snapshot.drawingBufferHeight} px`,
        `GL renderer: ${snapshot.glRenderer}`,
      ]
    : ['Collecting performance data…']

  return (
    <Box
      data-testid="performance-overlay"
      sx={{
        position: 'absolute',
        zIndex: 20,
        top: 8,
        right: 8,
        maxWidth: 'min(540px, 90vw)',
        p: 1,
        color: 'white',
        bgcolor: 'rgba(0, 0, 0, 0.82)',
        fontFamily: 'monospace',
        fontSize: 11,
      }}
    >
      {visibleMetrics.map((metric) => (
        <Typography key={metric} component="div" fontSize="inherit">
          {metric}
        </Typography>
      ))}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
        <Button
          size="small"
          disabled={running}
          onClick={() => {
            setRunning(true)
            void runBenchmark()
              .catch((error: unknown) =>
                enqueueSnackbar(
                  `Performance benchmark failed: ${String(error)}`,
                  { variant: 'error' },
                ),
              )
              .finally(() => setRunning(false))
          }}
        >
          {running ? 'Running…' : `Run ${performanceSeconds}s benchmark`}
        </Button>
        <Button
          size="small"
          disabled={running}
          onClick={() => {
            setRunning(true)
            void runLeakCheck().finally(() => setRunning(false))
          }}
        >
          Run 120s leak check
        </Button>
        <Button
          size="small"
          onClick={async () => {
            const payload = JSON.stringify(
              { snapshot, benchmarkResults, leakResults },
              null,
              2,
            )
            try {
              await navigator.clipboard.writeText(payload)
              enqueueSnackbar('Performance JSON copied', { variant: 'success' })
            } catch {
              enqueueSnackbar('Could not access the clipboard', {
                variant: 'warning',
              })
            }
          }}
        >
          Copy JSON
        </Button>
      </Box>
    </Box>
  )
}

export function PerformanceProbeGate() {
  return isPerformanceEnabled ? <PerformanceProbe /> : null
}
