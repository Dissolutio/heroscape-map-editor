import React, { type ChangeEvent } from 'react'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import { ROUTES } from '../ROUTES'
import buildupVSFileMap, { buildupJsonFileMap } from '../data/buildupMap'
import readVirtualscapeMapFile, {
  readGzipMapFile,
} from '../data/readVirtualscapeMapFile'
import useBoundStore from '../store/store'
import type { MapFileState, PieceInventory } from '../types'
import { useLocalPieceInventory } from '../local-storage/useLocalPieceInventory'
import { parse } from 'papaparse'
import { piecesSoFar } from '../data/pieces'

export const personalInventoryTsvUploadElementID = 'tsvinventoryupload'
export const uploadElementID = 'upload'
export const jsonUploadElementID = 'jsonupload'
export const virtualScapeUploadElementID = 'vsupload'

export const LoadFileHiddenInputs = () => {
  const loadMap = useBoundStore((state) => state.loadMap)
  const inventory = useLocalPieceInventory()
  const [, navigate] = useLocation()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const closeSnackbarIDAction: SnackbarAction = (snackbarId: SnackbarKey) => (
    <>
      <button
        type="button"
        onClick={() => {
          closeSnackbar(snackbarId)
        }}
      >
        Dismiss
      </button>
    </>
  )
  const readGzipFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }
    try {
      const data = await readGzipMapFile(file)
      const jsonMap = buildupJsonFileMap(data.boardPieces, data.hexMap)
      if (!jsonMap.hexMap.name) {
        jsonMap.hexMap.name = file.name
      }
      loadMap(jsonMap)
      enqueueSnackbar({
        message: `Loaded map: ${jsonMap.hexMap.name}`,
        variant: 'success',
      })
      navigate(ROUTES.heroscapeHome)
      // clear() // clear undo history, initial load should not be undoable
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error)
      enqueueSnackbar({
        message: `Error loading json map: ${errorMessage}`,
        variant: 'error',
        action: closeSnackbarIDAction,
      })
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }

  const readJsonFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }
    try {
      const data: MapFileState = await new Response(file).json()
      const jsonMap = buildupJsonFileMap(data.boardPieces, data.hexMap)
      if (!jsonMap.hexMap.name) {
        jsonMap.hexMap.name = file.name
      }
      loadMap(jsonMap)
      enqueueSnackbar({
        message: `Loaded map: ${jsonMap.hexMap.name}`,
        variant: 'success',
      })
      navigate(ROUTES.heroscapeHome)
      // clear() // clear undo history, initial load should not be undoable
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error)
      enqueueSnackbar({
        message: `Error loading json map: ${errorMessage}`,
        variant: 'error',
        action: closeSnackbarIDAction,
      })
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }
  const readVSFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }

    try {
      const vsMap = await readVirtualscapeMapFile(file)
      const loadedMap = buildupVSFileMap(vsMap.tiles, vsMap.name || file.name)
      loadMap(loadedMap)
      enqueueSnackbar({
        message: `Loaded map: ${loadedMap.hexMap.name}`,
        variant: 'success',
      })
      navigate(ROUTES.heroscapeHome)
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error)
      enqueueSnackbar({
        message: `Error loading virtualscape map: ${errorMessage}`,
        variant: 'error',
        action: closeSnackbarIDAction,
      })
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }

  const readPersonalInventoryTsvFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file: File | undefined = event?.target?.files?.[0]

    if (!file) {
      return
    }

    try {
      parse<Record<string, string>>(file, {
        delimiter: '\t',
        header: true,
        complete: (results) => {
          const newPieceInventory: PieceInventory = {}
          for (const datum of results.data) {
            console.log('🚀 ~ results.data.forEach ~ datum:', datum)
            if (datum.ID && piecesSoFar[datum.ID]) {
              newPieceInventory[datum.ID] = Number.parseInt(datum.Count)
            }
          }
          inventory.setPieceInventory(newPieceInventory)
          console.log(
            '🚀 ~ readPersonalInventoryTsvFile ~ inventory:',
            inventory.pieceInventory,
          )
        },
        error: (err) => {
          console.error(err)
        },
      })
    } catch (error: unknown) {
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }

  return (
    <>
      <input
        id={uploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".gz"
        onChange={readGzipFile}
      />
      <input
        id={jsonUploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".json"
        onChange={readJsonFile}
      />
      <input
        id={virtualScapeUploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".hsc"
        onChange={readVSFile}
      />
      <input
        id={personalInventoryTsvUploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".tsv"
        onChange={readPersonalInventoryTsvFile}
      />
    </>
  )
}

const hiddenStyle = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1',
  overflow: 'hidden',
  position: 'absolute' as const,
  bottom: '0',
  left: '0',
  whiteSpace: 'nowrap',
  width: '1',
}
