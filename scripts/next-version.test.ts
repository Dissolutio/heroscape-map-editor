import { describe, expect, it } from 'vitest'
import { computeNextVersion } from './next-version.mjs'

describe('computeNextVersion', () => {
  it('uses a pushed version tag without a v prefix', () => {
    expect(
      computeNextVersion({
        ref: 'v2.4.6',
        isTag: true,
        tags: ['v2.4.5'],
      }),
    ).toEqual({ version: '2.4.6', skip: false })
  })

  it('bumps the patch from the highest version tag', () => {
    expect(
      computeNextVersion({
        ref: 'main',
        isTag: false,
        tags: ['v2.9.8', 'v10.0.1', 'v3.0.0'],
      }),
    ).toEqual({ version: '10.0.2', skip: false })
  })

  it('skips a main commit that already has a version tag', () => {
    expect(
      computeNextVersion({
        ref: 'main',
        isTag: false,
        tags: ['v1.5.2', 'v1.5.1'],
        headTags: ['v1.5.2'],
      }),
    ).toEqual({ version: '1.5.2', skip: true })
  })

  it('starts at 0.0.1 when the repository has no version tags', () => {
    expect(computeNextVersion({ ref: 'main', isTag: false, tags: [] })).toEqual(
      { version: '0.0.1', skip: false },
    )
  })
})
