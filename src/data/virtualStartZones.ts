import { Pieces } from '../types'

export const startAreaColorsToPieceCode: { [colorf: string]: number } = {
  // Keys are the colorf values of StartAreaTiles from virtualscape (the colorf values are these tiles only differentiating property)
  'rgba(255,0,0,0)': 15002, // red 255
  'rgba(0,255,0,0)': 15003, // green 65280
  'rgba(0,0,255,0)': 15004, // blue 16711680
  'rgba(255,255,0,0)': 15005, // yellow 65535
  'rgba(255,0,255,0)': 15006, // violet 16711935
  'rgba(0,255,255,0)': 15007, // cyan 16776960
  'rgba(255,128,0,0)': 15008, // orange  33023
  'rgba(128,0,255,0)': 15009, // purple 16711808
}
