import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import type {
  BoardHexes,
  BoardPiece,
  MapState,
} from '../types'
import type { AppState } from './store'
import { LS_KEYS } from '../local-storage/keys'
import { inflateBoardPiecesFromIds, normalizeBoardPieces } from '../utils/map-utils'

export interface MapSlice extends MapState {
  boardHexes: BoardHexes
  paintTile: (piece: BoardPiece) => void
  unpaintTile: (boardPieceUid: string) => void
  updateBoardHexes: (bh: BoardHexes) => void
  loadMap: (map: MapState) => void
  addMapPortraitBase64: (pic: string) => void
  changeMapName: (val: string) => void
  changeSetsUsed: (val: string[]) => void
  changeAuthorName: (val: string) => void
  changeMapNotes: (val: string) => void
}
function isPlainObject(value: unknown) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
function loadMapFromLocalStorage(): MapState | null {
  try {
    const raw = localStorage.getItem(LS_KEYS.lastMap)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed) return null

    // handle legacy format where map stored boardPieces as {[pieceID: string]: string}
    if (isPlainObject(parsed.boardPieces) && Object.keys(parsed.boardPieces).length && typeof Object.keys(parsed.boardPieces)[0] === 'string') {
      const migrated1 = inflateBoardPiecesFromIds(normalizeBoardPieces(parsed.boardPieces))
      // optionally re-save migrated shape
      return { hexMap: parsed.hexMap, boardPieces: migrated1 }
    }
    // handle legacy format where map stored boardPieces as string[]
    if (Array.isArray(parsed.boardPieces) && parsed.boardPieces.length && typeof parsed.boardPieces[0] === 'string') {
      const migrated2 = inflateBoardPiecesFromIds(parsed.boardPieces as string[])
      return { hexMap: parsed.hexMap, boardPieces: migrated2 }
    }

    // already new shape
    return { hexMap: parsed.hexMap, boardPieces: parsed.boardPieces }
  } catch (e) {
    console.warn('Failed loading last map from localStorage', e)
    return null
  }
}

// Here, we duplicate lastMap in case the user is loading a URL, which will immediately overwrite lastMap,
// we can offer them the chance to load their last map instead of the URL (in useAutoLoadMapFile.tsx)
const localLastMap = loadMapFromLocalStorage()
if (localLastMap) {
  localStorage.setItem(
    LS_KEYS.lastMapCache,
    JSON.stringify(localLastMap),
  )
}


const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
  boardHexes: {},
  hexMap: {
    id: '',
    name: '',
    author: '',
    shape: 'rectangle',
    width: 20,
    length: 20,
  },
  boardPieces: [],
  paintTile: (piece: BoardPiece) => {
    set((state) => {
      return produce(state, (draft) => {
        // we added a piece. ___X go up piece height
        const placedAtLevel = piece.altitude + 1
        draft.viewingLevel =
          placedAtLevel > state.viewingLevel
            ? state.viewingLevel + (placedAtLevel - state.viewingLevel)
            : state.viewingLevel
        draft.boardPieces.push(piece)
      })
    })
  },
  unpaintTile: (boardPieceUid: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.boardPieces = state.boardPieces.filter((bp) => bp.uid !== boardPieceUid)
      })
    }),
  mapPortraitBase64: '',
  addMapPortraitBase64: (pic: string) =>
    set(
      produce((state) => {
        state.hexMap.mapPortraitBase64 = pic
      }),
    ),
  changeMapName: (val: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.name = val
      })
    }),
  changeSetsUsed: (val: string[]) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.setsUsed = val
      })
    }),
  changeAuthorName: (val: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.author = val
      })
    }),
  mapNotes: '',
  changeMapNotes: (val: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.mapNotes = val
      })
    }),
  updateBoardHexes: (bh: BoardHexes) => {
    set((state) => {
      return produce(state, (draft) => {
        draft.boardHexes = bh
      })
    })
  },
  loadMap: (mapState: MapState) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap = mapState.hexMap
        draft.boardPieces = mapState.boardPieces
      })
    }),
})

export default createMapSlice
