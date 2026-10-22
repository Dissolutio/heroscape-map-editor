import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const parseVersion = (tag) => {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag)
  return match
    ? {
        tag,
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
      }
    : null
}

const compareVersions = (a, b) =>
  b.major - a.major || b.minor - a.minor || b.patch - a.patch

const highestVersionTag = (tags) =>
  tags.map(parseVersion).filter(Boolean).sort(compareVersions)[0]

export function computeNextVersion({ ref, isTag, tags, headTags = [] }) {
  if (isTag) {
    return { version: ref.replace(/^v/, ''), skip: false }
  }

  const headVersion = highestVersionTag(headTags)
  if (headTags.some((tag) => tag.startsWith('v'))) {
    const latest = headVersion ?? highestVersionTag(tags)
    return { version: latest?.tag.replace(/^v/, '') ?? '0.0.0', skip: true }
  }

  const latest = highestVersionTag(tags)
  const next = latest
    ? `${latest.major}.${latest.minor}.${latest.patch + 1}`
    : '0.0.1'
  return { version: next, skip: false }
}

function gitTags(args) {
  return execFileSync('git', ['tag', ...args], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
}

function main() {
  const result = computeNextVersion({
    ref: process.env.GITHUB_REF_NAME ?? '',
    isTag: process.env.GITHUB_REF_TYPE === 'tag',
    tags: gitTags(['--list', 'v*']),
    headTags: gitTags(['--points-at', 'HEAD']),
  })

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${result.version}\nskip=${result.skip}\n`,
    )
  } else {
    process.stdout.write(`${JSON.stringify(result)}\n`)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
}
