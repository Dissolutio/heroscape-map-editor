import { Divider, ListItemIcon } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MuiMenuItem, { type MenuItemProps } from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Button from '@mui/material/Button'
import { useMemo } from 'react'
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
import {
  HexTerrain,
  type HexoscapeGlyph,
  PiecePrefixes,
  Pieces,
} from '../types'
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
import {
  getAvailableLandPrefixesForInventory,
  getAvailableLandPrefixesForSets,
  getEffectiveTerrainConstraintInventory,
  hasActiveTerrainConstraints,
} from '../utils/terrain-constraints'

export default function PenModeControls() {
  const penMode = useBoundStore((state) => state.penMode)
  const lastPenMode = useBoundStore((state) => state.lastPenMode)
  const setsUsed = useBoundStore((state) => state.hexMap.setsUsed)
  const terrainConstraintSource = useBoundStore(
    (state) => state.terrainConstraintSource,
  )
  const customConstraintInventory = useBoundStore(
    (state) => state.customConstraintInventory,
  )
  const customConstraintInventoryFileName = useBoundStore(
    (state) => state.customConstraintInventoryFileName,
  )
  const userPieceInventory = useBoundStore((state) => state.userPieceInventory)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
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
  const constrainedInventory = useMemo(() => {
    return getEffectiveTerrainConstraintInventory({
      setsUsed,
      terrainConstraintSource,
      customConstraintInventory,
      userPieceInventory,
    })
  }, [
    customConstraintInventory,
    setsUsed,
    terrainConstraintSource,
    userPieceInventory,
  ])
  const hasSetConstraints = hasActiveTerrainConstraints({
    setsUsed,
    terrainConstraintSource,
    customConstraintInventoryFileName,
  })
  const availableLandPrefixes = useMemo(() => {
    return terrainConstraintSource === 'setsUsed'
      ? getAvailableLandPrefixesForSets(setsUsed)
      : getAvailableLandPrefixesForInventory(constrainedInventory)
  }, [constrainedInventory, setsUsed, terrainConstraintSource])
  const alwaysVisiblePenValues = useMemo(
    () =>
      new Set<string>([
        'select',
        lastPenMode,
        Pieces.glyphPower,
        Pieces.glyphTreasure,
        Pieces.startZone1,
        Pieces.startZone2,
        Pieces.startZone3,
        Pieces.startZone4,
        Pieces.startZone5,
        Pieces.startZone6,
        Pieces.startZone7,
        Pieces.startZone8,
      ]),
    [lastPenMode],
  )
  const filteredByAlias: Record<string, string[]> = {
    [Pieces.castleArchNoDoor]: [Pieces.castleArch],
    [Pieces.marvelBroken]: [Pieces.marvel],
    [Pieces.marvelNoUpper]: [Pieces.marvel],
    [Pieces.marvelNoUpperBroken]: [Pieces.marvel],
    [Pieces.laurWallShort]: [Pieces.laurWallShortStackable],
    [Pieces.laurWallLong]: [Pieces.laurWallLongStackable],
    [Pieces.laurWallRuin1]: [Pieces.laurWallRuin2, Pieces.laurWallRuin3],
  }
  const filteredPrefixModes = new Set<string>([
    PiecePrefixes.grass,
    PiecePrefixes.rock,
    PiecePrefixes.sand,
    PiecePrefixes.road,
    PiecePrefixes.wallWalk,
    PiecePrefixes.lavaField,
    PiecePrefixes.snow,
    PiecePrefixes.concrete,
    PiecePrefixes.asphalt,
    PiecePrefixes.swamp,
    PiecePrefixes.dungeon,
    PiecePrefixes.toxic,
    PiecePrefixes.ancientTerrain,
    PiecePrefixes.wood,
    PiecePrefixes.water,
    PiecePrefixes.wellspringWater,
    PiecePrefixes.toxicWater,
    PiecePrefixes.ice,
    PiecePrefixes.lava,
    PiecePrefixes.swampWater,
    PiecePrefixes.shadow,
  ])
  const isPieceAvailable = (pieceID: string) => {
    if (!hasSetConstraints) {
      return true
    }
    if ((constrainedInventory[pieceID] ?? 0) > 0) {
      return true
    }
    const aliases = filteredByAlias[pieceID] ?? []
    return aliases.some((alias) => (constrainedInventory[alias] ?? 0) > 0)
  }
  const isPrefixAvailable = (prefix: string) => {
    if (!hasSetConstraints) {
      return true
    }
    return availableLandPrefixes.has(prefix)
  }
  const shouldShowMenuValue = (value: unknown) => {
    if (!hasSetConstraints) {
      return true
    }
    if (typeof value !== 'string') {
      return true
    }
    if (
      value === penMode ||
      alwaysVisiblePenValues.has(value) ||
      value.startsWith(PiecePrefixes.startZone) ||
      value.startsWith(PiecePrefixes.glyph)
    ) {
      return true
    }
    if (filteredPrefixModes.has(value)) {
      return isPrefixAvailable(value)
    }
    return isPieceAvailable(value)
  }
  type FilteredMenuItemProps = MenuItemProps & { 'data-value'?: unknown }
  const MenuItem = ({ value, ...props }: FilteredMenuItemProps) => {
    const menuValue = (value ?? props['data-value']) as
      | string
      | number
      | readonly string[]
      | undefined
    if (!shouldShowMenuValue(menuValue)) {
      return null
    }
    return <MuiMenuItem {...props} value={menuValue} />
  }
  const { hotkeyLookup } = useHotkeyConfig()
  const StartZoneIcon = ({
    zone,
    pieceId,
  }: { zone: number; pieceId: string }) => {
    const circleMap = {
      1: TbCircleNumber1Filled,
      2: TbCircleNumber2Filled,
      3: TbCircleNumber3Filled,
      4: TbCircleNumber4Filled,
      5: TbCircleNumber5Filled,
      6: TbCircleNumber6Filled,
      7: TbCircleNumber7Filled,
      8: TbCircleNumber8Filled,
    } as const
    const hexagonMap = {
      1: TbHexagonNumber1Filled,
      2: TbHexagonNumber2Filled,
      3: TbHexagonNumber3Filled,
      4: TbHexagonNumber4Filled,
      5: TbHexagonNumber5Filled,
      6: TbHexagonNumber6Filled,
      7: TbHexagonNumber7Filled,
      8: TbHexagonNumber8Filled,
    } as const
    const zoneKey = zone as keyof typeof circleMap
    const CircleIcon = circleMap[zoneKey]
    const HexagonIcon = hexagonMap[zoneKey]
    return useLegacyStartZones ? (
      <CircleIcon
        title="This is the color of the startzone circle in 3D & PDF view"
        color={hexTerrainColor[pieceId]}
      />
    ) : (
      <HexagonIcon
        title="This is the color of the startzone hexagon in 2D/SVG view"
        color={svgColors[pieceId]}
      />
    )
  }
  return (
    <FormControl fullWidth variant="filled">
      <InputLabel id="pen-terrain-select-label">Pen Mode</InputLabel>
      <Select
        // autoWidth
        fullWidth
        MenuProps={{
          anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
          // When multiple tabs open, Select malfunctions and won't scroll past focus, add 4 props below to fix:
          // autoFocus: false,
          // disableAutoFocusItem: true,
          // disableEnforceFocus: true,
          // disableScrollLock: true
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
        <MenuItem value={PiecePrefixes.wallWalk}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.road} />
          </ListItemIcon>
          <span>Wall Walk</span>
          <HotkeyText text={hotkeyLookup.togglePenModeWallWalk} />
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
        <MenuItem value={PiecePrefixes.ancientTerrain}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.ancientTerrain} />
          </ListItemIcon>
          <span>Ancient Terrain</span>
          <HotkeyText text={hotkeyLookup.togglePenModeAncientTerrain} />
        </MenuItem>
        <MenuItem value={PiecePrefixes.wood}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor.wood} />
          </ListItemIcon>
          <span>Wood</span>
          <HotkeyText text={hotkeyLookup.togglePenModeWood} />
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
          <span>Molten Lava</span>
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
        <MenuItem value={Pieces.snowTree10}>
          <ListItemIcon>
            <GiPineTree color={hexTerrainColor.snow} />
          </ListItemIcon>
          <span>Snow Tree 10</span>
        </MenuItem>
        <MenuItem value={Pieces.snowTree12}>
          <ListItemIcon>
            <GiPineTree color={hexTerrainColor.snow} />
          </ListItemIcon>
          <span>Snow Tree 12</span>
        </MenuItem>
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

        {/* Shores of Valhalla */}
        <Divider />
        <MenuItem value={Pieces.cannon}>
          <ListItemIcon>
            <TbHexagonLetterC color={hexTerrainColor.cannonCarriage} />
          </ListItemIcon>
          <span>Cannon</span>
        </MenuItem>
        <MenuItem value={Pieces.ropeLadder}>
          <ListItemIcon>
            <GiLadder color={hexTerrainColor.ladder} />
          </ListItemIcon>
          <span>Rope Ladder</span>
        </MenuItem>
        <MenuItem value={Pieces.shipWall}>
          <ListItemIcon>
            <TbHexagonLetterS
              color={hexTerrainColor[HexTerrain.wood]}
              style={{ fontSize: '0.8rem' }}
            />
            <TbHexagonLetterS
              color={hexTerrainColor[HexTerrain.wood]}
              style={{ fontSize: '0.8rem', marginLeft: '-0.4rem' }}
            />
            <TbHexagonLetterS
              color={hexTerrainColor[HexTerrain.wood]}
              style={{ fontSize: '0.8rem', marginLeft: '-0.4rem' }}
            />
          </ListItemIcon>
          <span>Ship Wall</span>
        </MenuItem>
        <MenuItem value={Pieces.shipBow}>
          <ListItemIcon>
            <TbHexagons color={hexTerrainColor[HexTerrain.wood]} />
          </ListItemIcon>
          <span>Ship Bow</span>
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

        {/* Castle Bases, Walls */}
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

        {hasSetConstraints && (
          <>
            <Divider />
            <MuiMenuItem
              disableRipple
              disableTouchRipple
              onClick={(event) => event.preventDefault()}
              sx={{
                alignItems: 'flex-start',
                cursor: 'default',
                display: 'block',
                py: 1,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.8em',
                  marginBottom: '0.35rem',
                  whiteSpace: 'normal',
                }}
              >
                Additional terrain and obstacle options are hidden because this
                map has active terrain constraints.
              </span>
              <Button
                size="small"
                variant="outlined"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleIsEditMapDialogOpen(true)
                }}
              >
                Edit Constraints
              </Button>
            </MuiMenuItem>
          </>
        )}

        {/* START ZONES */}
        <Divider />
        <MenuItem value={Pieces.startZone1}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone1} zone={1} />
          </ListItemIcon>
          <span>Start Zone: P1</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone2}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone2} zone={2} />
          </ListItemIcon>
          <span>Start Zone: P2</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone3}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone3} zone={3} />
          </ListItemIcon>
          <span>Start Zone: P3</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone4}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone4} zone={4} />
          </ListItemIcon>
          <span>Start Zone: P4</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone5}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone5} zone={5} />
          </ListItemIcon>
          <span>Start Zone: P5</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone6}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone6} zone={6} />
          </ListItemIcon>
          <span>Start Zone: P6</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone7}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone7} zone={7} />
          </ListItemIcon>
          <span>Start Zone: P7</span>
        </MenuItem>
        <MenuItem value={Pieces.startZone8}>
          <ListItemIcon>
            <StartZoneIcon pieceId={Pieces.startZone8} zone={8} />
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
  l: 'molten lava',
  ws: 'swamp water',
  sh: 'shadow',
  cg: 'wall walk',
  at: 'ancient terrain',
}
