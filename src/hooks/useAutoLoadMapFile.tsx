import { closeSnackbar, useSnackbar } from 'notistack'
import React, { type RefObject, useEffect } from 'react'
import { useLocation, useSearch } from 'wouter'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import { genRandomMapName } from '../utils/genRandomMapName'
import {
  getBoardHexesRectangularMapDimensions,
  getBoardPiecesMaxLevel,
  normalizeBoardPieces,
} from '../utils/map-utils'
import { Button } from '@mui/material'
import { LS_KEYS } from '../local-storage/keys'
import { noop } from 'lodash'
import { ROUTES } from '../ROUTES'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import { Box3, type Group, type Object3DEventMap } from 'three'
import { zoomToMap } from '../utils/camera-utils'
import type { CameraControls } from '@react-three/drei'
import type { BoardHexes } from '../types'

type Props = {
  mapGroupRef: RefObject<Group<Object3DEventMap>>
  cameraControlsRef: RefObject<CameraControls>
}

const useAutoLoadMapFile = (props: Props) => {
  const loadMap = useBoundStore((s) => s.loadMap)
  const { clear: clearUndoHistory } = useBoundStore.temporal.getState()
  const { enqueueSnackbar } = useSnackbar()
  const searchString = useSearch()

  const [, navigate] = useLocation()

  // USE EFFECT: automatically load up map from URL, OR from file
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on-load
  useEffect(() => {
    // Map might be loaded from local storage already
    const queryParams = new URLSearchParams(searchString)
    const urlMapString = queryParams.get('m')
    const isLocal = localStorage.getItem(LS_KEYS.lastMapCache)
    const localMapCache = isLocal ? JSON.parse(isLocal) : undefined
    const localMapCacheMapState = buildupJsonFileMap(localMapCache.boardPieces, localMapCache.hexMap)
    // If url map, load it and offer to load last local storage
    if (urlMapString) {
      try {
        const { hexMap, boardPiecesEncodedArr } =
          parseMapDataArrayFromCrushed(urlMapString)
        // const fullBoardPieces = inflateBoardPiecesFromIds(boardPiecesEncodedArr)
        const jsonMap = buildupJsonFileMap(boardPiecesEncodedArr, hexMap)
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = genRandomMapName()
        }
        const action = () => (
          <>
            <Button
              color="info"
              variant="contained"
              onClick={() => {
                // load last map instead, close original snackbar, open a new one, remove map from URL bar
                localMapCache ? loadMap(localMapCacheMapState) : noop()
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
        })
        loadMap(jsonMap)
        clearUndoHistory() // clear undo history, initial load should not be undoable
        if (props.mapGroupRef.current && props.cameraControlsRef.current) {
          // Create a new bounding box from the updated group.
          const box = new Box3().setFromObject(props.mapGroupRef.current)
          // Tell CameraControls to fit to the new bounding box (this magically allows zoomToMap (and hotkey usage) to work again, do not know how)
          props.cameraControlsRef.current?.fitToBox(box, true)
        }
        const { width, length } = getBoardHexesRectangularMapDimensions(
          jsonMap.boardHexes,
        )
        setTimeout(() => {
          zoomToMap(props.mapGroupRef, props.cameraControlsRef, width, length)
        }, 1000)
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
      loadMap(localMapCacheMapState)
      enqueueSnackbar({
        message: `Loaded last map: ${localMapCache.hexMap.name}`,
        variant: 'success',
      })

      if (props.mapGroupRef.current && props.cameraControlsRef.current) {
        // Create a new bounding box from the updated group.
        const box = new Box3().setFromObject(props.mapGroupRef.current)
        // Tell CameraControls to fit to the new bounding box (this magically allows zoomToMap (and hotkey usage) to work again, do not know how)
        props.cameraControlsRef.current?.fitToBox(box, true)
      }
      const { width, length } = getBoardHexesRectangularMapDimensions(
        localMapCache.boardHexes,
      )
      setTimeout(() => {
        zoomToMap(props.mapGroupRef, props.cameraControlsRef, width, length)
      }, 1000)
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
        loadMap(jsonMap)
        const { width, length } = getBoardHexesRectangularMapDimensions(
          jsonMap.boardHexes,
        )
        setTimeout(() => {
          zoomToMap(props.mapGroupRef, props.cameraControlsRef, width, length)
        }, 1000)
        enqueueSnackbar({
          // message: `Loaded map "${jsonMap.hexMap.name}" from file: "${fileName}"`,
          message: 'WELCOME!',
          variant: 'success',
          autoHideDuration: 5000,
        })
        clearUndoHistory() // clear undo history, initial load should not be undoable
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default useAutoLoadMapFile
