// because we specify {type: 'module} in worker options, we can import from our project!
// import { coolFn } from './someDir/coolFn'

import type { BoardHexes } from "../types"
import { makeHexagonMapEmptyHexes, makeRectangleMapEmptyHexes } from "../utils/hex-gen"

self.onmessage = (event: MessageEvent) => {
  const hexMap = event?.data?.hexMap
  // const boardPieces = event?.data?.boardPieces
  let blankHexes: BoardHexes = {}
  if (hexMap.shape === 'rectangle') {
    blankHexes = makeRectangleMapEmptyHexes(hexMap.width, hexMap.length)
  } else {
    blankHexes = makeHexagonMapEmptyHexes(hexMap.length)
  }
  // const result = makeRectangleMapEmptyHexes
  self.postMessage(blankHexes)
}