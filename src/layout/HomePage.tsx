import { Box } from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import React, { Suspense, useEffect, useRef, useState } from 'react'
import type { Group, Object3DEventMap } from 'three'
import { ControlsWidthContextProvider } from '../controls/useControlWidth'
import useAppUpdater from '../hooks/useAppUpdater'
import {
  isE2E,
  isPerHexLandEnabled,
  isWhatsNewE2EOptIn,
} from '../e2e/isE2E'
import { useAppReady } from '../e2e/useAppReady'
import useAutoLoadMapFile from '../hooks/useAutoLoadMapFile'
import { EditPieceInventoryDialog } from '../inventory/EditPieceInventoryDialog'
import ViewMapInventoryDialog from '../inventory/ViewMapInventoryDialog'
import { useLocalPieceInventory } from '../local-storage/useLocalPieceInventory'
import useBoundStore from '../store/store'
import { lazyWithRetry } from '../utils/lazyWithRetry'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'
import { decideReleaseNotes, type ReleaseNoteEntry } from '../data/releaseNotes'
import { LS_KEYS } from '../local-storage/keys'
import {
  safeGetJSON,
  safeHasItem,
  safeSetItem,
} from '../local-storage/safeStorage'
import { ControlTabs } from './ControlTabs'
import CreateMapFormDialog from './CreateMapFormDialog'
import EditMapFormDialog from './EditMapFormDialog'
import { HeaderNav } from './HeaderNav'
import LoadMapFromUrlDialog from './LoadMapFromUrlDialog'
import PiecesGridDialog from './PiecesGridDialog'
import CropMapPortraitDialog from './CropMapPortraitDialog'
import { useMuiMediaQuery } from './useMuiMediaQuery'
import WhatsNewDialog, { releaseNoteEntries } from './WhatsNewDialog'
// 1. Define your lazy-loaded components
const ReactPdfRoot = lazyWithRetry(() => import('../pdf-map/ReactPdfRoot'))
const SvgMapDisplay = lazyWithRetry(() => import('../svg-map/SvgMapDisplay'))
const World = lazyWithRetry(() => import('../world/World'))
import { useApplyHotkeys } from '../controls/useApplyHotkeys'
import { useHotkeyConfig } from '../controls/useHotkeyConfig'

