import type { BoardPiece } from '../../types'

export type ModelComponentProps = {
  color: string
  highlightColor?: string
  boardPiece?: BoardPiece
  opacity?: number
  isHighlighted?: (uid: string) => boolean
  isLightsAndShadowsRender?: boolean
  // anything with 2+ colors
  secondaryColor?: string
  // tree colors
  colorBase?: string
  // jungle colors
  colorTrunk?: string
  colorRoundCactus?: string
  colorTriCactus?: string
  colorTriLeaf?: string
  colorNeedleFern?: string
  colorPineappleFern?: string
  // marvel warehouse
  showUpperFloor?: boolean
  showWallIntact?: boolean
}
