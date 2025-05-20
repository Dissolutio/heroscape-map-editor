import { useEffect, useRef, useState } from 'react'
import useBoundStore from '../store/store'
import { getBoardHexObstacleOriginsAndHexesAndEmpties } from '../utils/board-utils'
import {
  SVG_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import { getBoardHexesSvgMapDimensions } from '../utils/map-utils'
import { SvgMapHex } from './SvgMapHex'
import { getHexagonSvgPolygonPointsAt00 } from './getHexagonSvgPolygonPoints'

const adjustXForNew00Centers = 1.2 * SVG_HEX_APOTHEM
const adjustYForNew00Centers = 1.2 * SVG_HEX_RADIUS

export const SvgMapDisplay = () => {
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const hexMap = useBoundStore((state) => state.hexMap)
  const mapDimensions = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesArr = Object.values(
    getBoardHexObstacleOriginsAndHexesAndEmpties(boardHexes),
  ).sort((a, b) => a.altitude - b.altitude)

  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState({
    x: adjustXForNew00Centers,
    y: adjustYForNew00Centers,
    width: mapDimensions.width + adjustXForNew00Centers,
    height: mapDimensions.length + adjustYForNew00Centers,
  })
  const viewboxStr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  const pointerOrigin = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)

  // Effect to update the viewBox when map dimensions change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setViewBox({
      x: adjustXForNew00Centers,
      y: adjustYForNew00Centers,
      width: getBoardHexesSvgMapDimensions(boardHexes).width + adjustXForNew00Centers,
      height: getBoardHexesSvgMapDimensions(boardHexes).length + adjustYForNew00Centers,
    })
  }, [boardHexes, hexMap.id])

  const onPointerDown = (event: React.PointerEvent) => {
    isPointerDown.current = true
    pointerOrigin.current = { x: event.clientX, y: event.clientY }
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!isPointerDown.current) return

    const svg = svgRef.current
    if (!svg) return
    event.preventDefault()
    const pointerPosition = { x: event.clientX, y: event.clientY }
    const dx = pointerPosition.x - pointerOrigin.current.x
    const dy = pointerPosition.y - pointerOrigin.current.y

    const ratio = viewBox.width / svg.getBoundingClientRect().width

    setViewBox((prev) => ({
      ...prev,
      x: prev.x - dx * ratio,
      y: prev.y - dy * ratio,
    }))

    pointerOrigin.current = pointerPosition
  }

  const onPointerUp = () => {
    isPointerDown.current = false
  }

  return (
    <svg
      role="img"
      ref={svgRef}
      viewBox={viewboxStr}
      style={{
        height: '99%',
        cursor: isPointerDown.current ? 'grabbing' : 'grab',
        overflow: 'scroll',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <title>2D Map Display</title>

      <filter id="constantOpacity">
        <feComponentTransfer>
          {/* This transfer function leaves all alpha values of the unfiltered
           graphics that are lower than .5 at their original values.
           All higher alpha above will be changed to .5.
           These calculations are derived from the values in
           the tableValues attribute using linear interpolation. */}
          <feFuncA type="table" tableValues="0 .5 .5" />
        </feComponentTransfer>
      </filter>
      <AxesHelper width={viewBox.width} length={viewBox.height} />
      <g
      //  filter="url(#constantOpacity)"
      >
        {boardHexesArr.map((hex) => (
          <SvgMapHex key={hex.id} hex={hex} />
        ))}
      </g>
    </svg>
  )
}

const AxesHelper = ({ width, length }: { width: number; length: number }) => {
  return (
    <>
      <line
        x1={-adjustXForNew00Centers}
        y1={-adjustYForNew00Centers}
        x2={-adjustXForNew00Centers}
        y2={length}
        stroke="red"
        strokeWidth={0.5}
      />
      <line
        x1={-adjustXForNew00Centers}
        y1={-adjustYForNew00Centers}
        x2={width}
        y2={-adjustYForNew00Centers}
        stroke="blue"
        strokeWidth={0.5}
      />
    </>
  )
}