export default function HomePage() {
  // Keep the persisted personal inventory mirrored into zustand so terrain
  // constraints can use it even before the inventory dialog is opened.
  useLocalPieceInventory()
  const cameraControlsRef = React.useRef<CameraControls>(null)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const mapGroupRef = React.useRef<Group<Object3DEventMap> | null>(null)
  const controlsContainerRef = React.useRef(null)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces, boardHexes)
  const isAppReady = useAppReady()
  const { isCheckingUpdate, isUpdatePromptOpen } = useAppUpdater()
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false)
  const [whatsNewEntries, setWhatsNewEntries] = useState<ReleaseNoteEntry[]>([])
  const startupCheckHandled = useRef(false)

  // MUI BREAKPOINTS
  //   xs, extra-small: 0px
  // sm, small: 600px
  // md, medium: 900px
  // lg, large: 1200px
  // xl, extra-large: 1536px
  const { isSideControls } = useMuiMediaQuery()

  // EFFECT: update doc title
  useEffect(() => {
    if (hexMap.name) {
      const prevTitle = document.title
      document.title = hexMap.name
      return () => {
        document.title = prevTitle
      }
    }
  }, [hexMap.name])

  // USE EFFECT: toggle viewing level when new map is loaded. (Zooming to the
  // new map happens inside the 3D scene, see world/camera/AutoZoomToMap.tsx.)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <run on map change>
  useEffect(() => {
    toggleViewingLevel(maxLevel)
  }, [hexMap.id])

  // USE EFFECT: a saved Medium or High graphics tier starts as Lowest every
  // session, so load its textures once at startup.
  useEffect(() => {
    const { graphicsTier, setGraphicsTier } = useBoundStore.getState()
    if (isPerHexLandEnabled && graphicsTier !== 'low') {
      void setGraphicsTier(graphicsTier)
    }
  }, [])

  // USE EFFECT: automatically load up map from URL, OR from file
  useAutoLoadMapFile()
  const { hotkeyConfig } = useHotkeyConfig()
  useApplyHotkeys({ hotkeyConfig, cameraControlsRef, mapGroupRef })

  useEffect(() => {
    if (
      startupCheckHandled.current ||
      !isAppReady ||
      isCheckingUpdate ||
      isUpdatePromptOpen
    ) {
      return
    }
    startupCheckHandled.current = true

    const hasStoredId = safeHasItem(LS_KEYS.whatsNewLastSeen)
    if (hasStoredId === null) return
    const storedId = hasStoredId
      ? safeGetJSON<string>(LS_KEYS.whatsNewLastSeen)
      : null
    const decision = decideReleaseNotes(
      releaseNoteEntries,
      typeof storedId === 'string' ? storedId : null,
      true,
    )
    if (decision.shouldStore && decision.newestId) {
      safeSetItem(LS_KEYS.whatsNewLastSeen, JSON.stringify(decision.newestId))
      return
    }
    if (decision.entriesToShow.length > 0 && (!isE2E || isWhatsNewE2EOptIn)) {
      setWhatsNewEntries(decision.entriesToShow)
      setIsWhatsNewOpen(true)
    }
  }, [isAppReady, isCheckingUpdate, isUpdatePromptOpen])

  const openLatestWhatsNew = () => {
    setWhatsNewEntries(releaseNoteEntries.slice(0, 5))
    setIsWhatsNewOpen(true)
  }

  const closeWhatsNew = () => {
    setIsWhatsNewOpen(false)
    const newestId = releaseNoteEntries[0]?.id
    if (newestId) {
      safeSetItem(LS_KEYS.whatsNewLastSeen, JSON.stringify(newestId))
    }
  }

  return (
    <>
      <WhatsNewDialog
        open={isWhatsNewOpen}
        entries={whatsNewEntries}
        onClose={closeWhatsNew}
      />
      <CreateMapFormDialog />
      <EditMapFormDialog />
      <CropMapPortraitDialog />
      <EditPieceInventoryDialog />
      <ViewMapInventoryDialog />
      <PiecesGridDialog cameraControlsRef={cameraControlsRef} />
      <LoadMapFromUrlDialog />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          padding: 0,
          margin: 0,
        }}
      >
        <HeaderNav onOpenWhatsNew={openLatestWhatsNew} />
        <Box
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: isSideControls ? 'row-reverse' : 'column',
            width: '100%',
            padding: 0,
            margin: 0,
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              flexGrow: 1,
              width: isSideControls ? 'calc(100% - 70vw)' : '100%',
              height: isSideControls ? '100%' : '70vh',
            }}
          >
            {isPdfOpen && (
              <Suspense fallback={<div>Loading page...</div>}>
                <ReactPdfRoot />
              </Suspense>
            )}
            {is2DOpen && !isPdfOpen && (
              <Suspense fallback={<div>Loading page...</div>}>
                <SvgMapDisplay />
              </Suspense>
            )}
            {!is2DOpen && !isPdfOpen && (
              <Suspense fallback={<div>Loading page...</div>}>
                <World
                  isHidden={is2DOpen || isPdfOpen}
                  cameraControlsRef={cameraControlsRef}
                  mapGroupRef={mapGroupRef}
                />
              </Suspense>
            )}
          </Box>
          <ControlsWidthContextProvider containerRef={controlsContainerRef}>
            <div
              style={{
                display: 'flex',
                flexFlow: 'column nowrap',
                width: isSideControls ? 'var(--controls-width)' : '100%',
                flexBasis: isSideControls
                  ? 'var(--controls-width)'
                  : 'max(30vh, 250px)',
                height: isSideControls ? '100%' : 'max(30vh, 250px)',
                background: 'var(--black)',
                overflow: 'auto',
                transition: 'height 0.5s ease-in-out',
              }}
            >
              <ControlTabs
                cameraControlsRef={cameraControlsRef}
                mapGroupRef={mapGroupRef}
                controlsContainerRef={controlsContainerRef}
              />
            </div>
          </ControlsWidthContextProvider>
        </Box>
      </div>
    </>
  )
}
