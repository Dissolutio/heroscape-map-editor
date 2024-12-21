export interface MapState {
    boardHexes: BoardHexes
    hexMap: HexMap
    boardPieces: BoardPieces
}

export type HexMap = {
    id: string
    name: string
    shape: string // 'hexagon' | 'rectangle'
    height: number // for hexagon shaped maps width=height=size
    width: number // for hexagon shaped maps width=height=size
}
export type CubeCoordinate = {
    q: number
    r: number
    s: number
}
export interface BoardHex extends CubeCoordinate {
    id: string
    altitude: number
    terrain: string // copied from piece (duplicate state)
    pieceID: string // tileID=qraID + piece-UID
    isCap: boolean
    pieceRotation: number
    isObstacleOrigin?: boolean
    isAuxiliary?: boolean
    isCastleBase?: boolean
    obstacleHeight?: number
}
export type BoardPieces = {
    [id: string]: Pieces
}
export type BoardHexes = {
    [qraID: string]: BoardHex
}
export enum HexTerrain {
    empty = 'empty',
    // solid
    grass = 'grass',
    rock = 'rock',
    sand = 'sand',
    dirt = 'dirt', // dirt is just the subTerrain for grass/rock/sand
    road = 'road',
    snow = 'snow',
    lavaField = 'lavaField',
    swamp = 'swamp',
    asphalt = 'asphalt',
    concrete = 'concrete',
    dungeon = 'dungeon',
    // fluid
    wellspringWater = 'wellspringWater',
    water = 'water',
    lava = 'lava',
    ice = 'ice',
    swampWater = 'swampWater',
    shadow = 'shadow',
    // hex obstacle
    laurPillar = 'laurPillar',
    tree = 'tree',
    jungle = 'jungle', // this will become brush and palm ??
    palm = 'palm',
    brush = 'brush',
    outcrop = 'outcrop',
    glacier = 'glacier',
    hive = 'hive',
    // edge obstacle
    ruin = 'ruin',
    marvelRuin = 'marvelRuin',
    // edge addon
    roadWall = 'roadWall',
    battlement = 'battlement',
    castleFlag = 'castleFlag',
    ladder = 'ladder',
    // castle
    castle = 'castle',
    wallWalk = 'wallWalk',
    // other
    glyph = 'glyph',
    _vsPersonal = '_vsPersonal',
    _vsFigure = '_vsFigure',
}
export type Piece = {
    id: string; // aqr+pieceID
    inventoryID: Pieces
    terrain: string;
    size: number;
    template: string;
    height: number;
    isLand: boolean;
    buddyID?: string; // castle walls and bases, laur walls and bases, glaciers, outcrops, hive, etc
}
export enum Pieces {
    grass1 = 'grass1',
    grass2 = 'grass2',
    grass3 = 'grass3',
    grass7 = 'grass7',
    grass24 = 'grass24',
    rock1 = 'rock1',
    rock2 = 'rock2',
    rock3 = 'rock3',
    rock7 = 'rock7',
    rock24 = 'rock24',
    sand1 = 'sand1',
    sand2 = 'sand2',
    sand3 = 'sand3',
    sand7 = 'sand7',
    sand24 = 'sand24',
    dungeon1 = 'dungeon1',
    dungeon2 = 'dungeon2',
    dungeon3 = 'dungeon3',
    dungeon7 = 'dungeon7',
    dungeon24 = 'dungeon24',
    swamp1 = 'swamp1',
    swamp2 = 'swamp2',
    swamp3 = 'swamp3',
    swamp7 = 'swamp7',
    swamp24 = 'swamp24',
    lavaField1 = 'lavaField1',
    lavaField2 = 'lavaField2',
    lavaField7 = 'lavaField7',
    asphalt1 = 'asphalt1',
    asphalt2 = 'asphalt2',
    asphalt7 = 'asphalt7',
    concrete1 = 'concrete1',
    concrete2 = 'concrete2',
    concrete7 = 'concrete7',
    snow1 = 'snow1',
    snow2 = 'snow2',
    road1 = 'road1',
    road2 = 'road2',
    road5 = 'road5', // only land piece to have the straight-5 template, it's a bridge
    // Fluid Land: there will be more sizes, and outcrop/glacier/hive bases can be used as multi-hex shadow/ice/swampWater
    wellspringWater1 = 'wellspringWater1',
    water1 = 'water1',
    water3 = 'water3',
    lava1 = 'lava1',
    swampWater1 = 'swampWater1',
    ice1 = 'ice1',
    ice3 = 'ice3',
    ice4 = 'ice4',
    ice6 = 'ice6',
    shadow1 = 'shadow1',
    shadow3 = 'shadow3',
    // EdgeAddons
    roadWall = 'roadWall',
    battlement = 'battlement',
    flag = 'castleFlag',
    ladder = 'ladder',
    // HexObstacles
    laurPillar = 'laurPillar',
    tree10 = 'tree10',
    tree11 = 'tree11',
    tree12 = 'tree12',
    tree415 = 'tree415',
    palm14 = 'palm14',
    palm15 = 'palm15',
    palm16 = 'palm16',
    brush9 = 'brush9',
    outcrop1 = 'outcrop1',
    outcrop3 = 'outcrop3',
    glacier1 = 'glacier1',
    glacier3 = 'glacier3',
    glacier4 = 'glacier4',
    glacier6 = 'glacier6',
    hive = 'hive',
    // EdgeObstacles
    ruins2 = 'ruins2',
    ruins3 = 'ruins3',
    marvel = 'marvel',
    marvelBroken = 'marvelBroken',
    // CastleObstacles
    wallWalk1 = 'wallWalk1',
    wallWalk7 = 'wallWalk7',
    wallWalk9 = 'wallWalk9',
    castleBaseCorner = 'castleBaseCorner',
    castleBaseStraight = 'castleBaseStraight',
    castleBaseEnd = 'castleBaseEnd',
    castleWallCorner = 'castleWallCorner',
    castleWallStraight = 'castleWallStraight',
    castleWallEnd = 'castleWallEnd',
    castleArch = 'castleArch',
    castleArchNoDoor = 'castleArchNoDoor',
}
export enum PenMode {
    select = 'select',
    eraserStartZone = 'eraserStartZone',
    eraser = HexTerrain.empty,
    grass = HexTerrain.grass,
    sand = HexTerrain.sand,
    rock = HexTerrain.rock,
    road = HexTerrain.road,
    lavaField = HexTerrain.lavaField,
    snow = HexTerrain.snow,
    swamp = HexTerrain.swamp,
    concrete = HexTerrain.concrete,
    asphalt = HexTerrain.asphalt,
    dungeon = HexTerrain.dungeon,
    water = HexTerrain.water,
    wellspringWater = HexTerrain.wellspringWater,
    ice = HexTerrain.ice,
    lava = HexTerrain.lava,
    swampWater = HexTerrain.swampWater,
    shadow = HexTerrain.shadow,
    laurPillar = Pieces.laurPillar,
    tree10 = Pieces.tree10,
    tree11 = Pieces.tree11,
    tree12 = Pieces.tree12,
    tree415 = Pieces.tree415,
    brush9 = Pieces.brush9,
    palm14 = Pieces.palm14,
    palm15 = Pieces.palm15,
    palm16 = Pieces.palm16,
    ruins2 = Pieces.ruins2,
    ruins3 = Pieces.ruins3,
    outcrop1 = Pieces.outcrop1,
    outcrop3 = Pieces.outcrop3,
    glacier1 = Pieces.glacier1,
    glacier3 = Pieces.glacier3,
    glacier4 = Pieces.glacier4,
    glacier6 = Pieces.glacier6,
    hive = Pieces.hive,
    castleBaseEnd = Pieces.castleBaseEnd,
    castleBaseCorner = Pieces.castleBaseCorner,
    castleBaseStraight = Pieces.castleBaseStraight,
    castleWallEnd = Pieces.castleWallEnd,
    castleWallCorner = Pieces.castleWallCorner,
    castleWallStraight = Pieces.castleWallStraight,
    castleArch = Pieces.castleArch,
    castleArchNoDoor = Pieces.castleArchNoDoor,
    wallWalk1 = Pieces.wallWalk1,
    wallWalk7 = Pieces.wallWalk7,
    wallWalk9 = Pieces.wallWalk9,
    startZone0 = 'startZone0',
    startZone1 = 'startZone1',
    startZone2 = 'startZone2',
    // startZone3 = 'startZone3',
    // startZone4 = 'startZone4',
    // startZone5 = 'startZone5',
    // startZone6 = 'startZone6',
    // startZone7 = 'startZone7',
    // startZone8 = 'startZone8',
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
    },
    // isPersonalTile: boolean
    personal: {
        pieceSize: number
        textureTop: string
        textureSide: string
        letter: string
        name: string
    },
}