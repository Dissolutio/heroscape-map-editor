import type { HexMap } from "../types";

export function isHexMap(item: unknown): item is HexMap {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'shape' in item &&
    'length' in item &&
    'width' in item
  )
}