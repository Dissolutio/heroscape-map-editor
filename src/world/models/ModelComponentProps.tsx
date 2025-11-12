import type { BoardPiece } from '../../types'

export type ModelComponentProps = {
  color: string
  secondaryColor?: string
  highlightColor?: string
  boardPiece?: BoardPiece
  opacity?: number
  isHighlighted?: (uid: string) => boolean
  isLightsAndShadowsRender?: boolean
}
