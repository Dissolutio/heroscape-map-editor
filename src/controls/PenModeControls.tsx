import { Divider, ListItemIcon } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import {
  GiAncientRuins,
  GiArrowCursor,
  GiCastle,
  GiCrenulatedShield,
  GiJungle,
  GiLadder,
  GiMushroom,
  GiPalmTree,
  GiPineTree,
  GiStoneWall,
  GiWhiteTower,
} from 'react-icons/gi'
import useBoundStore from '../store/store'
import { type HexoscapeGlyph, PiecePrefixes, Pieces } from '../types'
import {
  TbCircleNumber1Filled,
  TbCircleNumber2Filled,
  TbCircleNumber3Filled,
  TbCircleNumber4Filled,
  TbCircleNumber5Filled,
  TbCircleNumber6Filled,
  TbCircleNumber7Filled,
  TbCircleNumber8Filled,
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
import { hexTerrainColor, svgColors } from '../world/maphex/hexColors'
import { LiaMountainSolid } from 'react-icons/lia'
import { FaMountainCity } from 'react-icons/fa6'
import {
  FcAddColumn,
  FcAddDatabase,
  FcEnteringHeavenAlive,
} from 'react-icons/fc'
import { HotkeyText } from './HotKeyText'
import { useHotkeyConfig } from './useHotkeyConfig'
import { piecesSoFar } from '../data/pieces'
import {
  powerGlyphs,
  treasureGlyphs,
  marvelGlyphs,
  c3vGlyphs,
  c3vPlaytestGlyphs,
  customGlyphs,
} from '../data/glyphs'

export default function PenModeControls() {
  const penMode = useBoundStore((state) => state.penMode)
  const lastPenMode = useBoundStore((state) => state.lastPenMode)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const handleChange = (event: SelectChangeEvent) => {
    togglePenMode(event.target.value)
  }
  const getGlyphColor = (g: HexoscapeGlyph) => {
    return g.type === 'power'
      ? hexTerrainColor.glyphPower
      : g.type === 'treasure'
        ? hexTerrainColor.glyphTreasure
        : 'white'
  }
  const { hotkeyLookup } = useHotkeyConfig()
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
          <span>Select</span>
          <HotkeyText text={hotkeyLookup.togglePenModeSelect} />
        </MenuItem>

        <MenuItem value={lastPenMode}>
          <ListItemIcon>
            <GiArrowCursor />
          </ListItemIcon>
          <span>{`Last used: ${penModeText?.[lastPenMode] ?? piecesSoFar?.[lastPenMode]?.title ?? ''}`}</span>
          <HotkeyText text={hotkeyLookup.togglePenModeLast} />
        </MenuItem>

        <Divider />
        {/* TERRAIN TYPES BEGIN */}

        <MenuItem value={PiecePrefixes.grass}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.grass} />
          </ListItemIcon>
          <span>Grass</span>
          <HotkeyText text={hotkeyLookup.togglePenModeGrass} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.rock}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.rock} />
          </ListItemIcon>
          <span>Rock</span>
          <HotkeyText text={hotkeyLookup.togglePenModeRock} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.sand}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.sand} />
          </ListItemIcon>
          <span>Sand</span>
          <HotkeyText text={hotkeyLookup.togglePenModeSand} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.road}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.road} />
          </ListItemIcon>
          <span>Road</span>
          <HotkeyText text={hotkeyLookup.togglePenModeRoad} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.lavaField}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.lavaField} />
          </ListItemIcon>
          <span>Lava Field</span>
          <HotkeyText text={hotkeyLookup.togglePenModeLavaField} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.snow}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.snow} />
          </ListItemIcon>
          <span>Snow</span>
          <HotkeyText text={hotkeyLookup.togglePenModeSnow} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.concrete}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.concrete} />
          </ListItemIcon>
          <span>Concrete</span>
          <HotkeyText text={hotkeyLookup.togglePenModeConcrete} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.asphalt}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.rock} />
          </ListItemIcon>
          <span>Asphalt</span>
          <HotkeyText text={hotkeyLookup.togglePenModeAsphalt} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.swamp}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.swampCap} />
          </ListItemIcon>
          <span>Swamp</span>
          <HotkeyText text={hotkeyLookup.togglePenModeSwamp} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.dungeon}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.dungeon} />
          </ListItemIcon>
          <span>Dungeon</span>
          <HotkeyText text={hotkeyLookup.togglePenModeDungeon} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.toxic}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.toxicWater} />
          </ListItemIcon>
          <span>Toxic</span>
          <HotkeyText text={hotkeyLookup.togglePenModeToxic} />
        </MenuItem>
        <Divider />

        {/* FLUID LAND BEGIN */}
        <MenuItem value={PiecePrefixes.water}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Water</span>
          <HotkeyText text={hotkeyLookup.togglePenModeWater} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.wellspringWater}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.wellspringWater} />
          </ListItemIcon>
          <span>Wellspring Water</span>
          <HotkeyText text={hotkeyLookup.togglePenModeWellspringWater} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.toxicWater}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.toxicWater} />
          </ListItemIcon>
          <span>Toxic Water</span>
          <HotkeyText text={hotkeyLookup.togglePenModeToxicWater} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.ice}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.ice} />
          </ListItemIcon>
          <span>Ice</span>
          <HotkeyText text={hotkeyLookup.togglePenModeIce} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.lava}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.lava} />
          </ListItemIcon>
          <span>Lava</span>
          <HotkeyText text={hotkeyLookup.togglePenModeLava} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.swampWater}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.swampWater} />
          </ListItemIcon>
          <span>Swamp Water</span>
          <HotkeyText text={hotkeyLookup.togglePenModeSwampWater} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.shadow}>
          <ListItemIcon>
            <BsHexagonHalf color={hexTerrainColor.castle} />
          </ListItemIcon>
          <span>Shadow</span>
          <HotkeyText text={hotkeyLookup.togglePenModeShadow} />
        </MenuItem>

        <Divider />

        {/* LAUR WALL */}
        <MenuItem value={Pieces.laurWallSquarePillar}>
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
        <MenuItem value={Pieces.laurWallRuin1}>
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
        <MenuItem value={Pieces.laurWallArch}>
          <ListItemIcon>
            <FcEnteringHeavenAlive color={hexTerrainColor.water} />
          </ListItemIcon>
          <span>Laur Wall (Arch)</span>
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
        <MenuItem value={Pieces.fortifiedWall}>
          <ListItemIcon>
            <GiAncientRuins color={hexTerrainColor.ruin} />
          </ListItemIcon>
          <span>Fortified Wall</span>
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

        {/* Shroudshrooms */}
        <Divider />
        <MenuItem value={Pieces.shroudshroom7}>
          <ListItemIcon>
            <GiMushroom
              scale={'120%'}
              color={hexTerrainColor.shroudshroomLightPurple}
            />
          </ListItemIcon>
          <span>Shroudshroom 7</span>
        </MenuItem>
        <MenuItem value={Pieces.shroudshroom10}>
          <ListItemIcon>
            <GiMushroom
              scale={'120%'}
              color={hexTerrainColor.shroudshroomLightPurple}
            />
          </ListItemIcon>
          <span>Shroudshroom 10</span>
        </MenuItem>
        <MenuItem value={Pieces.shroudshroom13}>
          <ListItemIcon>
            <GiMushroom
              color={hexTerrainColor.shroudshroomLightPurple}
              style={{ fontSize: '0.8rem' }}
            />
            <GiMushroom
              color={hexTerrainColor.shroudshroomLightPurple}
              style={{
                fontSize: '0.8rem',
                marginLeft: '-0.3rem',
                marginTop: '0.2rem',
              }}
            />
            <GiMushroom
              color={hexTerrainColor.shroudshroomLightPurple}
              style={{ fontSize: '0.8rem', marginLeft: '-0.3rem' }}
            />
          </ListItemIcon>
          <span>Shroudshroom 13</span>
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
                marginLeft: '-0.5rem',
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
            <GiCastle />
          </ListItemIcon>
          <span>Arch (No Door)</span>
        </MenuItem>
        <MenuItem value={PiecePrefixes.wallWalk}>
          <ListItemIcon>
            <TbHexagons />
          </ListItemIcon>
          <span>Wall Walk</span>
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

        {/* START ZONES */}
        <Divider />
        <MenuItem value={Pieces.startZone1}>
          <ListItemIcon>
            <TbCircleNumber1Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone1]}
            />
            <TbHexagonNumber1Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone1]}
            />
          </ListItemIcon>
          <span>Start Zone: P1</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone2}>
          <ListItemIcon>
            <TbCircleNumber2Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone2]}
            />
            <TbHexagonNumber2Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone2]}
            />
          </ListItemIcon>
          <span>Start Zone: P2</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone3}>
          <ListItemIcon>
            <TbCircleNumber3Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone3]}
            />
            <TbHexagonNumber3Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone3]}
            />
          </ListItemIcon>
          <span>Start Zone: P3</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone4}>
          <ListItemIcon>
            <TbCircleNumber4Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone4]}
            />
            <TbHexagonNumber4Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone4]}
            />
          </ListItemIcon>
          <span>Start Zone: P4</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone5}>
          <ListItemIcon>
            <TbCircleNumber5Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone5]}
            />
            <TbHexagonNumber5Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone5]}
            />
          </ListItemIcon>
          <span>Start Zone: P5</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone6}>
          <ListItemIcon>
            <TbCircleNumber6Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone6]}
            />
            <TbHexagonNumber6Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone6]}
            />
          </ListItemIcon>
          <span>Start Zone: P6</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone7}>
          <ListItemIcon>
            <TbCircleNumber7Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone7]}
            />
            <TbHexagonNumber7Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={svgColors[Pieces.startZone7]}
            />
          </ListItemIcon>
          <span>Start Zone: P7</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone8}>
          <ListItemIcon>
            <TbCircleNumber8Filled
              title="This is the color of the startzone circle in 3D & PDF view"
              color={hexTerrainColor[Pieces.startZone8]}
            />
            <TbHexagonNumber8Filled
              title="This is the color of the startzone hexagon in 2D/SVG view"
              color={svgColors[Pieces.startZone8]}
            />
          </ListItemIcon>
          <span>Start Zone: P8</span>
        </MenuItem>

        {/* GENERIC GLYPHS */}
        <Divider />
        <MenuItem value={Pieces.glyphPower}>
          <ListItemIcon>
            <TbHexagonLetterPFilled color={hexTerrainColor.glyphPower} />
          </ListItemIcon>
          <span>Power Glyph</span>
          <HotkeyText text={hotkeyLookup.togglePenModePowerGlyph} />
        </MenuItem>
        <MenuItem value={Pieces.glyphTreasure}>
          <ListItemIcon>
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphTreasure} />
          </ListItemIcon>
          <span>Treasure Glyph</span>
          <HotkeyText text={hotkeyLookup.togglePenModeTreasureGlyph} />
        </MenuItem>

        {/* POWER GLYPHS */}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <TbHexagonLetterPFilled color={hexTerrainColor.glyphPower} />
          </ListItemIcon>
          <span>Power Glyphs</span>
        </MenuItem>
        {powerGlyphs.map((g) => (
          <MenuItem
            key={g.id}
            value={`${PiecePrefixes.glyph}${g.id}`}
            title={`Glyph of ${g.name}: ${g.description}`}
          >
            <ListItemIcon>
              <span style={{ fontWeight: 'bold', color: getGlyphColor(g) }}>
                {g.glyphLetter}
              </span>
            </ListItemIcon>
            <span>{g.name}</span>
            <div
              style={{
                fontSize: '0.6em',
                marginLeft: '0.5em',
              }}
            >
              ({g.shortName})
            </div>
          </MenuItem>
        ))}
        {/* MARVEL GLYPHS */}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <TbHexagonLetterPFilled color={hexTerrainColor.glyphPower} />
          </ListItemIcon>
          <span>Marvel / Objective Glyphs</span>
        </MenuItem>
        {marvelGlyphs.map((g) => (
          <MenuItem
            key={g.id}
            value={`${PiecePrefixes.glyph}${g.id}`}
            title={`Glyph of ${g.name}: ${g.description}`}
          >
            <ListItemIcon>
              <span style={{ fontWeight: 'bold', color: getGlyphColor(g) }}>
                {g.glyphLetter}
              </span>
            </ListItemIcon>
            <span>{g.name}</span>
            <div
              style={{
                fontSize: '0.6em',
                marginLeft: '0.5em',
              }}
            >
              ({g.shortName})
            </div>
          </MenuItem>
        ))}
        {/* TREASURE GLYPHS */}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphTreasure} />
          </ListItemIcon>
          <span>Treasure Glyphs</span>
        </MenuItem>
        {treasureGlyphs.map((g) => (
          <MenuItem
            key={g.id}
            value={`${PiecePrefixes.glyph}${g.id}`}
            title={`Glyph of ${g.name}: ${g.description}`}
          >
            <ListItemIcon>
              <span
                style={{
                  fontWeight: 'bold',
                  color: getGlyphColor(g),
                }}
              >
                {g.glyphLetter}
              </span>
            </ListItemIcon>
            <span>{g.name}</span>
            <div
              style={{
                fontSize: '0.6em',
                marginLeft: '0.5em',
              }}
            >
              ({g.shortName})
            </div>
          </MenuItem>
        ))}
        {/* C3V GLYPHS */}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphPower} />
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphTreasure} />
          </ListItemIcon>
          <span>C3V Glyphs</span>
        </MenuItem>
        {c3vGlyphs.map((g) => (
          <MenuItem
            key={g.id}
            value={`${PiecePrefixes.glyph}${g.id}`}
            title={`Glyph of ${g.name}: ${g.description}`}
          >
            <ListItemIcon>
              <span style={{ fontWeight: 'bold', color: getGlyphColor(g) }}>
                {g.glyphLetter}
              </span>
            </ListItemIcon>
            <span>{g.name}</span>
            <div
              style={{
                fontSize: '0.6em',
                marginLeft: '0.5em',
              }}
            >
              ({g.shortName})
            </div>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphPower} />
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphTreasure} />
          </ListItemIcon>
          <span>C3V Playtest Glyphs</span>
        </MenuItem>
        {c3vPlaytestGlyphs.map((g) => (
          <MenuItem
            key={g.id}
            value={`${PiecePrefixes.glyph}${g.id}`}
            title={`Glyph of ${g.name}: ${g.description}`}
          >
            <ListItemIcon>
              <span style={{ fontWeight: 'bold', color: getGlyphColor(g) }}>
                {g.glyphLetter}
              </span>
            </ListItemIcon>
            <span>{g.name}</span>
            <div
              style={{
                fontSize: '0.6em',
                marginLeft: '0.5em',
              }}
            >
              ({g.shortName})
            </div>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphPower} />
            <TbHexagonLetterTFilled color={hexTerrainColor.glyphTreasure} />
          </ListItemIcon>
          <span>Custom Glyphs</span>
        </MenuItem>
        {customGlyphs.map((g) => (
          <MenuItem
            key={g.id}
            value={`${PiecePrefixes.glyph}${g.id}`}
            title={`Glyph of ${g.name}: ${g.description}`}
          >
            <ListItemIcon>
              <span style={{ fontWeight: 'bold', color: getGlyphColor(g) }}>
                {g.glyphLetter}
              </span>
            </ListItemIcon>
            <span>{g.name}</span>
            <div
              style={{
                fontSize: '0.6em',
                marginLeft: '0.5em',
              }}
            >
              ({g.shortName})
            </div>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

const penModeText: { [key: string]: string } = {
  g: 'grass',
  r: 'rock',
  s: 'sand',
  d: 'dungeon',
  sw: 'swamp',
  lf: 'lava field',
  a: 'asphalt',
  c: 'concrete',
  rd: 'road',
  sn: 'snow',
  w: 'water',
  ww: 'wellspring water',
  i: 'ice',
  l: 'lava',
  ws: 'swamp water',
  sh: 'shadow',
  cg: 'wall walk',
}
