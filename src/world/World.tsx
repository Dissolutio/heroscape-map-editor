import {
  Box,
  Button,
  ClickAwayListener,
  Stack,
  Typography,
} from '@mui/material'
import * as Sentry from '@sentry/react'
import {
  Billboard,
  Bvh,
  type CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
  Stars,
  Stats,
  Text,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Profiler } from 'react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type {
  Group,
  Object3DEventMap,
  PerspectiveCamera as ThreePerspectiveCamera,
  WebGLRenderer,
} from 'three'
import SelectedPieceReadout from '../controls/SelectedPieceReadout'
import { E2EStatus } from '../e2e/E2EStatus'
import { ReadySignal } from '../e2e/ReadySignal'
import { TestBridge } from '../e2e/TestBridge'
import useBoundStore from '../store/store'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'
import Lights from './Lights'
import LookSettingsApplier from './LookSettingsApplier'
import MapDisplay3D from './MapDisplay3D'
import AutoZoomToMap from './camera/AutoZoomToMap'
import MyCameraControls from './camera/MyCameraControls'
import { DragContext } from './drag/DragContext'
import TakeAPictureBox from './camera/TakeAPictureBox'
import PerspectiveFovApplier from './camera/PerspectiveFovApplier'
import ShadowMapInvalidator from './ShadowMapInvalidator'
import {
  PerformanceOverlay,
  PerformanceProbeGate,
} from '../performance/PerformanceOverlay'
import {
  isPerformanceEventsDisabled,
  isPerformanceEnabled,
  recordReactRender,
} from '../performance/performance'
import { clearLastPointerWorldPoint } from './hoverWorldPoint'
import LookSettingsDialog from '../layout/LookSettingsDialog'
import ActionLog from './ActionLog'
import {
  collectWebGLDiagnostics,
  collectWebGLDiagnosticsFromCanvas,
  createWebGLRenderer,
  type WebGLDiagnostics,
  WebGLContextCreationError,
} from './webglContext'

const BILLBOARD_WARMUP_MS = 4000
const WEBGL_FAILURE_SESSION_KEY = 'webgl-context-failure-reported'
let webglFailureReported = false
let webglFailureDiagnostics: WebGLDiagnostics | null = null

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const getWebGLEnvironment = () => ({
  userAgent: navigator.userAgent,
  devicePixelRatio: window.devicePixelRatio,
  tauri: isTauri(),
})

const hasReportedWebGLFailure = () => {
  if (webglFailureReported) {
    return true
  }

  try {
    if (sessionStorage.getItem(WEBGL_FAILURE_SESSION_KEY)) {
      webglFailureReported = true
      return true
    }
  } catch {
    webglFailureReported = true
    return false
  }
  webglFailureReported = true
  return false
}

function getSessionWebGLFailure() {
  let diagnostics = webglFailureDiagnostics

  if (!diagnostics) {
    try {
      const saved = sessionStorage.getItem(WEBGL_FAILURE_SESSION_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'attempts' in parsed &&
          Array.isArray(parsed.attempts)
        ) {
          diagnostics = parsed as WebGLDiagnostics
          webglFailureDiagnostics = diagnostics
          webglFailureReported = true
        }
      }
    } catch {
      return null
    }
  }

  if (!diagnostics) {
    return null
  }

  const error = new WebGLContextCreationError(diagnostics.attempts)
  error.diagnostics = diagnostics
  return error
}

function handleWebGLFailure(error: WebGLContextCreationError) {
  const diagnostics =
    error.diagnostics ??
    collectWebGLDiagnosticsFromCanvas(
      error.attempts,
      getWebGLEnvironment(),
      document.createElement('canvas'),
    )
  error.diagnostics = diagnostics
  webglFailureDiagnostics = diagnostics

  Sentry.setTag('webgl', 'failed')
  Sentry.setTag('webglRenderer', diagnostics.renderer ?? 'unavailable')
  if (!hasReportedWebGLFailure()) {
    Sentry.setContext('webgl', diagnostics)
    try {
      sessionStorage.setItem(
        WEBGL_FAILURE_SESSION_KEY,
        JSON.stringify(diagnostics),
      )
    } catch {
      webglFailureReported = true
    }
  }
}

