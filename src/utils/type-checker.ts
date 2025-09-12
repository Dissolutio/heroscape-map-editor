import type { HexMap } from "../types";

export function isHexMap(item: unknown): item is HexMap {
  return (
    typeof item === 'object' &&
    item !== null &&
    'name' in item &&
    'id' in item &&
    'author' in item &&
    'length' in item &&
    'width' in item
  )
}