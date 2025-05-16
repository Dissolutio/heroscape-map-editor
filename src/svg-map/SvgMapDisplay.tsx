import { useEffect, useRef, useState } from 'react'
import useBoundStore from '../store/store'
import { getBoardHexObstacleOriginsAndHexesAndEmpties } from '../utils/board-utils'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { getBoardHexesSvgMapDimensions } from '../utils/map-utils'
import { SvgMapHex } from './SvgMapHex'
import { getHexagonSvgPolygonPoints } from './getHexagonSvgPolygonPoints'
import { SvgInterlockClipPaths } from './svg-hex-interlock-clippath'

export const SvgMapDisplay = () => {
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const { points } = getHexagonSvgPolygonPoints(SVG_HEX_RADIUS)
  const mapDimensions = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesArr = Object.values(
    getBoardHexObstacleOriginsAndHexesAndEmpties(boardHexes),
  ).sort((a, b) => a.altitude - b.altitude)

  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: mapDimensions.width,
    height: mapDimensions.length,
  })
  const viewboxStr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  const pointerOrigin = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)

  // Effect to update the viewBox when map dimensions change
  useEffect(() => {
    setViewBox({
      x: 0,
      y: 0,
      width: getBoardHexesSvgMapDimensions(boardHexes).width,
      height: getBoardHexesSvgMapDimensions(boardHexes).length,
    })
  }, [boardHexes])

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
      <SvgInterlockClipPaths points={points} />
      <g filter="url(#constantOpacity)">
        {boardHexesArr.map((hex) => (
          <SvgMapHex key={hex.id} hex={hex} />
        ))}
      </g>
    </svg>
  )
}

const AxesHelper = () => {
  ;<>
    <line
      x1={0}
      y1={0}
      x2={0}
      y2={mapDimensions.length}
      stroke="red"
      strokeWidth={0.5}
    />
    <line
      x1={0}
      y1={0}
      x2={mapDimensions.width}
      y2={0}
      stroke="blue"
      strokeWidth={0.5}
    />
  </>
}
