import { describe, expect, it } from 'vitest'
import {
  LOOK_SETTINGS_CONTROL_IDS,
  LOOK_SETTINGS_TOOLTIP_COPY,
} from '../layout/lookSettingsTooltipCopy'

describe('3D look settings tooltip copy', () => {
  it('has non-empty copy for every dialog control and no unused entries', () => {
    expect(Object.keys(LOOK_SETTINGS_TOOLTIP_COPY).sort()).toEqual(
      [...LOOK_SETTINGS_CONTROL_IDS].sort(),
    )

    for (const id of LOOK_SETTINGS_CONTROL_IDS) {
      expect(LOOK_SETTINGS_TOOLTIP_COPY[id].trim(), id).not.toBe('')
    }
  })
})
