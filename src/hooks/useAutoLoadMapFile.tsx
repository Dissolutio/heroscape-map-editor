import { Button, IconButton } from '@mui/material'
import { type SnackbarKey, closeSnackbar, useSnackbar } from 'notistack'
import { useEffect } from 'react'
import { MdClose } from 'react-icons/md'
import { useLocation, useSearch } from 'wouter'
import { ROUTES } from '../ROUTES'
import { buildupJsonFileMap } from '../data/buildupMap'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import { readMapFromLocalStorage } from '../local-storage/get-local-item'
import { LS_KEYS } from '../local-storage/keys'
import { safeRemove } from '../local-storage/safeStorage'
import useBoundStore from '../store/store'
import { genRandomMapName } from '../utils/genRandomMapName'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import {
  getMapShareUrlParams,
  getViewModeFromQueryParam,
} from '../utils/mapShareUrl'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'

const useAutoLoadMapFile = () => {
  const loadMap = useBoundStore((s) => s.loadMap)
  const toggleIs2DOpen = useBoundStore((s) => s.toggleIs2DOpen)
  const toggleIsPdfOpen = useBoundStore((s) => s.toggleIsPdfOpen)
  const { enqueueSnackbar } = useSnackbar()
  const searchString = useSearch()

  const [, navigate] = useLocation()

  const applyViewModeFromQuery = (viewModeParam: string | null) => {
    const viewMode = getViewModeFromQueryParam(viewModeParam)
    if (viewMode === 'pdf') {
      toggleIsPdfOpen(true)
      return
    }

    if (viewMode === '2d') {
      toggleIs2DOpen(true)
      return
    }

    toggleIs2DOpen(false)
    toggleIsPdfOpen(false)
  }

  // USE EFFECT: automatically load up map from URL, OR from file
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on-load
  useEffect(() => {
    // Map might be loaded from local storage already
    const { m: urlMapString, v: viewModeParam } =
      getMapShareUrlParams(searchString)
    applyViewModeFromQuery(viewModeParam)
    safeRemove('hotkeyConfig')
    safeRemove('terrainConstraintState')
    safeRemove('lastMapCache')
    const localMap = readMapFromLocalStorage(LS_KEYS.lastMap)
    const localMapState = localMap
      ? buildupJsonFileMap(
          localMap.map.boardPieces,
          localMap.map.hexMap,
          localMap.droppedPieces,
        )
      : undefined
    const loadMapWithoutUndo = (
      mapState: ReturnType<typeof buildupJsonFileMap>,
      holdAutosave = true,
    ) => {
      const temporal = useBoundStore.temporal.getState()
      temporal.pause()
      loadMap(mapState, { holdAutosave })
      temporal.clear()
      temporal.resume()
    }
    // If url map, load it and offer to load last local storage
    if (urlMapString) {
      try {
        const { hexMap, boardPiecesEncodedArr } =
          parseMapDataArrayFromCrushed(urlMapString)
        const normalizedPieces = normalizeBoardPiecesWithDropped(
          boardPiecesEncodedArr,
        )
        const jsonMap = buildupJsonFileMap(
          normalizedPieces.boardPieces,
          hexMap,
          normalizedPieces.droppedPieces,
        )
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = genRandomMapName()
        }
        // Skip the snackbar notification for DEV env
        if (!import.meta.env.DEV) {
          const action = (snackbarId: SnackbarKey) => (
            <>
              {localMapState ? (
                <Button
                  color="info"
                  variant="contained"
                  onClick={() => {
                    // load last map instead, close original snackbar, open a new one, remove map from URL bar
                    loadMapWithoutUndo(localMapState, false)
                    warnAboutLoadedMap(enqueueSnackbar, localMapState)
                    closeSnackbar(snackbarId)
                    enqueueSnackbar({
                      message: `Loaded last map instead: ${localMapState.hexMap.name}`,
                      variant: 'success',
                    })
                    navigate(ROUTES.heroscapeHome)
                  }}
                >
                  Load last map instead
                </Button>
              ) : null}
              <IconButton
                color="warning"
                title="Dismiss notification"
                aria-label="Dismiss notification"
                onClick={() => {
                  closeSnackbar(snackbarId)
                }}
              >
                <MdClose />
              </IconButton>
            </>
          )

          enqueueSnackbar({
            message: `Loaded map from URL: ${jsonMap.hexMap.name}.`,
            variant: 'success',
            action,
            autoHideDuration: null,
          })
        }
        loadMapWithoutUndo(jsonMap)
        warnAboutLoadedMap(enqueueSnackbar, jsonMap)
        return

        // biome-ignore lint/suspicious/noExplicitAny: <error could be anything>
      } catch (error: any) {
        enqueueSnackbar({
          message: `Error loading map from URL: ${error?.message ?? error}`,
          variant: 'error',
          autoHideDuration: 5000,
        })
        console.error('🚀 ~ React.useEffect ~ error:', error)
        return
      }
    } else if (localMapState) {
      loadMapWithoutUndo(localMapState)
      enqueueSnackbar({
        message: `Loaded last map: ${localMapState.hexMap.name}`,
        variant: 'success',
      })
      warnAboutLoadedMap(enqueueSnackbar, localMapState)
    } else {
      // No url and no prev state? auto load a file

      // AUTO VSCAPE
      // const fileName = '/ladders.hsc'
      // fetch(fileName)
      //   .then((response) => {
      //     return response.arrayBuffer()
      //   })
      //   .then((arrayBuffer) => {
      //     const vsFileData = processVirtualScapeArrayBuffer(arrayBuffer)
      //     // buildupVSFileMap should return errorArr for enqueueSnackbar
      //     const vsMap = buildupVSFileMap(
      //       vsFileData.tiles,
      //       vsFileData?.name ?? fileName,
      //     )
      //     loadMap(vsMap)
      //     enqueueSnackbar(
      //       `Automatically loaded Virtualscape map named: "${vsMap.hexMap.name}" from file: "${fileName}"`,
      //     )
      //   })
      // AUTO JSON
      const fileName = '/json-maps/AoA_1_The_Shattered_Table.json'
      fetch(fileName).then(async (response) => {
        const data = await response.json()

        const normalizedPieces = normalizeBoardPiecesWithDropped(
          data.boardPieces,
        )
        const jsonMap = buildupJsonFileMap(
          normalizedPieces.boardPieces,
          data.hexMap,
          normalizedPieces.droppedPieces,
        )
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = fileName
        }
        loadMapWithoutUndo(jsonMap)
        enqueueSnackbar({
          message: 'WELCOME!',
          variant: 'success',
          autoHideDuration: 5000,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default useAutoLoadMapFile
