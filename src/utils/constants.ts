export const HEXGRID_SPACING = 1 // removed for the sake of blender/grid niceness
export const HEXGRID_HEX_RADIUS = 1
export const HEXGRID_HEX_APOTHEM = (Math.sqrt(3) / 2) * HEXGRID_HEX_RADIUS
export const SVG_HEX_RADIUS = 10
export const SVG_HEX_APOTHEM = (Math.sqrt(3) / 2) * SVG_HEX_RADIUS
export const ORIGIN_000 = { q: 0, r: 0, s: 0 }
export const CUBE_EAST = { q: 1, r: 0, s: -1 }
export const CUBE_SE = { q: 0, r: 1, s: -1 }
export const CUBE_SW = { q: -1, r: 1, s: 0 }
export const CUBE_WEST = { q: -1, r: 0, s: 1 }
export const CUBE_NW = { q: 0, r: -1, s: 1 }
export const CUBE_NE = { q: 1, r: -1, s: 0 }
// HEX DIMENSIONS: according to HS hex image
// solid hex height: 7/16" (1.11125 cm)
// fluid hex height: 3/16" (0.47625 cm)
// solid height to fluid height 7:3, 2.3333
// hex height to solid cap height: 7:1
// -------------------------------------
// CAP DIMENSIONS
// solid hex subterrain height: 3/8" (0.9525cm)
// solid hex cap height: 1/16" (0.15875cm)
// solid hex flat-to-flat: 1 3/4" (4.445cm)
// solid hex flat-to-flat wall thickness: 1/32" (0.079375cm)
// solid hex side: 1 1/128" (2.55984375cm)
// hex side male plug width: 7/32" (0.555625cm)
// hex side female plug width: 6/32" (0.47625cm)
export const HEXGRID_HEX_HEIGHT = 0.35 // 0.375 was BEST fit to the 24-hex tile scan, but castle-walls and ladders have already been tailored to 0.35!
export const HEXGRID_HEXCAP_HEIGHT = HEXGRID_HEX_HEIGHT / 7 // for solid tiles the cap is a seventh of the height
export const HEXGRID_HEXCAP_FLUID_SCALE = 3 / 7 // fluid tiles are 3/7 the height of solid tiles, the whole fluid tile is the cap
export const HEXGRID_HEXCAP_FLUID_HEIGHT =
  HEXGRID_HEX_HEIGHT * HEXGRID_HEXCAP_FLUID_SCALE // 0.35 * 3/7 === 0.15
export const HEXGRID_EMPTYHEX_HEIGHT = HEXGRID_HEX_HEIGHT / 20
export const HEXGRID_MAX_ALTITUDE = 100 // Arbitrary
export const MAX_RECTANGLE_MAP_DIMENSION = 40 // Arbitrary : BUT a 3ft/6ft table with 27mm based minis would be 34x68 hex rectangle
export const MAX_HEXAGON_MAP_DIMENSION = 20 // Arbitrary
export const INSTANCE_LIMIT =
  MAX_RECTANGLE_MAP_DIMENSION *
  MAX_RECTANGLE_MAP_DIMENSION *
  HEXGRID_MAX_ALTITUDE
export const CAMERA_FOV = 65
export const EVENTS = {
  savePng: 'savePng',
  saveJpg: 'saveJpg',
  toggleOrthoCam: 'toggleOrthoCam',
}
export const LS_KEYS = {
  pieceInventory: 'pieceInventory',
}
export const LAYOUT_POINTY = {
  f0: Math.sqrt(3.0),
  f1: Math.sqrt(3.0) / 2.0,
  f2: 0.0,
  f3: 3.0 / 2.0,
  b0: Math.sqrt(3.0) / 3.0,
  b1: -1.0 / 3.0,
  b2: 0.0,
  b3: 2.0 / 3.0,
  startAngle: 0.5,
}
// const LAYOUT_FLAT = {
//   f0: 3.0 / 2.0,
//   f1: 0.0,
//   f2: Math.sqrt(3.0) / 2.0,
//   f3: Math.sqrt(3.0),
//   b0: 2.0 / 3.0,
//   b1: 0.0,
//   b2: -1.0 / 3.0,
//   b3: Math.sqrt(3.0) / 3.0,
//   startAngle: 0.0,
// }
