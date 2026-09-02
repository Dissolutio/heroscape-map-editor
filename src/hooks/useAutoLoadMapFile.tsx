import { closeSnackbar, useSnackbar } from 'notistack'
import { useEffect } from 'react'
import { useLocation, useSearch } from 'wouter'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import { genRandomMapName } from '../utils/genRandomMapName'
import {
  inflateBoardPiecesFromIds,
  normalizeBoardPieces,
} from '../utils/map-utils'
import { Button } from '@mui/material'
import { LS_KEYS } from '../local-storage/keys'
import { ROUTES } from '../ROUTES'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'

const useAutoLoadMapFile = () => {
  const loadMap = useBoundStore((s) => s.loadMap)
  const toggleIs2DOpen = useBoundStore((s) => s.toggleIs2DOpen)
  const toggleIsPdfOpen = useBoundStore((s) => s.toggleIsPdfOpen)
  const { enqueueSnackbar } = useSnackbar()
  const searchString = useSearch()

  const [, navigate] = useLocation()

  const applyViewModeFromQuery = (queryParams: URLSearchParams) => {
    const viewMode = queryParams.get('v')
    if (viewMode === 'a') {
      toggleIsPdfOpen(true)
      return
    }

    if (viewMode === 'b') {
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
    const queryParams = new URLSearchParams(searchString)
    applyViewModeFromQuery(queryParams)
    const urlMapString = queryParams.get('m')
    const isLocal = localStorage.getItem(LS_KEYS.lastMapCache)
    const localMapCache = isLocal ? JSON.parse(isLocal) : undefined
    const localMapCacheMapState = localMapCache
      ? buildupJsonFileMap(
          normalizeBoardPieces(localMapCache.boardPieces),
          localMapCache.hexMap,
        )
      : undefined
    const loadMapWithoutUndo = (
      mapState: ReturnType<typeof buildupJsonFileMap>,
    ) => {
      const temporal = useBoundStore.temporal.getState()
      temporal.pause()
      loadMap(mapState)
      temporal.clear()
      temporal.resume()
    }
    // If url map, load it and offer to load last local storage
    if (urlMapString) {
      try {
        const { hexMap, boardPiecesEncodedArr } =
          parseMapDataArrayFromCrushed(urlMapString)
        const inflatedBoardPieces = inflateBoardPiecesFromIds(
          boardPiecesEncodedArr,
        )
        const jsonMap = buildupJsonFileMap(inflatedBoardPieces, hexMap)
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = genRandomMapName()
        }
        // Skip the snackbar notification for DEV env
        if (!import.meta.env.DEV) {
          const action = () => (
            <>
              {localMapCacheMapState ? (
                <Button
                  color="info"
                  variant="contained"
                  onClick={() => {
                    // load last map instead, close original snackbar, open a new one, remove map from URL bar
                    loadMapWithoutUndo(localMapCacheMapState)
                    closeSnackbar(snackbarId)
                    enqueueSnackbar({
                      message: `Loaded last map instead: ${localMapCacheMapState.hexMap.name}`,
                      variant: 'success',
                    })
                    navigate(ROUTES.heroscapeHome)
                  }}
                >
                  Load last map instead
                </Button>
              ) : null}
              <Button
                color="warning"
                variant="contained"
                onClick={() => {
                  closeSnackbar(snackbarId)
                }}
              >
                Close
              </Button>
            </>
          )

          const snackbarId = enqueueSnackbar({
            message: `Loaded map from URL: ${jsonMap.hexMap.name}.`,
            variant: 'success',
            action,
            autoHideDuration: null,
          })
        }
        loadMapWithoutUndo(jsonMap)
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
    } else if (localMapCacheMapState) {
      loadMapWithoutUndo(localMapCacheMapState)
      enqueueSnackbar({
        message: `Loaded last map: ${localMapCache.hexMap.name}`,
        variant: 'success',
      })
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

        const jsonMap = buildupJsonFileMap(
          normalizeBoardPieces(data.boardPieces),
          data.hexMap,
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
