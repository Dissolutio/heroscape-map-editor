import { useEffect, useRef, useState } from 'react'
import useBoundStore from '../store/store'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import {
  decodePieceID,
  getBoardHexesSvgMapDimensions,
} from '../utils/map-utils'
import { SvgMapHex } from './SvgMapHex'
import { SvgMapBoardPiece } from './SvgMapBoardPiece'

const adjustXForNew00Centers = -1 * SVG_HEX_APOTHEM
const adjustYForNew00Centers = -1 * SVG_HEX_RADIUS

export const SvgMapDisplay = () => {
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const decodedBoardPiecesArr = Object.keys(boardPieces)
    .map((id) => decodePieceID(id))
    .filter((p) => Boolean(p))
  const hexMap = useBoundStore((state) => state.hexMap)
  const mapDimensions = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesArr = Object.values(boardHexes)
    // sort by altitude, so pieces don't get painted over higher altitude shapes (easy to see with Ruins 2/3 and adjacent 1-hex land)
    .sort((a, b) => a.altitude - b.altitude)

  const [viewBox, setViewBox] = useState({
    x: adjustXForNew00Centers,
    y: adjustYForNew00Centers,
    width: mapDimensions.width,
    height: mapDimensions.length - adjustYForNew00Centers,
  })
  const viewboxStr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  const isPointerDown = useRef(false)

  // Effect to update the viewBox when map dimensions change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setViewBox({
      x: adjustXForNew00Centers,
      y: adjustYForNew00Centers,
      width: getBoardHexesSvgMapDimensions(boardHexes).width,
      height: getBoardHexesSvgMapDimensions(boardHexes).length,
    })
  }, [boardHexes, hexMap.id])

  return (
    <svg
      role="img"
      // ref={svgRef}
      viewBox={viewboxStr}
      style={{
        // height: '99%',
        maxHeight: '99%',
        width: '100%',
        overflow: 'auto',
      }}
    >
      <title>2D Map Display</title>

      <AxesHelper width={viewBox.width} length={viewBox.height} />
      <g>
        {boardHexesArr.map((hex) => (
          <SvgMapHex key={hex.id} hex={hex} />
        ))}
        {decodedBoardPiecesArr
          .filter((bp) => bp.altitude <= viewingLevel)
          .sort((a, b) => a.altitude - b.altitude)
          .map((bp) => (
            <SvgMapBoardPiece
              key={bp.boardPieceID}
              piece={bp}
              viewingLevel={viewingLevel}
            />
          ))}
      </g>
    </svg>
  )
}

const AxesHelper = ({ width, length }: { width: number; length: number }) => {
  return (
    <>
      <line
        x1={adjustXForNew00Centers}
        y1={adjustYForNew00Centers}
        x2={adjustXForNew00Centers}
        y2={length}
        stroke="red"
        strokeWidth={0.5}
      />
      <line
        x1={adjustXForNew00Centers}
        y1={adjustYForNew00Centers}
        x2={width}
        y2={adjustYForNew00Centers}
        stroke="blue"
        strokeWidth={0.5}
      />
    </>
  )
}
