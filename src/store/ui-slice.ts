import { StateCreator } from "zustand"
import { HexTerrain, PenMode, UIState } from "../types"
import { AppState } from "./store"
import { produce } from "immer"

export interface UISlice extends UIState {
    togglePenMode: (mode: PenMode) => void
    toggleIsShowStartZones: (s: boolean) => void
    toggleIsTakingPicture: (s: boolean) => void
    togglePieceSize: (s: number) => void

}

const initialPenMode = PenMode.grass

const createUISlice: StateCreator<
    // https://immerjs.github.io/immer/#with-immer
    AppState,
    [],
    [],
    UISlice
> = (set) => ({
    penMode: initialPenMode,
    pieceSize: 1,
    isShowStartZones: true,
    isTakingPicture: false,
    flatPieceSizes: landSizes?.[initialPenMode] ?? [],
    togglePieceSize: (newVal: number) => set((state) => {
        return { ...state, pieceSize: newVal }
    }),
    togglePenMode: (mode: PenMode) => set(produce((state) => {
        // when we switch terrains, we have different size options available and must update smartly
        const { newSize, newSizes } = getNewPieceSizeForPenMode(
            mode,
            state.penMode,
            state.pieceSize
        )
        state.penMode = mode
        state.pieceSize = newSize
        state.flatPieceSizes = newSizes
    })),
    toggleIsTakingPicture: (n: boolean) => set(produce((s => s.isTakingPicture = n))),
    toggleIsShowStartZones: (n: boolean) => set(produce((s => s.isShowStartZones = n))),
})
const landSizes = {
    // solid terrain below
    [HexTerrain.grass]: [1, 2, 3, 7, 24],
    [HexTerrain.rock]: [1, 2, 3, 7, 24],
    [HexTerrain.sand]: [1, 2, 3, 7, 24],
    [HexTerrain.swamp]: [1, 2, 3, 7, 24],
    [HexTerrain.dungeon]: [1, 2, 3, 7, 24],
    [HexTerrain.lavaField]: [1, 2, 7],
    [HexTerrain.concrete]: [1, 2, 7],
    [HexTerrain.asphalt]: [1, 2, 7],
    [HexTerrain.road]: [1, 2],
    [HexTerrain.snow]: [1, 2],
    // fluid terrain below
    [HexTerrain.water]: [1],
    [HexTerrain.swampWater]: [1],
    [HexTerrain.lava]: [1],
    [HexTerrain.ice]: [1],
    [HexTerrain.shadow]: [1],
}
const getNewPieceSizeForPenMode = (
    newMode: string,
    oldMode: string,
    oldPieceSize: number
): { newSize: number; newSizes: number[] } => {
    const terrainsWithFlatPieceSizes = Object.keys(landSizes).filter((t) => {
        return landSizes[t].length > 0
    })
    const newPieceSizes = terrainsWithFlatPieceSizes.includes(newMode)
        ? landSizes[newMode]
        : []
    if (!(newPieceSizes.length > 0)) {
        return { newSize: 1, newSizes: [] }
    }
    if (newPieceSizes.includes(oldPieceSize)) {
        return { newSize: oldPieceSize, newSizes: newPieceSizes }
    } else {
        const oldIndex = landSizes[oldMode].indexOf(oldPieceSize)
        return {
            newSize: newPieceSizes?.[oldIndex] ?? newPieceSizes[0],
            newSizes: newPieceSizes,
        }
    }
}

export default createUISlice