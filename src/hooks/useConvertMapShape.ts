import { useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { buildupJsonFileMap } from '../data/buildupMap'
import { convertMapShape } from '../data/convertMapShape'
import useBoundStore from '../store/store'

export function useConvertMapShape() {
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const hexMap = useBoundStore((state) => state.hexMap)
  const savedSelections = useBoundStore((state) => state.savedSelections)
  const loadMap = useBoundStore((state) => state.loadMap)
  const { enqueueSnackbar } = useSnackbar()

  return useCallback(() => {
    const targetShape = hexMap.shape === 'hexagon' ? 'rectangle' : 'hexagon'
    const result = convertMapShape(hexMap, boardPieces, targetShape)
    if (!result.ok) {
      enqueueSnackbar({
        message:
          result.error === 'too-large'
            ? 'These pieces cannot fit within the maximum map size.'
            : 'The map margin must be a non-negative whole number.',
        variant: 'error',
      })
      return
    }

    loadMap(
      buildupJsonFileMap(
        boardPieces,
        result.hexMap,
        undefined,
        savedSelections,
      ),
    )
    enqueueSnackbar({
      message:
        targetShape === 'rectangle'
          ? `Converted to a rectangle map (${result.hexMap.length} × ${result.hexMap.width})`
          : `Converted to a hexagon map (radius ${result.hexMap.length - 1})`,
      variant: 'success',
    })
  }, [boardPieces, enqueueSnackbar, hexMap, loadMap, savedSelections])
}
