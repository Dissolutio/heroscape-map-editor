import type { ThreeEvent } from '@react-three/fiber'
import type { BoardHex } from '../../types'

/**
 * Stand-in for EmptyHexes in tests that drive MapDisplay3D's click handler
 * (see clickHandler.ts). It must not import MapDisplay3D: it is loaded while
 * MapDisplay3D's imports are being mocked.
 */
export type Handler = (event: ThreeEvent<PointerEvent>, hex: BoardHex) => void
export type EmptyHexClickHandler = (event: ThreeEvent<MouseEvent>) => void

let captured: Handler | undefined
let capturedClick: EmptyHexClickHandler | undefined

export function CaptureHandler(props: {
  onPointerUp: Handler
  onClick?: EmptyHexClickHandler
}) {
  captured = props.onPointerUp
  capturedClick = props.onClick
  return null
}

/** The handler from the last render, cleared once taken. */
export function takeCapturedHandler() {
  const handler = captured
  captured = undefined
  return handler
}

export function takeCapturedClickHandler() {
  const handler = capturedClick
  capturedClick = undefined
  return handler
}
