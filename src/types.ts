export type MapState = MapFileState & {
  boardHexes: BoardHexes
}
export type MapFileState = {
  hexMap: HexMap
  boardPieces: string[] // just an array of piece IDs, which include q coordinate, r coordinate, altitude, and rotation
}
export type HexMap = {
  id: string
  name: string
  author: string
  // sets: string
  shape: string // 'hexagon' | 'rectangle'
  length: number // for hexagon shaped maps width=length=size
  width: number // for hexagon shaped maps width=length=size
  setsUsed?: string[] // array of terrainSets Ids
  // properties below are written as BLANK STRINGS in URL-shareable format
  mapPortraitBase64?: string // a base64 representation of image of map (taken or submitted by user)
  mapNotes?: string // notes about the map, added by user
}
export type CubeCoordinate = {
  q: number
  r: number
  s: number
}
export type Point = {
  x: number
  y: number
}
export interface BoardHex extends CubeCoordinate {
  id: string
  altitude: number
  pieceID: string // tileID=qraID + piece-UID
  inventoryID: string // just the piece UID
  terrain: string
  pieceRotation: number
  isCap?: boolean // caps are uncovered (no land hex above them) land hexes
  interlockType?: string // 0,1,2,3,3B,4,4B,5,6 interlocking hex types https://github.com/Dissolutio/heroscape-map-editor/issues/3
  interlockRotation?: number // 1-6, each interlock has a rotatin WITHIN its template
  isObstacleOrigin?: boolean // This marks the boardHex that will render the obstacle model
  isObstacleSecondary?: boolean // This marks the second cap for castle arch, maybe future uses
  isObstacleAuxiliary?: boolean // These are hexes that are same altitude as origin hex, but ignored for rendering
  obstacleHeight?: number // used to find the cap hex when clicking a castle wall (it's 9 up with a base, 8 up when wall-on-wall)
  isVerticalClearanceHex?: boolean // These are hexes that are above the origin/auxiliary hexes
}
export type BoardPieces = string[]
export type BoardHexes = {
  [qraID: string]: BoardHex
}
export enum HexTerrain {
  empty = 'empty',
  dirt = 'dirt', // dirt is just the subTerrain for grass/rock/sand
  // solid land
  grass = 'grass',
  rock = 'rock',
  sand = 'sand',
  road = 'road',
  snow = 'snow',
  lavaField = 'lavaField',
  swamp = 'swamp',
  asphalt = 'asphalt',
  concrete = 'concrete',
  dungeon = 'dungeon',
  // fluid land
  wellspringWater = 'wellspringWater',
  water = 'water',
  lava = 'lava',
  ice = 'ice',
  swampWater = 'swampWater',
  shadow = 'shadow',
  // hex obstacle
  laurWall = 'laurWall',
  laurWallAddon = 'laurWallAddon',
  tree = 'tree',
  snowTree = 'snowTree',
  palm = 'palm',
  brush = 'brush',
  outcrop = 'outcrop',
  lavaRockOutcrop = 'lavaRockOutcrop',
  glacier = 'glacier',
  hive = 'hive',
  // edge obstacle
  ruin = 'ruin',
  marvelRuin = 'marvelRuin',
  // edge addon
  roadWall = 'roadWall',
  battlement = 'battlement',
  ladder = 'ladder',
  // castle
  castle = 'castle',
  wallWalk = 'wallWalk',
  // other
  glyphPower = 'glyphPower',
  glyphTreasure = 'glyphTreasure',
  startZone = 'startZone',
  _vsPersonal = '_vsPersonal',
  _vsFigure = '_vsFigure',
}
export type PieceInventory = { [key: string]: number }
export type Piece = {
  id: string
  title: string // the human friendly name
  terrain: string
  size: number
  template: string
  height: number
  isHexTerrainPiece: boolean
  isObstaclePiece: boolean
  landPrefix?: PiecePrefixes // Including this so land pieces can have their sizes computed for piece-size selection in the Controls
  // TODO: account for 1 marvel wall => 4 variations, 1 castle arch => 2 variations
  isUninventoried?: boolean // so far just marvel-ruins-broken and castle-arch-no-door versions (these are just variations on their inventoried counterparts)
}
export type PieceSet = {
  id: PieceSetIds
  title: string // the human friendly name
  inventory: PieceInventory
  abbreviation: string
}
export enum PiecePrefixes {
  startZone = 'z',
  grass = 'g',
  rock = 'r',
  sand = 's',
  dungeon = 'd',
  swamp = 'sw',
  lavaField = 'lf',
  asphalt = 'a',
  concrete = 'c',
  snow = 'sn',
  road = 'rd',
  wellspringWater = 'ww',
  water = 'w',
  lava = 'l',
  swampWater = 'ws',
  ice = 'i',
  shadow = 'sh',
  tree = 'tr',
  snowTree = 'str',
  palm = 'tp',
  laurPalm = 'lp',
  outcrop = 'o',
  lavaRockOutcrop = 'ol',
  glacier = 'og',
  ruins = 'rs',
  wallWalk = 'cg',
  castleBase = 'cb',
  castleWall = 'cw',
  laurWall = 'lw',
  castleArch = 'ca',
  glyph = 'y',
}
export enum PieceSetIds {
  // these inventory IDs are purposely short, to make their character length small for maximum-sized URL-shareable maps
  aoaMaster1 = 'aoa',
  mstk = 'mstk',
  totk = 'totk',
  battleForWellspring = 'bftw',
  laurJungle = 'lj',
  landsOfValhalla = 'lov',
  watersOfValhalla = 'wov',
  swampsOfValhalla = 'sov',
  snowfieldsOfValhalla = 'sfov',
  lavafieldsOfValhalla = 'lfov',
  volcarren = 'volc',
  ticallaJungle = 'tj',
  forgottenForest = 'ff',
  underdarkMaster = 'bftu',
  fortress = 'fort',
  marvel = 'marv',
  thaelenkTundra = 'tt',
  riseOfValkyrieMaster = 'rotv',
  swarmOfMarroMaster = 'sotm',
}
export const Pieces = {
  startZone1: `${PiecePrefixes.startZone}1`,
  startZone2: `${PiecePrefixes.startZone}2`,
  startZone3: `${PiecePrefixes.startZone}3`,
  startZone4: `${PiecePrefixes.startZone}4`,
  startZone5: `${PiecePrefixes.startZone}5`,
  startZone6: `${PiecePrefixes.startZone}6`,
  startZone7: `${PiecePrefixes.startZone}7`,
  startZone8: `${PiecePrefixes.startZone}8`,
  // these inventory IDs are purposely short, to make their character length small for maximum-sized URL-shareable maps
  grass1: `${PiecePrefixes.grass}1`,
  grass2: `${PiecePrefixes.grass}2`,
  grass3: `${PiecePrefixes.grass}3`,
  grass7: `${PiecePrefixes.grass}7`,
  grass24: `${PiecePrefixes.grass}24`,
  rock1: `${PiecePrefixes.rock}1`,
  rock2: `${PiecePrefixes.rock}2`,
  rock3: `${PiecePrefixes.rock}3`,
  rock7: `${PiecePrefixes.rock}7`,
  rock24: `${PiecePrefixes.rock}24`,
  sand1: `${PiecePrefixes.sand}1`,
  sand2: `${PiecePrefixes.sand}2`,
  sand3: `${PiecePrefixes.sand}3`,
  sand7: `${PiecePrefixes.sand}7`,
  sand24: `${PiecePrefixes.sand}24`,
  dungeon1: `${PiecePrefixes.dungeon}1`,
  dungeon2: `${PiecePrefixes.dungeon}2`,
  dungeon3: `${PiecePrefixes.dungeon}3`,
  dungeon7: `${PiecePrefixes.dungeon}7`,
  dungeon24: `${PiecePrefixes.dungeon}24`,
  swamp1: `${PiecePrefixes.swamp}1`,
  swamp2: `${PiecePrefixes.swamp}2`,
  swamp3: `${PiecePrefixes.swamp}3`,
  swamp7: `${PiecePrefixes.swamp}7`,
  swamp24: `${PiecePrefixes.swamp}24`,
  snow1: `${PiecePrefixes.snow}1`,
  snow2: `${PiecePrefixes.snow}2`,
  snow3: `${PiecePrefixes.snow}3`,
  snow7: `${PiecePrefixes.snow}7`,
  snow24: `${PiecePrefixes.snow}24`,
  lavaField1: `${PiecePrefixes.lavaField}1`,
  lavaField2: `${PiecePrefixes.lavaField}2`,
  lavaField3: `${PiecePrefixes.lavaField}3`,
  lavaField7: `${PiecePrefixes.lavaField}7`,
  lavaField24: `${PiecePrefixes.lavaField}24`,
  asphalt1: `${PiecePrefixes.asphalt}1`,
  asphalt2: `${PiecePrefixes.asphalt}2`,
  asphalt7: `${PiecePrefixes.asphalt}7`,
  concrete1: `${PiecePrefixes.concrete}1`,
  concrete2: `${PiecePrefixes.concrete}2`,
  concrete6: `${PiecePrefixes.concrete}6`, // base of marvel ruin
  concrete7: `${PiecePrefixes.concrete}7`,
  road1: `${PiecePrefixes.road}1`,
  road2: `${PiecePrefixes.road}2`,
  road5: `${PiecePrefixes.road}5`, // only land piece to have the straight-5 template, it's a bridge
  wellspringWater1: `${PiecePrefixes.wellspringWater}1`,
  water1: `${PiecePrefixes.water}1`,
  water3: `${PiecePrefixes.water}3`,
  lava1: `${PiecePrefixes.lava}1`,
  lava3: `${PiecePrefixes.lava}3`,
  swampWater1: `${PiecePrefixes.swampWater}1`,
  swampWater3: `${PiecePrefixes.swampWater}3`,
  swampWater6: `${PiecePrefixes.swampWater}6`,
  ice1: `${PiecePrefixes.ice}1`,
  ice3: `${PiecePrefixes.ice}3`,
  ice4: `${PiecePrefixes.ice}4`,
  ice6: `${PiecePrefixes.ice}6`,
  shadow1: `${PiecePrefixes.shadow}1`,
  shadow3: `${PiecePrefixes.shadow}3`,
  // EdgeAddons -- rendered from BoardPieces not BoardHexes
  roadWall: 'rw',
  battlement: 'bt',
  ladder: 'ld', //rendered from BoardHexes
  // LaurWall -- rendered from BoardPieces not BoardHexes
  laurWallSquarePillar: `${PiecePrefixes.laurWall}p`, //rendered from BoardHexes
  laurWallPillarStackable: `${PiecePrefixes.laurWall}p2`, //rendered from BoardHexes
  laurWallTrianglePillar: `${PiecePrefixes.laurWall}t`, // triangle pillars have 2 configurations (can be plugged into bases 2 ways), so one config will be rendered at a 30 degree rotation from the other
  laurWallShort: `${PiecePrefixes.laurWall}s`,
  laurWallShortStackable: `${PiecePrefixes.laurWall}s2`,
  laurWallLong: `${PiecePrefixes.laurWall}l`,
  laurWallArch: `${PiecePrefixes.laurWall}a`,
  laurWallLongStackable: `${PiecePrefixes.laurWall}l2`,
  laurWallRuin1: `${PiecePrefixes.laurWall}r`, // most damaged
  laurWallRuin2: `${PiecePrefixes.laurWall}r2`, // 2nd most damaged
  laurWallRuin3: `${PiecePrefixes.laurWall}r3`, // 3rd most damaged
  // HexObstacles
  snowTree10: `${PiecePrefixes.snowTree}10`,
  snowTree12: `${PiecePrefixes.snowTree}12`,
  tree10: `${PiecePrefixes.tree}10`,
  tree11: `${PiecePrefixes.tree}11`,
  tree12: `${PiecePrefixes.tree}12`,
  tree415: `${PiecePrefixes.tree}15`,
  palm14: `${PiecePrefixes.palm}14`,
  palm15: `${PiecePrefixes.palm}15`,
  palm16: `${PiecePrefixes.palm}16`,
  brush9: 'tb9',
  swampBrush10: 'sb10',
  laurPalm13: `${PiecePrefixes.laurPalm}13`,
  laurPalm14: `${PiecePrefixes.laurPalm}14`,
  laurPalm15: `${PiecePrefixes.laurPalm}15`,
  laurBrush10: 'lb10',
  outcrop1: `${PiecePrefixes.outcrop}1`,
  outcrop3: `${PiecePrefixes.outcrop}3`,
  lavaRockOutcrop1: `${PiecePrefixes.lavaRockOutcrop}1`,
  lavaRockOutcrop3: `${PiecePrefixes.lavaRockOutcrop}3`,
  glacier1: `${PiecePrefixes.glacier}1`,
  glacier3: `${PiecePrefixes.glacier}3`,
  glacier4: `${PiecePrefixes.glacier}4`,
  glacier6: `${PiecePrefixes.glacier}6`,
  hive: 'h',
  // EdgeObstacles
  ruins2: `${PiecePrefixes.ruins}2`,
  ruins3: `${PiecePrefixes.ruins}3`,
  marvel: 'rm',
  marvelBroken: 'rmb', //b broken, like castlearch
  marvelNoUpper: 'rmn', //b broken, like castlearch
  marvelNoUpperBroken: 'rmnb', //b broken, like castlearch
  // CastleObstacles
  wallWalk1: `${PiecePrefixes.wallWalk}1`,
  wallWalk7: `${PiecePrefixes.wallWalk}7`,
  wallWalk9: `${PiecePrefixes.wallWalk}9`,
  castleBaseCorner: `${PiecePrefixes.castleBase}c`,
  castleBaseStraight: `${PiecePrefixes.castleBase}s`,
  castleBaseEnd: `${PiecePrefixes.castleBase}e`,
  castleWallCorner: `${PiecePrefixes.castleWall}c`,
  castleWallStraight: `${PiecePrefixes.castleWall}s`,
  castleWallEnd: `${PiecePrefixes.castleWall}e`,
  castleArch: `${PiecePrefixes.castleArch}`,
  castleArchNoDoor: `${PiecePrefixes.castleArch}b`, //b broken, like marvel
  glyphPower: `${PiecePrefixes.glyph}0`, // WIP glyphs
  glyphTreasure: `${PiecePrefixes.glyph}1`,
}
export type AddRemovePieceError =
  | undefined
  | { message?: string; error?: unknown }
export type VirtualScapeMap = {
  version: number
  name: string
  author: string
  playerNumber: string
  scenario: string
  levelPerPage: number
  printingTransparency: number
  printingGrid: boolean
  printTileNumber: boolean
  printStartAreaAsLevel: boolean
  tileCount: number
  tiles: VirtualScapeTile[]
}
export type VirtualScapeTile = {
  type: number
  version: number
  rotation: number
  posX: number
  posY: number
  posZ: number
  glyphLetter: string
  glyphName: string
  startName: string
  colorf: string
  // isFigureTile: boolean
  figure: {
    name: string
    name2: string
  }
  // isPersonalTile: boolean
  personal: {
    pieceSize: number
    textureTop: string
    textureSide: string
    letter: string
    name: string
  }
}
export type PdfMapAltitudeChunk = {
  altitude: number
  hexes: BoardHex[]
  pieces: DecodedPieceID[]
}
export type DecodedPieceID = {
  boardPieceID: string
  inventoryID: string
  altitude: number
  rotation: number
  boardHexID: string
  pieceCoords: CubeCoordinate
  terrain: string
}
export type AddRemovePieceReturn = {
  newBoardHexes: BoardHexes
  newBoardPieces: BoardPieces
  error: AddRemovePieceError
}
