import JSONCrush from 'jsoncrush'
import { useSnackbar } from 'notistack'
import React, { useEffect } from 'react'
import { useSearch } from 'wouter'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import { type BoardHexes, type BoardPieces, Pieces } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'
import { decodePieceID, getBoardPiecesMaxLevel } from '../utils/map-utils'

type Props = {
  boardHexes?: BoardHexes
}

const useAutoLoadMapFile = (props: Props) => {
  const loadMap = useBoundStore((s) => s.loadMap)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const { clear: clearUndoHistory } = useBoundStore.temporal.getState()
  const { enqueueSnackbar } = useSnackbar()
  const searchString = useSearch()
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)
  // USE EFFECT: Update viewing level when new map is loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: <only auto-update viewing level when map is loaded>
  React.useEffect(() => {
    toggleViewingLevel(maxLevel)
  }, [hexMap.id])
  // USE EFFECT: automatically load up map from URL, OR from file
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on-load
  useEffect(() => {
    const queryParams = new URLSearchParams(searchString)
    const urlMapString = queryParams.get('m')
    if (urlMapString) {
      try {
        const data = JSON.parse(JSONCrush.uncrush(urlMapString))
        const [hexMap, ...pieceIds] = data
        const boardPieces: BoardPieces = pieceIds.reduce(
          (prev: BoardPieces, curr: string) => {
            // get inventory id from pieceID (a~q~r~rot~id)
            prev[curr] = decodePieceID(curr).inventoryID
            return prev
          },
          {},
        )
        const jsonMap = buildupJsonFileMap(boardPieces, hexMap)
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = genRandomMapName()
        }
        loadMap(jsonMap)
        enqueueSnackbar({
          message: `Loaded map from URL: ${jsonMap.hexMap.name}.`,
          variant: 'success',
          autoHideDuration: 5000,
        })
        // enqueueSnackbar({
        //   message: `Map data has been removed from your URL bar, to return it please press the back button in your browser.`,
        //   variant: 'info',
        //   autoHideDuration: 6000,
        // })
        // navigate(ROUTES.heroscapeHome)
        clearUndoHistory() // clear undo history, initial load should not be undoable
      } catch (error: any) {
        enqueueSnackbar({
          message: `Error loading map from URL: ${error?.message ?? error}`,
          variant: 'error',
          autoHideDuration: 5000,
        })
        console.error('🚀 ~ React.useEffect ~ error:', error)
      }
    } else {
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
      // const fileName = '/The_Sunken_Crypt.json'
      const fileName = '/AoA_1_The_Shattered_Table.json'
      fetch(fileName).then(async (response) => {
        // const data = response.json()
        const data = await response.json()
        if (props.boardHexes) {
          loadMap({
            boardHexes: props.boardHexes,
            boardPieces: data.boardPieces,
            hexMap: data.hexMap,
          })
        } else {
          const jsonMap = buildupJsonFileMap(data.boardPieces, data.hexMap)
          if (!jsonMap.hexMap.name) {
            jsonMap.hexMap.name = fileName
          }
          loadMap(jsonMap)
        }
        enqueueSnackbar({
          // message: `Loaded map "${jsonMap.hexMap.name}" from file: "${fileName}"`,
          message: `WELCOME!`,
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
