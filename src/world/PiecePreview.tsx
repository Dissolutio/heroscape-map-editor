import React, { Suspense } from 'react'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { HEXGRID_HEX_HEIGHT } from '../utils/constants'
import { Pieces } from '../types'
import LaurWallPillar from './models/LaurPillar'
// Import your 3D piece models here, e.g. LandSubterrain, Ruins2, etc.

export default function PiecePreview() {
  const hoveredHex = useBoundStore((s) => s.hoveredHex)
  const penMode = useBoundStore((s) => s.penMode)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)

  // Only show preview if hovering a valid hex and penMode is not 'select'
  if (!hoveredHex || penMode === 'select' || hoveredHex.altitude > viewingLevel) {
    return null
  }

  // Determine the piece to preview based on penMode and pieceSize
  const pieceKey = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
  const piece = piecesSoFar[pieceKey]
  if (!piece) return null

  // Get 3D position for the hovered hex
  const { x, y, z } = getBoardHex3DCoords(hoveredHex)

  // Choose the correct model/component for the piece
  // Example for a land tile:
  // You may need a switch/case or mapping for different piece types
  return (
    <Suspense fallback={null}>
      <group
        position={[x, y, z]}
        rotation={[0, (hoveredHex.pieceRotation * -Math.PI) / 3, 0]}
      // Slightly raise the preview above the hex for clarity
      >
        {/* Example: */}
        <LaurWallPillar boardHex={hoveredHex} isUnderHexFluid={false} isPreview />
        {/* Replace with the correct model/component for the piece */}
      </group>
    </Suspense>
  )
}