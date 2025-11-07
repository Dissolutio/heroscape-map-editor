import { closeSnackbar, useSnackbar } from 'notistack'
import React, { useEffect } from 'react'
import { useLocation, useSearch } from 'wouter'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import type { BoardHexes, BoardPiece } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'
import {
  decodePieceID,
  getBoardPiecesMaxLevel,
  inflateBoardPiecesFromIds,
  normalizeBoardPieces,
} from '../utils/map-utils'
import { Button } from '@mui/material'
import { LS_KEYS } from '../local-storage/keys'
import { noop } from 'lodash'
import { ROUTES } from '../ROUTES'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import { nanoid } from 'nanoid'

type Props = {
  boardHexes?: BoardHexes
}

const useAutoLoadMapFile = (props?: Props) => {
  const loadMap = useBoundStore((s) => s.loadMap)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const { clear: clearUndoHistory } = useBoundStore.temporal.getState()
  const { enqueueSnackbar } = useSnackbar()
  const searchString = useSearch()
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)

  const [, navigate] = useLocation()

  // USE EFFECT: Update viewing level when new map is loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: <only auto-update viewing level when map is loaded>
  React.useEffect(() => {
    toggleViewingLevel(maxLevel)
  }, [hexMap.id])

  // USE EFFECT: automatically load up map from URL(with option to use lastMapCache instead)
  //  OR from json/.hsc file
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on-load
  useEffect(() => {
    // Map might be loaded from local storage already
    const queryParams = new URLSearchParams(searchString)
    const urlMapString = queryParams.get('m')
    const isLocal = localStorage.getItem(LS_KEYS.lastMapCache)
    const localMapCache = isLocal ? JSON.parse(isLocal) : undefined
    // If url map, load it and offer to load last local storage
    if (urlMapString) {
      try {
        const { hexMap, boardPieces } =
          parseMapDataArrayFromCrushed(urlMapString)
        const fullBoardPieces = inflateBoardPiecesFromIds(boardPieces)
        const jsonMap = buildupJsonFileMap(boardPieces, hexMap)
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
                localMapCache ? loadMap(localMapCache) : noop()
                closeSnackbar(snackbarId)
                enqueueSnackbar({
                  message: `Loaded last map instead: ${localMapCache.hexMap.name}`,
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
        // enqueueSnackbar({
        //   message: `Map data has been removed from your URL bar, to return it please press the back button in your browser.`,
        //   variant: 'info',
        //   autoHideDuration: 6000,
        // })
        clearUndoHistory() // clear undo history, initial load should not be undoable
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
    }
    // No url, but a last map, then load the last map
    if (localMapCache) {
      loadMap(localMapCache)
      enqueueSnackbar({
        message: `Loaded last map: ${localMapCache.hexMap.name}`,
        variant: 'success',
      })
      return
    }
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
      // const data = response.json()
      const data = await response.json()

      if (props?.boardHexes) {
        loadMap({
          boardHexes: props.boardHexes,
          boardPieces: normalizeBoardPieces(data.boardPieces),
          hexMap: data.hexMap,
        })
      } else {
        const jsonMap = buildupJsonFileMap(
          normalizeBoardPieces(data.boardPieces),
          data.hexMap,
        )
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = fileName
        }
        loadMap(jsonMap)
      }
      enqueueSnackbar({
        // message: `Loaded map "${jsonMap.hexMap.name}" from file: "${fileName}"`,
        message: 'WELCOME!',
        variant: 'success',
        autoHideDuration: 5000,
      })
      clearUndoHistory() // clear undo history, initial load should not be undoable
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default useAutoLoadMapFile
