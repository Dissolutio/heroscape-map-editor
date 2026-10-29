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

export type ShadowUpdateWindow = {
  framesRemaining: number
}

export const SHADOW_SETTLE_FRAMES = 3
export const MODEL_MOUNTED_EVENT = 'hexoscape-model-mounted'

export function notifyModelMounted(target: EventTarget) {
  target.dispatchEvent(new Event(MODEL_MOUNTED_EVENT))
}

export function subscribeToModelMounts(
  target: EventTarget,
  onMount: () => void,
) {
  const listener = () => onMount()
  target.addEventListener(MODEL_MOUNTED_EVENT, listener)
  return () => target.removeEventListener(MODEL_MOUNTED_EVENT, listener)
}

export function shouldInvalidateShadowMap(
  previous: ShadowRelevantState,
  current: ShadowRelevantState,
) {
  return (
    previous.boardHexes !== current.boardHexes ||
    previous.boardPieces !== current.boardPieces ||
    (previous.hexMap !== current.hexMap &&
      !hasOnlyObjectiveMarkerChanges(previous.hexMap, current.hexMap)) ||
    previous.lightPositions !== current.lightPositions ||
    previous.viewingLevel !== current.viewingLevel ||
    previous.isLightsAndShadowsRender !== current.isLightsAndShadowsRender ||
    previous.graphicsTier !== current.graphicsTier ||
    previous.effectiveGraphicsTier !== current.effectiveGraphicsTier ||
    previous.isShowStartZones !== current.isShowStartZones
  )
}

function hasOnlyObjectiveMarkerChanges(previous: unknown, current: unknown) {
  if (
    typeof previous !== 'object' ||
    previous === null ||
    typeof current !== 'object' ||
    current === null
  ) {
    return false
  }
  const before = previous as Record<string, unknown>
  const after = current as Record<string, unknown>
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  if (!keys.has('objectiveMarkers')) return false
  return [...keys]
    .filter((key) => key !== 'objectiveMarkers')
    .every((key) => before[key] === after[key])
}

export function invalidateShadowMap(shadowMap: { needsUpdate: boolean }) {
  shadowMap.needsUpdate = true
}

export function requestShadowUpdate(
  shadowMap: { needsUpdate: boolean },
  window: ShadowUpdateWindow,
) {
  window.framesRemaining = SHADOW_SETTLE_FRAMES
  invalidateShadowMap(shadowMap)
}

export function updateShadowSettleWindow(
  shadowMap: { needsUpdate: boolean },
  window: ShadowUpdateWindow,
  hasPendingLoads: boolean,
) {
  if (hasPendingLoads) {
    window.framesRemaining = SHADOW_SETTLE_FRAMES
  }
  if (window.framesRemaining === 0) return
  invalidateShadowMap(shadowMap)
  window.framesRemaining -= 1
}
