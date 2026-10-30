import { Card, CardContent } from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import type { RefObject } from 'react'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import useBoundStore from '../store/store'
import ObjectiveMarkerControls from './ObjectiveMarkerControls'
import { SelectedPieceControls } from './SelectedPieceControls'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const EMPTY_OBJECTIVE_MARKERS: ObjectiveMarker[] = []

const SelectedPieceReadout = ({
  cameraControlsRef,
}: {
  cameraControlsRef: RefObject<CameraControls>
}) => {
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const selectedObjectiveMarkerUID = useBoundStore(
    (s) => s.selectedObjectiveMarkerUID,
  )
  const objectiveMarkers = useBoundStore(
    (s) => s.hexMap.objectiveMarkers ?? EMPTY_OBJECTIVE_MARKERS,
  )
  const { isSmallScreenWidth } = useMuiMediaQuery()
  const selectedObjectiveMarker = objectiveMarkers.find(
    (marker) => marker.uid === selectedObjectiveMarkerUID,
  )

  if (selectedObjectiveMarker) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          padding: isSmallScreenWidth ? 4 : 10,
          margin: isSmallScreenWidth ? 4 : 10,
          width: 'min(320px, calc(100vw - 24px))',
          maxHeight: '80%',
          overflowY: 'auto',
        }}
      >
        <ObjectiveMarkerControls
          key={selectedObjectiveMarker.uid}
          marker={selectedObjectiveMarker}
        />
      </div>
    )
  }

  if (!selectedPieceIDs.length) return null
  const firstBp = boardPieces.find((bp) => selectedPieceIDs.includes(bp.uid))
  if (!firstBp) return null

  const cardWidth = isSmallScreenWidth ? 160 : 185

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: isSmallScreenWidth ? 4 : 10,
        margin: isSmallScreenWidth ? 4 : 10,
      }}
    >
      <Card sx={{ width: cardWidth, p: 0 }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <SelectedPieceControls cameraControlsRef={cameraControlsRef} />
        </CardContent>
      </Card>
    </div>
  )
}

export default SelectedPieceReadout
