import { Divider, ListItemIcon } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { noop } from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  GiArrowCursor,
  GiCastle,
  GiGrass,
  GiIsland,
  GiPeaks,
  GiPineTree,
  GiWaterfall,
} from 'react-icons/gi'
import useBoundStore from '../store/store'
import { PiecePrefixes, Pieces } from '../types'

export default function PenModeControls() {
  const penMode = useBoundStore((state) => state.penMode)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const handleChange = (event: SelectChangeEvent) => {
    togglePenMode(event.target.value)
  }
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  // const handleChange = (
  //   _event: React.MouseEvent<HTMLElement>,
  //   value: string,
  // ) => {
  //   togglePieceSize(parseInt(value))
  // }
  const isSizes = flatPieceSizes?.length > 0
  // when we switch terrains, we have different size options available and must update smartly
  // const { newSize, newSizes } = getNewPieceSizeForPenMode(
  // mode,
  // state.penMode,
  // state.pieceSize,
  // )

  // '1'
  useHotkeys(
    '1',
    () => (isSizes ? togglePieceSize(flatPieceSizes[0]) : noop()) /*isEnabled*/,
  )
  useHotkeys('shift+1', () => togglePenMode(Pieces.castleWallEnd) /*isEnabled*/)
  // '2'
  useHotkeys(
    '2',
    () =>
      isSizes
        ? togglePieceSize(flatPieceSizes?.[1] ?? flatPieceSizes[0])
        : noop() /*isEnabled*/,
  )
  useHotkeys(
    'shift+2',
    () => togglePenMode(Pieces.castleWallStraight) /*isEnabled*/,
  )
  // '3'
  useHotkeys(
    '3',
    () =>
      isSizes
        ? togglePieceSize(
            flatPieceSizes?.[2] ?? flatPieceSizes?.[1] ?? flatPieceSizes?.[0],
          )
        : noop() /*isEnabled*/,
  )
  useHotkeys(
    'shift+3',
    () => togglePenMode(Pieces.castleWallCorner) /*isEnabled*/,
  )
  // '4'
  useHotkeys(
    '4',
    () =>
      isSizes
        ? togglePieceSize(
            flatPieceSizes?.[3] ??
              flatPieceSizes?.[2] ??
              flatPieceSizes?.[1] ??
              flatPieceSizes[0],
          )
        : noop() /*isEnabled*/,
  )
  useHotkeys('shift+4', () => togglePenMode(Pieces.castleArch) /*isEnabled*/)
  // '5'
  useHotkeys(
    '5',
    () =>
      isSizes
        ? togglePieceSize(
            flatPieceSizes?.[4] ??
              flatPieceSizes?.[3] ??
              flatPieceSizes?.[2] ??
              flatPieceSizes?.[1] ??
              flatPieceSizes[0],
          )
        : noop() /*isEnabled*/,
  )
  useHotkeys(
    'shift+5',
    () => togglePenMode(Pieces.castleArchNoDoor) /*isEnabled*/,
  )
  // '6'
  // '7'
  // '8'
  // '9'
  // '0'

  // 'a'
  // 'b'
  // 'c'
  // 'd'
  useHotkeys('d', () => togglePenMode(PiecePrefixes.dungeon) /*isEnabled*/)
  useHotkeys('shift+d', () => togglePenMode(PiecePrefixes.shadow) /*isEnabled*/)
  // 'e'
  // 'f'
  // 'g'
  useHotkeys('g', () => togglePenMode(PiecePrefixes.grass) /*isEnabled*/)
  // 'h'
  // 'i'
  useHotkeys('i', () => togglePenMode(PiecePrefixes.snow) /*isEnabled*/)
  useHotkeys('shift+i', () => togglePenMode(PiecePrefixes.ice) /*isEnabled*/)
  // 'j'
  // 'k'
  // 'l'
  useHotkeys('l', () => togglePenMode(PiecePrefixes.lavaField) /*isEnabled*/)
  useHotkeys('shift+l', () => togglePenMode(PiecePrefixes.lava) /*isEnabled*/)
  // 'm'
  // 'n'
  // 'o'
  useHotkeys('o', () => togglePenMode(PiecePrefixes.road) /*isEnabled*/)
  useHotkeys(
    'shift+o',
    () => togglePenMode(PiecePrefixes.wallWalk) /*isEnabled*/,
  )
  // 'p'
  useHotkeys('p', () => togglePenMode(PiecePrefixes.swamp) /*isEnabled*/)
  useHotkeys(
    'shift+p',
    () => togglePenMode(PiecePrefixes.swampWater) /*isEnabled*/,
  )
  // 'q'
  // 'r'
  useHotkeys('r', () => togglePenMode(PiecePrefixes.rock) /*isEnabled*/)
  // 's'
  useHotkeys('s', () => togglePenMode(PiecePrefixes.sand) /*isEnabled*/)
  // 't'
  // 'u'
  // 'v'
  // 'w'
  useHotkeys('w', () => togglePenMode(PiecePrefixes.water) /*isEnabled*/)
  useHotkeys(
    'shift+w',
    () => togglePenMode(PiecePrefixes.wellspringWater) /*isEnabled*/,
  )
  // 'x'
  // 'y'
  // 'z'
  useHotkeys('z', () => togglePenMode('select') /*isEnabled*/)

  return (
    <FormControl variant="filled">
      <InputLabel id="pen-terrain-select-label">Terrain</InputLabel>
      <Select
        autoWidth
        sx={{
          minWidth: 100,
        }}
        MenuProps={{
          anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        }}
        labelId="pen-terrain-select-label"
        id="pen-terrain-select"
        value={penMode}
        onChange={handleChange}
      >
        <MenuItem value={'select'}>
          <ListItemIcon>
            <GiArrowCursor />
          </ListItemIcon>
          <span>Select [Z]</span>
        </MenuItem>

        <Divider />
        {/* TERRAIN TYPES BEGIN */}

        <MenuItem value={PiecePrefixes.grass}>
          <ListItemIcon>
            <GiGrass />
          </ListItemIcon>
          <span>Grass [G]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.rock}>
          <ListItemIcon>
            <GiPeaks />
          </ListItemIcon>
          <span>Rock [R]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.sand}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Sand [S]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.road}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Road [O]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.lavaField}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Lava Field [F]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.snow}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Snow [I]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.concrete}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Concrete</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.asphalt}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Asphalt</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.swamp}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Swamp [P]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.dungeon}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Dungeon [D]</span>
        </MenuItem>
        <Divider />
        {/* FLUID LAND BEGIN */}
        <MenuItem value={PiecePrefixes.water}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Water [W]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.wellspringWater}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Wellspring Water [Shift + W]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.ice}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Ice[Shift + I]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.lava}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Lava [Shift + L]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.swampWater}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Swamp Water [Shift + P]</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.shadow}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Shadow [Shift + D]</span>
        </MenuItem>

        <Divider />
        {/* LAUR WALL */}
        <MenuItem value={Pieces.laurWallPillar}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Laur Wall Pillar</span>
        </MenuItem>
        {/* <MenuItem value={PenMode.laurWallRuin}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Laur Wall Ruin</span>
        </MenuItem>
        <MenuItem value={PenMode.laurWallShort}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Laur Wall Short</span>
        </MenuItem>
        <MenuItem value={PenMode.laurWallLong}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Laur Wall Long</span>
        </MenuItem> */}
        <Divider />
        {/* RUINS */}
        <MenuItem value={Pieces.ruins2}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Ruins 2</span>
        </MenuItem>
        <MenuItem value={Pieces.ruins3}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Ruins 3</span>
        </MenuItem>
        <Divider />
        {/* OBSTACLES */}
        <MenuItem value={Pieces.tree10}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Tree10</span>
        </MenuItem>
        <MenuItem value={Pieces.tree11}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Tree11</span>
        </MenuItem>
        <MenuItem value={Pieces.tree12}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Tree12</span>
        </MenuItem>
        <MenuItem value={Pieces.tree415}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Tree415</span>
        </MenuItem>
        <MenuItem value={Pieces.brush9}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>TicallaBrush9</span>
        </MenuItem>
        <MenuItem value={Pieces.palm14}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>TicallaPalm14</span>
        </MenuItem>
        <MenuItem value={Pieces.palm15}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>TicallaPalm15</span>
        </MenuItem>
        <MenuItem value={Pieces.palm16}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>TicallaPalm16</span>
        </MenuItem>
        <MenuItem value={Pieces.swampBrush10}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Swamp Underbrush 10</span>
        </MenuItem>
        <MenuItem value={Pieces.laurBrush10}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>LaurBrush10</span>
        </MenuItem>
        <MenuItem value={Pieces.laurPalm13}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>LaurPalm13</span>
        </MenuItem>
        <MenuItem value={Pieces.laurPalm14}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>LaurPalm14</span>
        </MenuItem>
        <MenuItem value={Pieces.laurPalm15}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>LaurPalm15</span>
        </MenuItem>
        <MenuItem value={Pieces.outcrop1}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Outcrop 1</span>
        </MenuItem>
        <MenuItem value={Pieces.outcrop3}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Outcrop 3</span>
        </MenuItem>
        <MenuItem value={Pieces.lavaRockOutcrop1}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Lava Rock Outcrop 1</span>
        </MenuItem>
        <MenuItem value={Pieces.lavaRockOutcrop3}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Lava Rock Outcrop 3</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier1}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Glacier 1</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier3}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Glacier 3</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier4}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Glacier 4</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier6}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Glacier 6</span>
        </MenuItem>
        <MenuItem value={Pieces.hive}>
          <ListItemIcon>
            <GiPineTree />
          </ListItemIcon>
          <span>Marro Hive 6</span>
        </MenuItem>

        <Divider />
        <MenuItem value={Pieces.castleBaseEnd}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Base End</span>
        </MenuItem>
        <MenuItem value={Pieces.castleBaseStraight}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Base Straight</span>
        </MenuItem>
        <MenuItem value={Pieces.castleBaseCorner}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Base Corner</span>
        </MenuItem>
        <MenuItem value={Pieces.castleWallEnd}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Wall End [Shift + 1]</span>
        </MenuItem>
        <MenuItem value={Pieces.castleWallStraight}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Wall Straight [Shift + 2]</span>
        </MenuItem>
        <MenuItem value={Pieces.castleWallCorner}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Wall Corner [Shift + 3]</span>
        </MenuItem>
        <MenuItem value={Pieces.castleArch}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Arch [Shift + 4]</span>
        </MenuItem>
        <MenuItem value={Pieces.castleArchNoDoor}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Arch (No Door) [Shift + 5]</span>
        </MenuItem>
        {/* WALL WALK BEGIN */}
        <MenuItem value={PiecePrefixes.wallWalk}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Wall Walk [Shift + O]</span>
        </MenuItem>

        {/* <Divider /> */}
        {/* START ZONES BEGIN */}
        {/* 
        <MenuItem value={PenMode.startZone0}>
          <ListItemIcon>
            <TbHexagonNumber1Filled />
          </ListItemIcon>
          <span>Start Zone: P1</span>
        </MenuItem>
        <MenuItem value={PenMode.startZone1}>
          <ListItemIcon>
            <TbHexagonNumber2Filled />
          </ListItemIcon>
          <span>Start Zone: P2</span>
        </MenuItem>
        <MenuItem value={PenMode.startZone2}>
          <ListItemIcon>
            <TbHexagonNumber3Filled />
          </ListItemIcon>
          <span>Start Zone: P3</span>
        </MenuItem> */}

        {/* <Divider /> */}
        {/* ERASER BUTTONS BEGIN */}

        {/* <MenuItem value={PenMode.eraserStartZone}>
          <ListItemIcon>
            <GiBulldozer />
          </ListItemIcon>
          <span>Erase Start Zone</span>
        </MenuItem>
        <MenuItem value={PenMode.eraser}>
          <ListItemIcon>
            <GiBulldozer />
          </ListItemIcon>
          <span>Delete Hex</span>
        </MenuItem> */}
      </Select>
    </FormControl>
  )
}
