import type { CameraControls } from '@react-three/drei'
import type { RefObject } from 'react'
import { type Box3, Vector3 } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import { Pieces } from '../types'
import type { BoardHexes, BoardPiece } from '../types'
import { zoomToPieces } from '../utils/camera-utils'
import { getBoardHex3DCoords } from '../utils/map-utils'

const makePiece = (
  uid: string,
  inventoryID: string,
  rotation: number,
  q: number,
): BoardPiece => ({
  uid,
  inventoryID,
  altitude: 2,
  rotation,
  pieceCoords: { q, r: 0, s: -q },
})

const getFootprintPoints = (piece: BoardPiece) => {
  const footprint = getLaurAddonFootprint({
    inventoryID: piece.inventoryID,
    anchor: piece.pieceCoords,
    altitude: piece.altitude,
    rotation: piece.rotation,
  })
  if (!footprint) throw new Error(`Missing footprint for ${piece.inventoryID}`)

  return [...footprint.endHexes, ...footprint.blockedHexes].flatMap((hex) =>
    [piece.altitude, piece.altitude + footprint.heightInLevels + 1].map(
      (altitude) => {
        const { x, y, z } = getBoardHex3DCoords({ ...hex, altitude })
        return new Vector3(x, y, z)
      },
    ),
  )
}

const zoomAndGetBounds = (
  boardPieces: BoardPiece[],
  targetUIDs: string[],
  boardHexes: BoardHexes = {},
) => {
  const controls = {
    fitToBox: vi.fn(),
    rotateTo: vi.fn(),
    setPosition: vi.fn(),
  }

  zoomToPieces({
    cameraControlsRef: {
      current: controls as unknown as CameraControls,
    } as RefObject<CameraControls>,
    boardHexes,
    boardPieces,
    targetUIDs,
    mapWidth: 10,
    mapLength: 10,
  })

  expect(controls.fitToBox).toHaveBeenCalledOnce()
  return controls.fitToBox.mock.calls[0][0] as Box3
}

describe('zoomToPieces', () => {
  it.each([
    makePiece('ruin-1', Pieces.laurWallRuin1, 0, 0),
    makePiece('ruin-2', Pieces.laurWallRuin2, 1, 0),
    makePiece('ruin-3', Pieces.laurWallRuin3, 2, 0),
    makePiece('short-wall', Pieces.laurWallShort, 0, 0),
    makePiece('long-wall', Pieces.laurWallLong, 0.5, 0),
  ])('frames boardPieces-only Laur piece $inventoryID', (piece) => {
    const bounds = zoomAndGetBounds([piece], [piece.uid])

    expect(bounds.isEmpty()).toBe(false)
    for (const point of getFootprintPoints(piece)) {
      expect(bounds.containsPoint(point)).toBe(true)
    }
  })

  it('frames all selected Laur walls in a multi-selection', () => {
    const selectedPieces = [
      makePiece('ruin', Pieces.laurWallRuin1, 0, -8),
      makePiece('short', Pieces.laurWallShort, 0, 0),
      makePiece('long', Pieces.laurWallLong, 0.5, 8),
    ]
    const regularPiece = makePiece('regular', 'grass1', 0, 20)
    const unselectedPiece = makePiece('unselected', Pieces.laurWallRuin2, 0, 40)
    const bounds = zoomAndGetBounds(
      [...selectedPieces, regularPiece, unselectedPiece],
      [...selectedPieces, regularPiece].map(({ uid }) => uid),
      {
        regular: {
          q: 20,
          r: 0,
          s: -20,
          id: 'regular',
          altitude: 2,
          pieceID: 'regular',
          boardPieceUID: 'regular',
          inventoryID: 'grass1',
          terrain: 'grass',
          pieceRotation: 0,
        },
      },
    )

    for (const piece of selectedPieces) {
      for (const point of getFootprintPoints(piece)) {
        expect(bounds.containsPoint(point)).toBe(true)
      }
    }

    const regularPoint = getBoardHex3DCoords({
      ...regularPiece.pieceCoords,
      altitude: regularPiece.altitude,
    })
    expect(
      bounds.containsPoint(
        new Vector3(regularPoint.x, regularPoint.y, regularPoint.z),
      ),
    ).toBe(true)

    const { x, y, z } = getBoardHex3DCoords({
      ...unselectedPiece.pieceCoords,
      altitude: unselectedPiece.altitude,
    })
    expect(bounds.containsPoint(new Vector3(x, y, z))).toBe(false)
  })
})
