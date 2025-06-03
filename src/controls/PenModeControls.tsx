import { Divider, ListItemIcon } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import { noop } from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  GiArrowCursor,
  GiCastle,
  GiCrenulatedShield,
  GiGrass,
  GiIsland,
  GiLadder,
  GiPeaks,
  GiPineTree,
  GiStoneWall,
  GiWaterfall,
} from 'react-icons/gi'
import useBoundStore from '../store/store'
import { PiecePrefixes, Pieces } from '../types'
import {
  TbHexagonNumber1Filled,
  TbHexagonNumber2Filled,
  TbHexagonNumber3Filled,
  TbHexagonNumber4Filled,
  TbHexagonNumber5Filled,
  TbHexagonNumber6Filled,
  TbHexagonNumber7Filled,
  TbHexagonNumber8Filled,
} from 'react-icons/tb'

export default function PenModeControls() {
  const penMode = useBoundStore((state) => state.penMode)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const handleChange = (event: SelectChangeEvent) => {
    togglePenMode(event.target.value)
  }
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const isSizes = flatPieceSizes?.length > 0
  useHotkeys(
    '1',
    () => (isSizes ? togglePieceSize(flatPieceSizes[0]) : noop()) /*isEnabled*/,
  )
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
          <span>Select</span>
        </MenuItem>

        <Divider />
        {/* TERRAIN TYPES BEGIN */}

        <MenuItem value={PiecePrefixes.grass}>
          <ListItemIcon>
            <GiGrass />
          </ListItemIcon>
          <span>Grass</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.rock}>
          <ListItemIcon>
            <GiPeaks />
          </ListItemIcon>
          <span>Rock</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.sand}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Sand</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.road}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Road</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.lavaField}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Lava Field</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.snow}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Snow</span>
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
          <span>Swamp</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.dungeon}>
          <ListItemIcon>
            <GiIsland />
          </ListItemIcon>
          <span>Dungeon</span>
        </MenuItem>
        <Divider />
        {/* FLUID LAND BEGIN */}
        <MenuItem value={PiecePrefixes.water}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Water</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.wellspringWater}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Wellspring Water</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.ice}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Ice</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.lava}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Lava</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.swampWater}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Swamp Water</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.shadow}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Shadow</span>
        </MenuItem>

        <Divider />
        {/* LAUR WALL */}
        <MenuItem value={Pieces.laurWallPillar}>
          <ListItemIcon>
            <GiWaterfall />
          </ListItemIcon>
          <span>Laur Wall Pillar</span>
        </MenuItem>
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
          <span>Castle Wall End</span>
        </MenuItem>
        <MenuItem value={Pieces.castleWallStraight}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Wall Straight</span>
        </MenuItem>
        <MenuItem value={Pieces.castleWallCorner}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Wall Corner</span>
        </MenuItem>
        <MenuItem value={Pieces.castleArch}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Arch</span>
        </MenuItem>
        <MenuItem value={Pieces.castleArchNoDoor}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Castle Arch (No Door)</span>
        </MenuItem>
        {/* WALL WALK BEGIN */}
        <MenuItem value={PiecePrefixes.wallWalk}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Wall Walk</span>
        </MenuItem>

        {/* GLYPHS */}
        <Divider />
        <MenuItem value={Pieces.glyphPower}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Power Glyph</span>
        </MenuItem>
        <MenuItem value={Pieces.glyphTreasure}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Treasure Glyph</span>
        </MenuItem>

        {/* RoadWall, Battlements, Ladders */}
        <Divider />
        <MenuItem value={Pieces.roadWall}>
          <ListItemIcon>
            <GiStoneWall />
          </ListItemIcon>
          <span>Road Wall</span>
        </MenuItem>
        <MenuItem value={Pieces.battlement}>
          <ListItemIcon>
            <GiCrenulatedShield />
          </ListItemIcon>
          <span>Battlement</span>
        </MenuItem>
        <MenuItem value={Pieces.ladder}>
          <ListItemIcon>
            <GiLadder />
          </ListItemIcon>
          <span>Ladder</span>
        </MenuItem>

        {/* START ZONES BEGIN */}
        <Divider />

        <MenuItem value={Pieces.startZone1}>
          <ListItemIcon>
            <TbHexagonNumber1Filled />
          </ListItemIcon>
          <span>Start Zone: P1</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone2}>
          <ListItemIcon>
            <TbHexagonNumber2Filled />
          </ListItemIcon>
          <span>Start Zone: P2</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone3}>
          <ListItemIcon>
            <TbHexagonNumber3Filled />
          </ListItemIcon>
          <span>Start Zone: P3</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone3}>
          <ListItemIcon>
            <TbHexagonNumber3Filled />
          </ListItemIcon>
          <span>Start Zone: P3</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone4}>
          <ListItemIcon>
            <TbHexagonNumber4Filled />
          </ListItemIcon>
          <span>Start Zone: P4</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone5}>
          <ListItemIcon>
            <TbHexagonNumber5Filled />
          </ListItemIcon>
          <span>Start Zone: P5</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone6}>
          <ListItemIcon>
            <TbHexagonNumber6Filled />
          </ListItemIcon>
          <span>Start Zone: P6</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone7}>
          <ListItemIcon>
            <TbHexagonNumber7Filled />
          </ListItemIcon>
          <span>Start Zone: P7</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone8}>
          <ListItemIcon>
            <TbHexagonNumber8Filled />
          </ListItemIcon>
          <span>Start Zone: P8</span>
        </MenuItem>

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
