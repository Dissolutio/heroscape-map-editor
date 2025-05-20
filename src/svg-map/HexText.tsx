import type * as React from 'react'
import { SVG_HEX_RADIUS } from '../utils/constants'

export type Props = {
  children: string | React.ReactNode | React.ReactNode[]
  x?: string | number
  y?: string | number
  className?: string
  style?: React.CSSProperties
} & React.SVGProps<SVGTextElement>

export function HexText(props: Props) {
  const { children, x, y, className } = props
  return (
    <text
      style={{
        fontSize: `${SVG_HEX_RADIUS / 75}rem`,
      }}
      x={x !== undefined ? x : 0}
      y={y !== undefined ? y : '0.3em'}
      textAnchor="middle"
      className={className}
    >
      {children}
    </text>
  )
}
