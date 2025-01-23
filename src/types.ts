export type MapState = MapFileState & {
  boardHexes: BoardHexes
}
export type MapFileState = {
  hexMap: HexMap
  boardPieces: BoardPieces
}
export type HexMap = {
  id: string
  name: string
  shape: string // 'hexagon' | 'rectangle'
  length: number // for hexagon shaped maps width=length=size
  width: number // for hexagon shaped maps width=length=size
}
export type CubeCoordinate = {
  q: number
  r: number
  s: number
}
type BoardHexVertex = {
  vertex: number // 0-5
  pieceID: string
  pieceRotation: number
  isObstacleOrigin?: boolean // This marks the boardHex that will render the obstacle model
  isObstacleAuxiliary?: boolean // just shows an obstacle base for that hex
}
export interface BoardHex extends CubeCoordinate {
  id: string
  altitude: number
  pieceID: string // tileID=qraID + piece-UID
  terrain: string
  pieceRotation: number
  isCap?: boolean // caps are uncovered (no land hex above them) land hexes
  isObstacleOrigin?: boolean // This marks the boardHex that will render the obstacle model
  isObstacleAuxiliary?: boolean // just shows an obstacle base for that hex
  obstacleHeight?: number // used to find the cap hex when clicking a castle wall (it's 9 up with a base, 8 up when wall-on-wall)
  // DENSE BOARD HEXES : for ladders, battlements, maybe ruins too
  isDenseBoardHex?: boolean
  vertexData?: BoardHexVertex[]
}
export type BoardPieces = {
  [id: string]: Pieces
}
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
  tree = 'tree',
  snowTree = 'snowTree',
  palm = 'palm',
  brush = 'brush',
  laurPalm = 'laurPalm',
  laurBrush = 'laurBrush',
  swampBrush = 'swampBrush',
  outcrop = 'outcrop',
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
  glyph = 'glyph',
  _vsPersonal = '_vsPersonal',
  _vsFigure = '_vsFigure',
}
export type PieceInventory = { [key: string]: number }
export type Piece = {
  id: Pieces // aqr+pieceID (This is important, as this id structure lets us make real small map strings for the URL -- shareable maps!!)
  title: string, // the human friendly name
  terrain: string
  size: number
  template: string
  height: number
  isUninventoried?: boolean, // so far just marvel-ruins-broken and castle-arch-no-door versions (these are just variations on their inventoried counterparts)
}
export enum PiecePrefixes {
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
  glacier = 'og',
  ruins = 'rs',
  wallWalk = 'cg',
  castleBase = 'cb',
  castleWall = 'cw',
  laurWall = 'lw',
  castleArch = 'ca',
}
export enum Pieces {
  // these inventory IDs are purposely short, to make their character length small for maximum-sized URL-sharealbe maps
  grass1 = `${PiecePrefixes.grass}1`,
  grass2 = `${PiecePrefixes.grass}2`,
  grass3 = `${PiecePrefixes.grass}3`,
  grass7 = `${PiecePrefixes.grass}7`,
  grass24 = `${PiecePrefixes.grass}24`,
  rock1 = `${PiecePrefixes.rock}1`,
  rock2 = `${PiecePrefixes.rock}2`,
  rock3 = `${PiecePrefixes.rock}3`,
  rock7 = `${PiecePrefixes.rock}7`,
  rock24 = `${PiecePrefixes.rock}24`,
  sand1 = `${PiecePrefixes.sand}1`,
  sand2 = `${PiecePrefixes.sand}2`,
  sand3 = `${PiecePrefixes.sand}3`,
  sand7 = `${PiecePrefixes.sand}7`,
  sand24 = `${PiecePrefixes.sand}24`,
  dungeon1 = `${PiecePrefixes.dungeon}1`,
  dungeon2 = `${PiecePrefixes.dungeon}2`,
  dungeon3 = `${PiecePrefixes.dungeon}3`,
  dungeon7 = `${PiecePrefixes.dungeon}7`,
  dungeon24 = `${PiecePrefixes.dungeon}24`,
  swamp1 = `${PiecePrefixes.swamp}1`,
  swamp2 = `${PiecePrefixes.swamp}2`,
  swamp3 = `${PiecePrefixes.swamp}3`,
  swamp7 = `${PiecePrefixes.swamp}7`,
  swamp24 = `${PiecePrefixes.swamp}24`,
  snow1 = `${PiecePrefixes.snow}1`,
  snow2 = `${PiecePrefixes.snow}2`,
  snow3 = `${PiecePrefixes.snow}3`,
  snow7 = `${PiecePrefixes.snow}7`,
  snow24 = `${PiecePrefixes.snow}24`,
  lavaField1 = `${PiecePrefixes.lavaField}1`,
  lavaField2 = `${PiecePrefixes.lavaField}2`,
  lavaField7 = `${PiecePrefixes.lavaField}7`,
  asphalt1 = `${PiecePrefixes.asphalt}1`,
  asphalt2 = `${PiecePrefixes.asphalt}2`,
  asphalt7 = `${PiecePrefixes.asphalt}7`,
  concrete1 = `${PiecePrefixes.concrete}1`,
  concrete2 = `${PiecePrefixes.concrete}2`,
  concrete7 = `${PiecePrefixes.concrete}7`,
  road1 = `${PiecePrefixes.road}1`,
  road2 = `${PiecePrefixes.road}2`,
  road5 = `${PiecePrefixes.road}5`, // only land piece to have the straight-5 template, it's a bridge
  wellspringWater1 = `${PiecePrefixes.wellspringWater}1`,
  water1 = `${PiecePrefixes.water}1`,
  water3 = `${PiecePrefixes.water}3`,
  lava1 = `${PiecePrefixes.lava}1`,
  swampWater1 = `${PiecePrefixes.swampWater}1`,
  swampWater3 = `${PiecePrefixes.swampWater}3`,
  swampWater6 = `${PiecePrefixes.swampWater}6`,
  ice1 = `${PiecePrefixes.ice}1`,
  ice3 = `${PiecePrefixes.ice}3`,
  ice4 = `${PiecePrefixes.ice}4`,
  ice6 = `${PiecePrefixes.ice}6`,
  shadow1 = `${PiecePrefixes.shadow}1`,
  shadow3 = `${PiecePrefixes.shadow}3`,
  // EdgeAddons
  roadWall = 'rw',
  battlement = 'bt',
  ladder = 'ld',
  // LaurWall
  laurWallPillar = `${PiecePrefixes.laurWall}p`,
  laurWallShort = `${PiecePrefixes.laurWall}s`,
  laurWallLong = `${PiecePrefixes.laurWall}l`,
  laurWallRuin = `${PiecePrefixes.laurWall}r`,
  // HexObstacles
  snowTree10 = `${PiecePrefixes.snowTree}10`,
  snowTree12 = `${PiecePrefixes.snowTree}12`,
  tree10 = `${PiecePrefixes.tree}10`,
  tree11 = `${PiecePrefixes.tree}11`,
  tree12 = `${PiecePrefixes.tree}12`,
  tree415 = `${PiecePrefixes.tree}15`,
  palm14 = `${PiecePrefixes.palm}14`,
  palm15 = `${PiecePrefixes.palm}15`,
  palm16 = `${PiecePrefixes.palm}16`,
  brush9 = 'tb9',
  swampBrush10 = 'sb10',
  laurPalm13 = `${PiecePrefixes.laurPalm}13`,
  laurPalm14 = `${PiecePrefixes.laurPalm}14`,
  laurPalm15 = `${PiecePrefixes.laurPalm}15`,
  laurBrush10 = 'lb10',
  outcrop1 = `${PiecePrefixes.outcrop}1`,
  outcrop3 = `${PiecePrefixes.outcrop}3`,
  glacier1 = `${PiecePrefixes.glacier}1`,
  glacier3 = `${PiecePrefixes.glacier}3`,
  glacier4 = `${PiecePrefixes.glacier}4`,
  glacier6 = `${PiecePrefixes.glacier}6`,
  hive = 'h',
  // EdgeObstacles
  ruins2 = `${PiecePrefixes.ruins}2`,
  ruins3 = `${PiecePrefixes.ruins}3`,
  marvel = 'rm',
  marvelBroken = 'rmb', //b broken, like castlearch
  // CastleObstacles
  wallWalk1 = `${PiecePrefixes.wallWalk}1`,
  wallWalk7 = `${PiecePrefixes.wallWalk}7`,
  wallWalk9 = `${PiecePrefixes.wallWalk}9`,
  castleBaseCorner = `${PiecePrefixes.castleBase}c`,
  castleBaseStraight = `${PiecePrefixes.castleBase}s`,
  castleBaseEnd = `${PiecePrefixes.castleBase}e`,
  castleWallCorner = `${PiecePrefixes.castleWall}c`,
  castleWallStraight = `${PiecePrefixes.castleWall}s`,
  castleWallEnd = `${PiecePrefixes.castleWall}e`,
  castleArch = `${PiecePrefixes.castleArch}`,
  castleArchNoDoor = `${PiecePrefixes.castleArch}b`, //b broken, like marvel
}

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
export type HexoscapeTile = CubeCoordinate & {
  type: number
  rotation: number
  altitude: number
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
