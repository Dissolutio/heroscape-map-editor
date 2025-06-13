import { Divider, ListItemIcon } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import { noop } from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  GiAncientRuins,
  GiArrowCursor,
  GiCastle,
  GiCastleRuins,
  GiCrenulatedShield,
  GiJungle,
  GiLadder,
  GiPalmTree,
  GiPineTree,
  GiStoneWall,
  GiWhiteTower,
} from 'react-icons/gi'
import useBoundStore from '../store/store'
import { PiecePrefixes, Pieces } from '../types'
import {
  TbHexagonalPyramid,
  TbHexagonLetterC,
  TbHexagonLetterE,
  TbHexagonLetterPFilled,
  TbHexagonLetterS,
  TbHexagonLetterTFilled,
  TbHexagonNumber1Filled,
  TbHexagonNumber2Filled,
  TbHexagonNumber3Filled,
  TbHexagonNumber4Filled,
  TbHexagonNumber5Filled,
  TbHexagonNumber6Filled,
  TbHexagonNumber7Filled,
  TbHexagonNumber8Filled,
  TbHexagons,
} from 'react-icons/tb'
import { PiCastleTurretLight } from 'react-icons/pi'
import { BsHexagonHalf } from 'react-icons/bs'
import { hexTerrainColor } from '../world/maphex/hexColors'
import { LiaMountainSolid } from 'react-icons/lia'
import { FaMountainCity } from 'react-icons/fa6'
import { FcAddColumn, FcAddDatabase } from 'react-icons/fc'

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
    <FormControl variant="filled" size="small">
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
          <span>Select (hotkey: Z)</span>
        </MenuItem>

        <Divider />
        {/* TERRAIN TYPES BEGIN */}

        <MenuItem value={PiecePrefixes.grass}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.grass} />
          </ListItemIcon>
          <span>Grass</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.rock}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.rock} />
          </ListItemIcon>
          <span>Rock</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.sand}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.sand} />
          </ListItemIcon>
          <span>Sand</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.road}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.road} />
          </ListItemIcon>
          <span>Road</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.lavaField}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.lavaField} />
          </ListItemIcon>
          <span>Lava Field</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.snow}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.snow} />
          </ListItemIcon>
          <span>Snow</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.concrete}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.concrete} />
          </ListItemIcon>
          <span>Concrete</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.asphalt}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.rock} />
          </ListItemIcon>
          <span>Asphalt</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.swamp}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.swampCap} />
          </ListItemIcon>
          <span>Swamp</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.dungeon}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.dungeon} />
          </ListItemIcon>
          <span>Dungeon</span>
        </MenuItem>
        <Divider />

        {/* FLUID LAND BEGIN */}
        <MenuItem value={PiecePrefixes.water}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Water</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.wellspringWater}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.wellspringWater} />
          </ListItemIcon>
          <span>Wellspring Water</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.ice}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.ice} />
          </ListItemIcon>
          <span>Ice</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.lava}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.lava} />
          </ListItemIcon>
          <span>Lava</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.swampWater}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.swampWater} />
          </ListItemIcon>
          <span>Swamp Water</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.shadow}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.castle} />
          </ListItemIcon>
          <span>Shadow</span>
        </MenuItem>

        <Divider />

        {/* LAUR WALL */}
        <MenuItem value={Pieces.laurWallPillar}>
          <ListItemIcon>
            <GiWhiteTower color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall Pillar</span>
        </MenuItem>
        <MenuItem value={Pieces.laurWallTrianglePillar}>
          <ListItemIcon>
            <GiWhiteTower color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall Triangle Pillar</span>
        </MenuItem>
        <MenuItem value={Pieces.laurWallRuin}>
          <ListItemIcon>
            <FcAddColumn color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall Ruins</span>
        </MenuItem>
        {/* <MenuItem value={Pieces.laurWallRuin2}>
          <ListItemIcon>
            <FcAddColumn color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall Ruins</span>
        </MenuItem> */}
        {/* <MenuItem value={Pieces.laurWallRuin3}>
          <ListItemIcon>
            <FcAddColumn color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall Ruins</span>
        </MenuItem> */}
        <MenuItem value={Pieces.laurWallShort}>
          <ListItemIcon>
            <FcAddDatabase color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall (Short)</span>
        </MenuItem>
        <MenuItem value={Pieces.laurWallLong}>
          <ListItemIcon>
            <FcAddDatabase color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall (Long)</span>
        </MenuItem>
        <Divider />

        {/* RUINS */}
        <MenuItem value={Pieces.ruins2}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.ruin} />
          </ListItemIcon>
          <span>Ruins 2</span>
        </MenuItem>
        <MenuItem value={Pieces.ruins3}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.ruin} />
          </ListItemIcon>
          <span>Ruins 3</span>
        </MenuItem>
        <Divider />


        {/* Trees */}
        <MenuItem value={Pieces.tree10}>
          <ListItemIcon>
            <GiPineTree color={hexTerrainColor.grass} />
          </ListItemIcon>
          <span>Tree 10</span>
        </MenuItem>
        <MenuItem value={Pieces.tree11}>
          <ListItemIcon>
            <GiPineTree color={hexTerrainColor.grass} />
          </ListItemIcon>
          <span>Tree 11</span>
        </MenuItem>
        <MenuItem value={Pieces.tree12}>
          <ListItemIcon>
            <GiPineTree color={hexTerrainColor.grass} />
          </ListItemIcon>
          <span>Tree 12</span>
        </MenuItem>
        <MenuItem value={Pieces.tree415}>
          <ListItemIcon>
            <GiPineTree color={hexTerrainColor.grass} />
          </ListItemIcon>
          <span>Big Tree 15</span>
        </MenuItem>

        {/* Jungle Palm / Brush begin */}
        <Divider />

        <MenuItem value={Pieces.brush9}>
          <ListItemIcon>
            <GiJungle color={hexTerrainColor.ticallaBrush1} />
          </ListItemIcon>
          <span>Ticalla Brush 9</span>
        </MenuItem>
        <MenuItem value={Pieces.palm14}>
          <ListItemIcon>
            <GiPalmTree color={hexTerrainColor.ticallaPalmModel2} />
          </ListItemIcon>
          <span>Ticalla Palm 14</span>
        </MenuItem>
        <MenuItem value={Pieces.palm15}>
          <ListItemIcon>
            <GiPalmTree
              scale={'110%'}
              color={hexTerrainColor.ticallaPalmModel2}
            />
          </ListItemIcon>
          <span>Ticalla Palm 15</span>
        </MenuItem>
        <MenuItem value={Pieces.palm16}>
          <ListItemIcon>
            <GiPalmTree
              scale={'120%'}
              color={hexTerrainColor.ticallaPalmModel2}
            />
          </ListItemIcon>
          <span>Ticalla Palm 16</span>
        </MenuItem>
        <MenuItem value={Pieces.swampBrush10}>
          <ListItemIcon>
            <GiJungle color={hexTerrainColor.swampUnderbrush1} />
          </ListItemIcon>
          <span>Swamp Underbrush 10</span>
        </MenuItem>
        <MenuItem value={Pieces.laurBrush10}>
          <ListItemIcon>
            <GiJungle color={hexTerrainColor.laurBrush1} />
          </ListItemIcon>
          <span>Laur Brush 10</span>
        </MenuItem>
        <MenuItem value={Pieces.laurPalm13}>
          <ListItemIcon>
            <GiPalmTree scale={'120%'} color={hexTerrainColor.laurPalm2} />
          </ListItemIcon>
          <span>Laur Palm 13</span>
        </MenuItem>
        <MenuItem value={Pieces.laurPalm14}>
          <ListItemIcon>
            <GiPalmTree scale={'120%'} color={hexTerrainColor.laurPalm2} />
          </ListItemIcon>
          <span>Laur Palm 14</span>
        </MenuItem>
        <MenuItem value={Pieces.laurPalm15}>
          <ListItemIcon>
            <GiPalmTree scale={'120%'} color={hexTerrainColor.laurPalm2} />
          </ListItemIcon>
          <span>Laur Palm 15</span>
        </MenuItem>

        {/* Outcrops / Hive Begin */}
        <Divider />

        <MenuItem value={Pieces.outcrop1}>
          <ListItemIcon>
            <TbHexagonalPyramid color={hexTerrainColor.dungeon} />
          </ListItemIcon>
          <span>Outcrop 1</span>
        </MenuItem>
        <MenuItem value={Pieces.outcrop3}>
          <ListItemIcon>
            <TbHexagonalPyramid
              color={hexTerrainColor.dungeon}
              style={{ fontSize: '0.8rem' }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.dungeon}
              style={{
                fontSize: '0.8rem',
                marginLeft: '-0.5rem',
                marginTop: '0.2rem',
              }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.dungeon}
              style={{ fontSize: '0.8rem', marginLeft: '-0.5rem' }}
            />
          </ListItemIcon>
          <span>Outcrop 3</span>
        </MenuItem>
        <MenuItem value={Pieces.lavaRockOutcrop1}>
          <ListItemIcon>
            <TbHexagonalPyramid color={hexTerrainColor.lava} />
          </ListItemIcon>
          <span>Lava Rock Outcrop 1</span>
        </MenuItem>
        <MenuItem value={Pieces.lavaRockOutcrop3}>
          <ListItemIcon>
            <TbHexagonalPyramid
              color={hexTerrainColor.lava}
              style={{ fontSize: '0.8rem' }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.lava}
              style={{
                fontSize: '0.8rem',
                marginLeft: '-0.5rem',
                marginTop: '0.2rem',
              }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.lava}
              style={{ fontSize: '0.8rem', marginLeft: '-0.5rem' }}
            />
          </ListItemIcon>
          <span>Lava Rock Outcrop 3</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier1}>
          <ListItemIcon>
            <TbHexagonalPyramid color={hexTerrainColor.ice} />
          </ListItemIcon>
          <span>Glacier 1</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier3}>
          <ListItemIcon>
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{ fontSize: '0.8rem' }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{
                fontSize: '0.8rem',
                marginLeft: '-0.5rem',
                marginTop: '0.2rem',
              }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{ fontSize: '0.8rem', marginLeft: '-0.5rem' }}
            />
          </ListItemIcon>
          <span>Glacier 3</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier4}>
          <ListItemIcon>
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{
                fontSize: '0.7rem',
                marginRight: '-1rem',
                marginTop: '-0.2rem',
              }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{ fontSize: '0.8rem' }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{
                fontSize: '0.8rem',
                marginLeft: '-0.5rem',
                marginTop: '0.2rem',
              }}
            />
            <TbHexagonalPyramid
              color={hexTerrainColor.ice}
              style={{
                fontSize: '0.8rem',
                marginLeft: '-0.5rem'
              }}
            />
          </ListItemIcon>
          <span>Glacier 4</span>
        </MenuItem>
        <MenuItem value={Pieces.glacier6}>
          <ListItemIcon>
            <LiaMountainSolid color={hexTerrainColor.ice} />
          </ListItemIcon>
          <span>Glacier 6</span>
        </MenuItem>
        <MenuItem value={Pieces.hive}>
          <ListItemIcon>
            <FaMountainCity color={hexTerrainColor.swampCap} />
          </ListItemIcon>
          <span>Marro Hive 6</span>
        </MenuItem>

        <Divider />
        <MenuItem value={Pieces.castleBaseEnd}>
          <ListItemIcon>
            <TbHexagonLetterE />
          </ListItemIcon>
          <span>Base End</span>
        </MenuItem>
        <MenuItem value={Pieces.castleBaseStraight}>
          <ListItemIcon>
            <TbHexagonLetterS />
          </ListItemIcon>
          <span>Base Straight</span>
        </MenuItem>
        <MenuItem value={Pieces.castleBaseCorner}>
          <ListItemIcon>
            <TbHexagonLetterC />
          </ListItemIcon>
          <span>Base Corner</span>
        </MenuItem>
        <MenuItem
          title="Add castle wall end (base is added automatically if needed)"
          value={Pieces.castleWallEnd}
        >
          <ListItemIcon>
            <PiCastleTurretLight />
            <TbHexagonLetterE />
          </ListItemIcon>
          <span>Wall End</span>
        </MenuItem>
        <MenuItem
          title="Add castle straight wall (base is added automatically if needed)"
          value={Pieces.castleWallStraight}
        >
          <ListItemIcon>
            <PiCastleTurretLight />
            <TbHexagonLetterS />
          </ListItemIcon>
          <span>Wall Straight</span>
        </MenuItem>
        <MenuItem
          title="Add castle wall corner (base is added automatically if needed)"
          value={Pieces.castleWallCorner}
        >
          <ListItemIcon>
            <PiCastleTurretLight />
            <TbHexagonLetterC />
          </ListItemIcon>
          <span>Wall Corner</span>
        </MenuItem>
        <MenuItem value={Pieces.castleArch}>
          <ListItemIcon>
            <GiCastle />
          </ListItemIcon>
          <span>Arch</span>
        </MenuItem>
        <MenuItem value={Pieces.castleArchNoDoor}>
          <ListItemIcon>
            <GiCastleRuins />
          </ListItemIcon>
          <span>Arch (No Door)</span>
        </MenuItem>
        {/* WALL WALK BEGIN */}
        <MenuItem value={PiecePrefixes.wallWalk}>
          <ListItemIcon>
            <TbHexagons />
          </ListItemIcon>
          <span>Wall Walk</span>
        </MenuItem>

        {/* GLYPHS */}
        <Divider />
        <MenuItem value={Pieces.glyphPower}>
          <ListItemIcon>
            <TbHexagonLetterPFilled color={hexTerrainColor.glyphPower} />
          </ListItemIcon>
          <span>Power Glyph</span>
        </MenuItem>
        <MenuItem value={Pieces.glyphTreasure}>
          <ListItemIcon>
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphTreasure} />
          </ListItemIcon>
          <span>Treasure Glyph</span>
        </MenuItem>

        {/* RoadWall, Battlements, Ladders */}
        <Divider />
        <MenuItem value={Pieces.roadWall}>
          <ListItemIcon>
            <GiStoneWall color={hexTerrainColor.concrete} />
          </ListItemIcon>
          <span>Road Wall</span>
        </MenuItem>
        <MenuItem value={Pieces.battlement}>
          <ListItemIcon>
            <GiCrenulatedShield color={hexTerrainColor.concrete} />
          </ListItemIcon>
          <span>Battlement</span>
        </MenuItem>
        <MenuItem value={Pieces.ladder}>
          <ListItemIcon>
            <GiLadder color={hexTerrainColor.ladder} />
          </ListItemIcon>
          <span>Ladder</span>
        </MenuItem>

        {/* START ZONES BEGIN */}
        <Divider />

        <MenuItem value={Pieces.startZone1}>
          <ListItemIcon>
            <TbHexagonNumber1Filled color={hexTerrainColor.z1} />
          </ListItemIcon>
          <span>Start Zone: P1</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone2}>
          <ListItemIcon>
            <TbHexagonNumber2Filled color={hexTerrainColor.z2} />
          </ListItemIcon>
          <span>Start Zone: P2</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone3}>
          <ListItemIcon>
            <TbHexagonNumber3Filled color={hexTerrainColor.z3} />
          </ListItemIcon>
          <span>Start Zone: P3</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone4}>
          <ListItemIcon>
            <TbHexagonNumber4Filled color={hexTerrainColor.z4} />
          </ListItemIcon>
          <span>Start Zone: P4</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone5}>
          <ListItemIcon>
            <TbHexagonNumber5Filled color={hexTerrainColor.z5} />
          </ListItemIcon>
          <span>Start Zone: P5</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone6}>
          <ListItemIcon>
            <TbHexagonNumber6Filled color={hexTerrainColor.z6} />
          </ListItemIcon>
          <span>Start Zone: P6</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone7}>
          <ListItemIcon>
            <TbHexagonNumber7Filled color={hexTerrainColor.z7} />
          </ListItemIcon>
          <span>Start Zone: P7</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone8}>
          <ListItemIcon>
            <TbHexagonNumber8Filled color={hexTerrainColor.z8} />
          </ListItemIcon>
          <span>Start Zone: P8</span>
        </MenuItem>

        {/* Marvel RUINS */}
        <Divider />
        <MenuItem value={Pieces.marvel}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.marvelRuin} />
          </ListItemIcon>
          <span>Marvel Ruins</span>
        </MenuItem>
        <MenuItem value={Pieces.marvelBroken}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.marvelRuin} />
          </ListItemIcon>
          <span>Marvel Ruins - Wall Destroyed</span>
        </MenuItem>
        <MenuItem value={Pieces.marvelNoUpper}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.marvelRuin} />
          </ListItemIcon>
          <span>Marvel Ruins - No Upper Floor</span>
        </MenuItem>
        <MenuItem value={Pieces.marvelNoUpperBroken}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.marvelRuin} />
          </ListItemIcon>
          <span>Marvel Ruins - No Upper Floor, Wall Destroyed</span>
        </MenuItem>

      </Select>
    </FormControl>
  )
}
