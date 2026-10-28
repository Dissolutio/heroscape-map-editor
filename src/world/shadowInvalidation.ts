export type ShadowRelevantState = {
  boardHexes: unknown
  boardPieces: unknown
  hexMap: unknown
  lightPositions: unknown
  viewingLevel: number
  isLightsAndShadowsRender: boolean
  graphicsTier: string
  effectiveGraphicsTier: string
  isShowStartZones: boolean
}

export function shouldInvalidateShadowMap(
  previous: ShadowRelevantState,
  current: ShadowRelevantState,
) {
  return (
    previous.boardHexes !== current.boardHexes ||
    previous.boardPieces !== current.boardPieces ||
    previous.hexMap !== current.hexMap ||
    previous.lightPositions !== current.lightPositions ||
    previous.viewingLevel !== current.viewingLevel ||
    previous.isLightsAndShadowsRender !== current.isLightsAndShadowsRender ||
    previous.graphicsTier !== current.graphicsTier ||
    previous.effectiveGraphicsTier !== current.effectiveGraphicsTier ||
    previous.isShowStartZones !== current.isShowStartZones
  )
}

export function invalidateShadowMap(shadowMap: { needsUpdate: boolean }) {
  shadowMap.needsUpdate = true
}
