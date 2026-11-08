import { createStore } from 'zustand/vanilla'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canDragObjectiveMarker,
  canSelectObjectiveMarker,
  filterVisibleObjectiveMarkerUIDs,
  shouldRenderObjectiveMarker,
} from '../data/objectiveMarkerVisibility'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import { resolveSelectionUnit } from '../data/selectionUnits'
import { SETTINGS_KEYS } from '../local-storage/settings'
import createActionLogSlice from '../store/action-log-slice'
import createMapSlice from '../store/map-slice'
import createUISlice from '../store/ui-slice'
import type { AppState } from '../store/store'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const marker: ObjectiveMarker = {
  uid: 'marker',
  anchor: { q: 0, r: 0, s: 0, altitude: 0 },
  size: 1,
  rotation: 0,
  style: 'black',
  content: { kind: 'number', value: 1 },
}

function createTestStore() {
  return createStore<AppState>()((...args) => ({
    ...createMapSlice(...args),
    ...createUISlice(...args),
    ...createActionLogSlice(...args),
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('objective marker visibility', () => {
  it('does not render, select, or drag hidden markers', () => {
    expect(shouldRenderObjectiveMarker(false)).toBe(false)
    expect(canSelectObjectiveMarker(marker.uid, [marker], false)).toBe(false)
    expect(
      canDragObjectiveMarker(marker.uid, marker.uid, [marker], false),
    ).toBe(false)
    expect(canDragObjectiveMarker(marker.uid, null, [marker], true)).toBe(false)
    expect(canDragObjectiveMarker(marker.uid, marker.uid, [marker], true)).toBe(
      true,
    )
  })

  it('filters hidden markers from selection recall without changing saved IDs', () => {
    const selection = {
      pieceUIDs: [],
      objectiveMarkerUID: marker.uid,
    }
    const visibleUIDs = filterVisibleObjectiveMarkerUIDs(
      [marker.uid],
      [marker],
      false,
    )

    expect(visibleUIDs).toEqual([])
    expect(
      resolveSelectionUnit(
        selection,
        new Set(),
        new Set(),
        new Set(visibleUIDs),
      ),
    ).toBeUndefined()
    expect(selection.objectiveMarkerUID).toBe(marker.uid)
  })

  it('defaults to shown, is not persisted, and survives a settings reset', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    })
    const store = createTestStore()

    expect(store.getState().isShowObjectiveMarkers).toBe(true)
    expect(SETTINGS_KEYS).not.toContain('isShowObjectiveMarkers')
    store.getState().toggleIsShowObjectiveMarkers(false)
    store.getState().resetSettings()

    expect(store.getState().isShowObjectiveMarkers).toBe(false)
  })

  it('refuses selecting hidden or unknown objective markers', () => {
    const store = createTestStore()
    store.setState({
      hexMap: {
        ...store.getState().hexMap,
        objectiveMarkers: [marker],
      },
    })

    store.getState().setSelectedObjectiveMarkerUID(marker.uid)
    expect(store.getState().selectedObjectiveMarkerUID).toBe(marker.uid)
    store.getState().setObjectiveMarkerDragPreview({
      marker,
      status: 'ok',
    })
    store.getState().toggleIsShowObjectiveMarkers(false)
    expect(store.getState().selectedObjectiveMarkerUID).toBeNull()
    expect(store.getState().objectiveMarkerDragPreview).toBeNull()
    store.getState().setSelectedObjectiveMarkerUID(marker.uid)
    expect(store.getState().selectedObjectiveMarkerUID).toBeNull()

    store.getState().toggleIsShowObjectiveMarkers(true)
    store.getState().setSelectedObjectiveMarkerUID(marker.uid)
    expect(store.getState().selectedObjectiveMarkerUID).toBe(marker.uid)
    store.getState().setSelectedObjectiveMarkerUID('unknown')
    expect(store.getState().selectedObjectiveMarkerUID).toBe(marker.uid)
    store.getState().toggleIsShowObjectiveMarkers(false)
    store.getState().selectSelectionUnit({
      pieceUIDs: [],
      objectiveMarkerUID: marker.uid,
    })
    expect(store.getState().selectedObjectiveMarkerUID).toBeNull()
  })
})
