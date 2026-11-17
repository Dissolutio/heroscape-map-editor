import { describe, expect, it } from 'vitest'
import {
  getBuildReleaseVersion,
  resolveReleaseVersion,
} from './release-version.mjs'

const NETLIFY = {
  NETLIFY: 'true',
  CONTEXT: 'production',
  BRANCH: 'main',
  COMMIT_REF: '0123456789abcdef0123456789abcdef01234567',
}
const TAGS = ['v1.5.1', 'v1.5.2', 'v1.4.9']

describe('resolveReleaseVersion', () => {
  it('uses VITE_RELEASE_VERSION when it is set (the desktop builds)', () => {
    expect(
      resolveReleaseVersion({
        env: { ...NETLIFY, VITE_RELEASE_VERSION: '2.0.0' },
        tags: TAGS,
        headTags: [],
      }),
    ).toBe('2.0.0')
  })

  it('on Netlify, a main commit before its tag exists gets the next patch, as release.yml computes', () => {
    expect(
      resolveReleaseVersion({ env: NETLIFY, tags: TAGS, headTags: [] }),
    ).toBe('1.5.3')
  })

  it('on Netlify, a main commit that already has its tag gets that version', () => {
    expect(
      resolveReleaseVersion({
        env: NETLIFY,
        tags: [...TAGS, 'v1.5.3'],
        headTags: ['v1.5.3'],
      }),
    ).toBe('1.5.3')
  })

  it('on Netlify without git, falls back to web-<short commit>', () => {
    expect(
      resolveReleaseVersion({ env: NETLIFY, tags: null, headTags: null }),
    ).toBe('web-0123456')
  })

  it('on Netlify with no version tags (a shallow clone), falls back to web-<short commit>, not 0.0.1', () => {
    expect(
      resolveReleaseVersion({ env: NETLIFY, tags: [], headTags: [] }),
    ).toBe('web-0123456')
  })

  it('on Netlify with neither tags nor a commit, is local-development', () => {
    expect(
      resolveReleaseVersion({
        env: { NETLIFY: 'true' },
        tags: null,
        headTags: null,
      }),
    ).toBe('local-development')
  })

  it('on a Netlify branch or preview deploy, is web-<short commit>, never a release number', () => {
    for (const CONTEXT of ['branch-deploy', 'deploy-preview']) {
      expect(
        resolveReleaseVersion({
          env: { ...NETLIFY, CONTEXT, BRANCH: 'dev' },
          tags: TAGS,
          headTags: [],
        }),
      ).toBe('web-0123456')
    }
  })

  it('off Netlify, with no version given, is local-development', () => {
    expect(
      resolveReleaseVersion({ env: {}, tags: TAGS, headTags: ['v1.5.2'] }),
    ).toBe('local-development')
  })
})

describe('getBuildReleaseVersion', () => {
  it('never throws, and reads no git off Netlify', () => {
    expect(getBuildReleaseVersion({})).toBe('local-development')
    expect(getBuildReleaseVersion({ VITE_RELEASE_VERSION: '3.1.4' })).toBe(
      '3.1.4',
    )
  })
})
