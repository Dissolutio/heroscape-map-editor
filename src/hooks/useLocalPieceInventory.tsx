import { useLocalStorage } from '../hooks/useLocalStorage'
import { type PieceInventory, Pieces } from '../types'
import { LS_KEYS } from '../utils/constants'

const blankPieceState: { [key: string]: number } = {
  [Pieces.grass1]: 0,
  [Pieces.grass2]: 0,
  [Pieces.grass3]: 0,
  [Pieces.grass7]: 0,
  [Pieces.grass24]: 0,
  [Pieces.rock1]: 0,
  [Pieces.rock2]: 0,
  [Pieces.rock3]: 0,
  [Pieces.rock7]: 0,
  [Pieces.rock24]: 0,
  [Pieces.sand1]: 0,
  [Pieces.sand2]: 0,
  [Pieces.sand3]: 0,
  [Pieces.sand7]: 0,
  [Pieces.sand24]: 0,
  [Pieces.dungeon1]: 0,
  [Pieces.dungeon2]: 0,
  [Pieces.dungeon3]: 0,
  [Pieces.dungeon7]: 0,
  [Pieces.dungeon24]: 0,
  [Pieces.swamp1]: 0,
  [Pieces.swamp2]: 0,
  [Pieces.swamp3]: 0,
  [Pieces.swamp7]: 0,
  [Pieces.swamp24]: 0,
  [Pieces.snow1]: 0,
  [Pieces.snow2]: 0,
  [Pieces.snow3]: 0,
  [Pieces.snow7]: 0,
  [Pieces.snow24]: 0,
  [Pieces.lavaField1]: 0,
  [Pieces.lavaField2]: 0,
  [Pieces.lavaField7]: 0,
  [Pieces.asphalt1]: 0,
  [Pieces.asphalt2]: 0,
  [Pieces.asphalt7]: 0,
  [Pieces.concrete1]: 0,
  [Pieces.concrete2]: 0,
  [Pieces.concrete7]: 0,
  [Pieces.road1]: 0,
  [Pieces.road2]: 0,
  [Pieces.road5]: 0,
  [Pieces.wellspringWater1]: 0,
  [Pieces.water1]: 0,
  [Pieces.water3]: 0,
  [Pieces.lava1]: 0,
  [Pieces.swampWater1]: 0,
  [Pieces.swampWater3]: 0,
  [Pieces.swampWater6]: 0,
  [Pieces.ice1]: 0,
  [Pieces.ice3]: 0,
  [Pieces.ice4]: 0,
  [Pieces.ice6]: 0,
  [Pieces.shadow1]: 0,
  [Pieces.shadow3]: 0,
  [Pieces.roadWall]: 0,
  [Pieces.laurWallPillar]: 0,
  [Pieces.laurWallShort]: 0,
  [Pieces.laurWallLong]: 0,
  [Pieces.laurWallRuin1]: 0,
  [Pieces.snowTree10]: 0,
  [Pieces.snowTree12]: 0,
  [Pieces.tree10]: 0,
  [Pieces.tree11]: 0,
  [Pieces.tree12]: 0,
  [Pieces.tree415]: 0,
  [Pieces.palm14]: 0,
  [Pieces.palm15]: 0,
  [Pieces.palm16]: 0,
  [Pieces.brush9]: 0,
  [Pieces.swampBrush10]: 0,
  [Pieces.laurPalm13]: 0,
  [Pieces.laurPalm14]: 0,
  [Pieces.laurPalm15]: 0,
  [Pieces.laurBrush10]: 0,
  [Pieces.outcrop1]: 0,
  [Pieces.outcrop3]: 0,
  [Pieces.glacier1]: 0,
  [Pieces.glacier3]: 0,
  [Pieces.glacier4]: 0,
  [Pieces.glacier6]: 0,
  [Pieces.hive]: 0,
  [Pieces.ruins2]: 0,
  [Pieces.ruins3]: 0,
  [Pieces.marvel]: 0,
  // [Pieces.marvelBroken]: 0,
  [Pieces.wallWalk1]: 0,
  [Pieces.wallWalk7]: 0,
  [Pieces.wallWalk9]: 0,
  [Pieces.castleBaseCorner]: 0,
  [Pieces.castleBaseStraight]: 0,
  [Pieces.castleBaseEnd]: 0,
  [Pieces.castleWallCorner]: 0,
  [Pieces.castleWallStraight]: 0,
  [Pieces.castleWallEnd]: 0,
  [Pieces.castleArch]: 0,
  // [Pieces.castleArchNoDoor]    : 0,
  [Pieces.battlement]: 0,
  [Pieces.ladder]: 0,
}
export const useLocalPieceInventory = () => {
  const [pieceInventory, setPieceInventory] = useLocalStorage(
    LS_KEYS.pieceInventory,
    blankPieceState,
  )
  const clearPieceInventory = () => {
    setPieceInventory(blankPieceState)
  }
  const addSet = (pieceSet: PieceInventory) => {
    const newPieceInventory = Object.keys(pieceSet).reduce(
      (prev: PieceInventory, curr: string) => {
        const valueToAdd = pieceSet[curr]
        return { ...prev, [curr]: pieceInventory[curr] + valueToAdd }
      },
      { ...pieceInventory },
    )
    setPieceInventory(newPieceInventory)
  }
  const removeSet = (pieceSet: PieceInventory) => {
    const newPieceInventory = Object.keys(pieceSet).reduce(
      (prev: PieceInventory, curr: string) => {
        return {
          ...prev,
          [curr]: Math.max(pieceInventory[curr] - pieceSet[curr], 0),
        }
      },
      { ...pieceInventory },
    )
    setPieceInventory(newPieceInventory)
  }
  return {
    pieceInventory,
    addSet,
    removeSet,
    clearPieceInventory,
    setPieceInventory,
  }
}
