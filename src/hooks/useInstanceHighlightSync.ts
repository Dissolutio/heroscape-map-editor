import React from 'react'
import useBoundStore from '../store/store'

type ColorLike = { set: (color: string) => void }

// What every per-instance highlight target looks like (a drei Instance's PositionMesh proxy).
// `userData.displayColor` is the color to show when neither hovered nor selected;
// `userData.baseColor` is the terrain color to fall back to when selection is cleared.
export type HighlightableInstance = {
  color: ColorLike
  userData: { displayColor?: string; baseColor?: string }
}

type HighlightRegistry = Map<string, Set<HighlightableInstance>>

/**
 * Creates a uid -> instance-set registry shared by a batch of `<Instance>`s under one parent
 * `<Instances>`. Populated by `useRegisterHighlightInstance` and consumed by
 * `useInstanceHighlightSync`, so hover/selection highlighting can be pushed imperatively to
 * just the affected instance(s) instead of every instance subscribing to the store directly.
 */
export function useInstanceHighlightRegistry() {
  return React.useRef<HighlightRegistry>(new Map())
}

// Registers one instance's ref under `uid` for the lifetime of the component, so the parent's
// highlight sync can look it up in O(1). A uid can map to multiple instances (e.g. a multi-hex
// piece), all of which get highlighted together.
export function useRegisterHighlightInstance(
  registryRef: React.RefObject<HighlightRegistry>,
  uid: string | undefined,
  ref: React.RefObject<HighlightableInstance | null>,
) {
  React.useEffect(() => {
    const registry = registryRef.current
    const instance = ref.current
    if (!uid || !instance || !registry) return
    let instances = registry.get(uid)
    if (!instances) {
      instances = new Set()
      registry.set(uid, instances)
    }
    instances.add(instance)
    return () => {
      instances?.delete(instance)
      if (instances?.size === 0) registry.delete(uid)
    }
  }, [registryRef, uid, ref])
}

// Module-level (not per-component) registry of subterrain instances keyed by piece uid.
// `LandSubterrainInstanced` registers its instances here (in addition to its own per-size-group
// registry) so that `SolidCaps`/`FluidCaps` can reach in and highlight/restore the underlying
// subterrain the instant one of its caps is hovered/unhovered -- a cap and its subterrain share
// one boardPieceUID, but live under different `<Instances>` parents, so this can't go through
// `useInstanceHighlightRegistry` (which is scoped to one parent's own batch). Doing this
// directly, instead of via the debounced `hoveredPieceID` store round-trip, keeps it in sync
// with the cap's own immediate (non-debounced) color change and avoids highlighting every
// sibling cap of a multi-hex piece just because one of them (or the subterrain) is hovered.
const pieceSubterrainRegistry: HighlightRegistry = new Map()
export const pieceSubterrainRegistryRef: React.RefObject<HighlightRegistry> = {
  current: pieceSubterrainRegistry,
}

// Called by SolidCaps/FluidCaps' pointer handlers to highlight (or restore) the subterrain
// belonging to whichever cap the pointer just entered/left.
export function setPieceSubterrainHovered(
  uid: string | undefined,
  hovered: boolean,
) {
  if (!uid) return
  const instances = pieceSubterrainRegistry.get(uid)
  if (!instances) return
  for (const instance of instances) {
    if (hovered) {
      instance.color.set('yellow')
    } else if (instance.userData.displayColor) {
      instance.color.set(instance.userData.displayColor)
    }
  }
}

/**
 * Subscribes ONCE per instance batch (not per-instance) to hoveredPieceID and, optionally,
 * selectedPieceIDs changes, and imperatively repaints only the specific instance(s) whose
 * highlight actually changed by looking them up in `registryRef`. This replaces every
 * individual `<Instance>` subscribing to hoveredPieceID/selectedPieceIDs directly, which
 * caused every instance across the whole board to re-render on any hover/selection change
 * anywhere on the map.
 */
export function useInstanceHighlightSync(
  registryRef: React.RefObject<HighlightRegistry>,
  trackSelection = false,
) {
  React.useEffect(() => {
    const registry = registryRef.current
    if (!registry) return

    const restoreRestColor = (uid: string) => {
      for (const instance of registry.get(uid) ?? []) {
        if (instance.userData.displayColor) {
          instance.color.set(instance.userData.displayColor)
        }
      }
    }
    const applyHoverColor = (uid: string) => {
      for (const instance of registry.get(uid) ?? []) {
        instance.color.set('yellow')
      }
    }

    return useBoundStore.subscribe((state, prevState) => {
      if (state.hoveredPieceID !== prevState.hoveredPieceID) {
        if (prevState.hoveredPieceID) restoreRestColor(prevState.hoveredPieceID)
        if (state.hoveredPieceID) applyHoverColor(state.hoveredPieceID)
      }

      if (
        !trackSelection ||
        state.selectedPieceIDs === prevState.selectedPieceIDs
      ) {
        return
      }
      const prevSelected = new Set(prevState.selectedPieceIDs)
      const nextSelected = new Set(state.selectedPieceIDs)
      const changedUIDs = new Set<string>()
      for (const uid of prevSelected) {
        if (!nextSelected.has(uid)) changedUIDs.add(uid)
      }
      for (const uid of nextSelected) {
        if (!prevSelected.has(uid)) changedUIDs.add(uid)
      }

      for (const uid of changedUIDs) {
        const instances = registry.get(uid)
        if (!instances) continue
        const isSelected = nextSelected.has(uid)
        for (const instance of instances) {
          const displayColor = isSelected
            ? 'yellow'
            : (instance.userData.baseColor ?? instance.userData.displayColor)
          if (!displayColor) continue
          instance.userData.displayColor = displayColor
          if (state.hoveredPieceID !== uid) {
            instance.color.set(displayColor)
          }
        }
      }
    })
  }, [registryRef, trackSelection])
}