function handleWebGLReady(renderer: WebGLRenderer) {
  if (!isTauri()) {
    return
  }

  const diagnostics = collectWebGLDiagnostics(
    [],
    getWebGLEnvironment(),
    renderer.getContext(),
    renderer.capabilities.isWebGL2,
  )
  Sentry.setTag('webgl', diagnostics.softwareRendererGuess ? 'software' : 'ok')
  Sentry.setTag('webglRenderer', diagnostics.renderer ?? 'unknown')
  Sentry.setContext('webgl', diagnostics)
}

function WebGLFailure({ error }: { error: unknown }) {
  const [copyStatus, setCopyStatus] = useState('')
  const diagnostics =
    error instanceof WebGLContextCreationError ? error.diagnostics : undefined
  const errorMessage =
    error instanceof Error ? error.message : String(error ?? 'Unknown error')

  const copyDiagnostics = async () => {
    const text = JSON.stringify(
      { error: errorMessage, ...diagnostics },
      null,
      2,
    )
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Diagnostics copied')
    } catch {
      setCopyStatus('Could not copy diagnostics')
    }
  }

  return (
    <Box
      data-testid="webgl-failure"
      role="alert"
      sx={{
        alignItems: 'center',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Stack alignItems="center" maxWidth={560} spacing={2} textAlign="center">
        <Typography component="h1" variant="h5">
          The 3D view could not start
        </Typography>
        <Typography color="text.secondary">
          This device could not create a WebGL graphics context. The 2D and PDF
          views are still available.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
          <Button
            variant="contained"
            onClick={() => useBoundStore.getState().toggleIs2DOpen(true)}
          >
            Switch to 2D view
          </Button>
          <Button onClick={copyDiagnostics}>Copy diagnostics</Button>
        </Stack>
        {copyStatus && (
          <Typography aria-live="polite" color="text.secondary">
            {copyStatus}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

const CanvasWithWebGLBoundary = Sentry.withErrorBoundary(Canvas, {
  fallback: ({ error }) => {
    if (!(error instanceof WebGLContextCreationError)) {
      throw error
    }
    return <WebGLFailure error={error} />
  },
  onError: (error) => {
    if (error instanceof WebGLContextCreationError) {
      handleWebGLFailure(error)
    }
  },
})

function WebGLCanvas(props: React.ComponentProps<typeof Canvas>) {
  const [sessionFailure] = useState(getSessionWebGLFailure)
  return sessionFailure ? (
    <WebGLFailure error={sessionFailure} />
  ) : (
    <CanvasWithWebGLBoundary {...props} />
  )
}

function BillboardWarmup() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, BILLBOARD_WARMUP_MS)

    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!isVisible) {
    return null
  }

  // Keep this tiny and off-screen: it only exists to force billboard init
  // before user-facing billboards are toggled on.
  return (
    <Billboard position={[0, 0, 0]}>
      <Text font="/fonts/Inter_18pt-Bold.ttf" fontSize={0.14} color={'white'}>
        .
      </Text>
    </Billboard>
  )
}

const World = ({
  cameraControlsRef,
  mapGroupRef,
  isHidden,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
  isHidden: boolean
}) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const fov = useBoundStore((s) => s.lookSettings.fov)
  const isFrameloopDemand = useBoundStore((s) => s.isFrameloopDemand)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const isShowActionLog = useBoundStore((s) => s.isShowActionLog)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const [isTabActive, setIsTabActive] = useState(true)
  const perspectiveCameraRef = useRef<ThreePerspectiveCamera>(null)
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
  // const isTakingPicture = useBoundStore(s => s.isTakingPicture)
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const setSelectedObjectiveMarkerUID = useBoundStore(
    (s) => s.setSelectedObjectiveMarkerUID,
  )
  const handleClickAway = () => {
    toggleHoveredPieceID('')
    // toggleSelectedPieceID('')
  }

  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: isHidden ? 'none' : 'block',
          position: 'relative',
          backgroundColor: 'var(--black)',
        }}
      >
        <WebGLCanvas
          gl={(canvas) => {
            try {
              return createWebGLRenderer(canvas)
            } catch (error) {
              if (error instanceof WebGLContextCreationError) {
                handleWebGLFailure(error)
              }
              throw error
            }
          }}
          onCreated={({ gl }) => handleWebGLReady(gl)}
          events={
            isPerformanceEventsDisabled
              ? () => ({
                  enabled: false,
                  priority: 1,
                  connected: undefined,
                })
              : undefined
          }
          onPointerMissed={(event) => {
            if (event.button !== 0) {
              return
            }
            toggleHoveredPieceID('')
            toggleSelectedPieceID('')
            setSelectedObjectiveMarkerUID(null)
          }}
          onPointerLeave={() => {
            toggleHoveredPieceID('')
            clearLastPointerWorldPoint()
          }}
          /* Setting frameloop to "never" entirely halts the GPU loop when idle */
          frameloop={
            !isTabActive ? 'never' : isFrameloopDemand ? 'demand' : 'always'
          }
          hidden={isHidden}
          shadows={isLightsAndShadowsRender ? 'percentage' : false}
        >
          {/* <Stars
            radius={100}
            depth={50}
            count={50000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          /> */}
          <LookSettingsApplier />
          <PerspectiveCamera
            ref={perspectiveCameraRef}
            position={[10, 10, 10]}
            fov={fov}
            makeDefault={!isOrthoCam}
          />
          <PerspectiveFovApplier
            cameraControlsRef={cameraControlsRef}
            perspectiveCameraRef={perspectiveCameraRef}
          />
          {/* // Example: FOV set to 15 (instead of the standard 50-75) and moved 1000 units away */}
          {/* <PerspectiveCamera
            makeDefault={!isOrthoCam}
            fov={15}
            position={[500, 500, 1000]}
            near={10}
            far={2000}
          /> */}
          <OrthographicCamera
            makeDefault={isOrthoCam}
            position={[100, 1000, 100]}
            zoom={30}
          />
          {/* Stats displays the fps */}
          {!isHidden && import.meta.env.DEV && (
            <Stats className="stats-panel" />
          )}
          {/* TOP LEFT */}
          {!isTakingPicture && (
            <axesHelper position={[0, 0.1, 0]} scale={[width, 0, length]} />
          )}

          {/* BOTTOM RIGHT */}
          {/* <axesHelper
                  position={[width, 0, length]}
                  // position={[height - HEXGRID_HEX_APOTHEM, 0, length - 1]}
                  scale={[width, 0, length]}
                // rotation={new Euler(0, Math.PI, 0)}
                /> */}
          <Bvh firstHitOnly>
            {isPerformanceEnabled ? (
              <Profiler
                id="MapDisplay3D"
                onRender={(_, __, duration) => recordReactRender(duration)}
              >
                <MapDisplay3D mapGroupRef={mapGroupRef} />
              </Profiler>
            ) : (
              <MapDisplay3D mapGroupRef={mapGroupRef} />
            )}
          </Bvh>
          <PerformanceProbeGate />
          <ShadowMapInvalidator />
          <BillboardWarmup />
          <Lights width={width} length={length} />
          {/* {!isTakingPicture && <GridHelper />} */}
          <MyCameraControls cameraControlsRef={cameraControlsRef} />
          <DragContext cameraControlsRef={cameraControlsRef} />
          <AutoZoomToMap
            cameraControlsRef={cameraControlsRef}
            mapGroupRef={mapGroupRef}
          />
          <TakeAPictureBox />
          {/* Readiness is shared with startup UI; browser hooks stay e2e-only. */}
          <ReadySignal mapGroupRef={mapGroupRef} />
          <TestBridge />
        </WebGLCanvas>
        <E2EStatus />
        {!isHidden &&
          !isTakingPicture &&
          !is2DOpen &&
          !isPdfOpen &&
          isShowActionLog && <ActionLog />}
        {isPerformanceEnabled && <PerformanceOverlay />}
        <SelectedPieceReadout cameraControlsRef={cameraControlsRef} />
        <LookSettingsDialog />
        {/* <HoveredPieceReadout /> */}
      </div>
    </ClickAwayListener>
  )
}

export default World
