import { computeNextVersion, gitTags, parseVersion } from './next-version.mjs'

export const LOCAL_RELEASE_VERSION = 'local-development'

/**
 * The release version a build reports (Sentry's `hexoscape@<version>`), from
 * the environment and the local git tags. Pure: env and tags in, version out.
 *
 * 1. `VITE_RELEASE_VERSION` when set: the desktop builds, from release.yml.
 * 2. On Netlify, the version release.yml computes for this commit, with
 *    computeNextVersion as its main() calls it. A `main` build gets the version
 *    the release workflow is publishing, whether its tag exists yet (HEAD has
 *    it) or not (the next patch).
 * 3. On Netlify without git or version tags (a shallow clone):
 *    `web-<short commit>` from COMMIT_REF.
 * 4. Otherwise `local-development`.
 *
 * `tags` and `headTags` are null when git could not list them.
 */
export function resolveReleaseVersion({ env, tags, headTags }) {
  if (env.VITE_RELEASE_VERSION) return env.VITE_RELEASE_VERSION
  if (env.NETLIFY !== 'true') return LOCAL_RELEASE_VERSION
  // With no version tags at all, computeNextVersion would say 0.0.1: the tags
  // were not fetched, so fall back rather than report a wrong version.
  if (tags?.some((tag) => parseVersion(tag)) && headTags) {
    // Netlify builds branches, never tags: the ref only matters for a tag
    return computeNextVersion({
      ref: env.BRANCH ?? '',
      isTag: false,
      tags,
      headTags,
    }).version
  }
  if (env.COMMIT_REF) return `web-${env.COMMIT_REF.slice(0, 7)}`
  return LOCAL_RELEASE_VERSION
}

/** Lists git tags the way next-version.mjs main() does, or null on failure. */
const tryGitTags = (args) => {
  try {
    return gitTags(args)
  } catch {
    return null
  }
}

/**
 * resolveReleaseVersion for this build. Only reads git on Netlify (and only
 * when the version isn't given), and never throws: a build never fails over
 * its version.
 */
export function getBuildReleaseVersion(env = process.env) {
  try {
    const needsGit = !env.VITE_RELEASE_VERSION && env.NETLIFY === 'true'
    return resolveReleaseVersion({
      env,
      tags: needsGit ? tryGitTags(['--list', 'v*']) : null,
      headTags: needsGit ? tryGitTags(['--points-at', 'HEAD']) : null,
    })
  } catch {
    return env.VITE_RELEASE_VERSION || LOCAL_RELEASE_VERSION
  }
}
