import { describe, expect, it } from 'vitest'
import { isLookSettingsAvailable } from '../layout/lookSettingsVisibility'

describe('Look settings visibility', () => {
  it('is available when either selected or effective tier is Medium/High', () => {
    expect(isLookSettingsAvailable('low', 'low')).toBe(false)
    expect(isLookSettingsAvailable('medium', 'low')).toBe(true)
    expect(isLookSettingsAvailable('low', 'high')).toBe(true)
    expect(isLookSettingsAvailable('high', 'high')).toBe(true)
  })
})
