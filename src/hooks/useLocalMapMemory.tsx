import { useLocalStorage } from '../hooks/useLocalStorage'
import type { MapState } from '../types'

export const useLocalMapMemory = () => {
  const blankMapState: MapState = {
    boardHexes: {},
    boardPieces: {},
    hexMap: {
      id: '',
      name: '',
      shape: '',
      length: 0,
      width: 0,
    },
  }
  const [map1, setMap1] = useLocalStorage('hexoscape-map1', blankMapState)
  const [map2, setMap2] = useLocalStorage('hexoscape-map2', blankMapState)
  const [map3, setMap3] = useLocalStorage('hexoscape-map3', blankMapState)
  const [map4, setMap4] = useLocalStorage('hexoscape-map4', blankMapState)
  return {
    map1,
    setMap1,
    map2,
    setMap2,
    map3,
    setMap3,
    map4,
    setMap4,
  }
}
