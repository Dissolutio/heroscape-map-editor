// Unit data: heroscape.org public API
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_URL = 'https://heroscape.org/api/v1/games/heroscape/units/'
const SNAPSHOT_URL = new URL(
  '../src/data/units/heroscapeOrgUnits.json',
  import.meta.url,
)
const NAMES_URL = new URL(
  '../src/data/units/objectiveMarkerUnitNames.json',
  import.meta.url,
)
const RULES_URL = new URL('../src/data/units/unitNameRules.ts', import.meta.url)

function readRulesFromTypeScript(source) {
  const rules = {}
  const tableMatch = source.match(
    /export const UNIT_NAME_RULES:[^=]*=\s*\{([\s\S]*?)\n\}/u,
  )
  if (!tableMatch) throw new Error('Could not find UNIT_NAME_RULES')
  for (const match of tableMatch[1].matchAll(
    /^\s*'([^']+)':\s*'([^']*)',?$/gmu,
  )) {
    rules[match[1]] = match[2]
  }
  return rules
}

function readCliArgument(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function sortedUniqueNames(units, official) {
  return [
    ...new Set(
      units
        .filter((unit) => unit.official === official)
        .map((unit) => unit.name),
    ),
  ].sort((first, second) =>
    first.localeCompare(second, 'en', { sensitivity: 'base' }),
  )
}

export function buildNamesJson(units) {
  return {
    official: sortedUniqueNames(units, true),
    vc: sortedUniqueNames(units, false),
  }
}

export function buildSnapshot(source, rules) {
  const officialGroups = new Set([
    'Hasbro',
    'Renegade',
    'Marvel',
    'GI Joe',
    'ScapeCon',
    'Prerelease',
  ])
  const vcGroups = new Set(['C3V', 'SoV'])
  const results = Array.isArray(source) ? source : source.results
  if (!Array.isArray(results)) throw new Error('Invalid units API response')

  const units = results.map((unit) => {
    if (Array.isArray(unit) || !unit.slug) {
      throw new Error('Invalid unit in source')
    }
    const group = unit.unit_group ?? unit.group
    const official =
      typeof unit.official === 'boolean'
        ? unit.official
        : officialGroups.has(group)
    if (!official && !vcGroups.has(group)) {
      throw new Error(`Unknown unit_group: ${group ?? '(missing)'}`)
    }
    const apiName = unit.apiName ?? unit.name
    const name = official && rules[unit.slug] ? rules[unit.slug] : apiName
    const attributes = unit.attributes ?? {}
    return {
      slug: unit.slug,
      apiName,
      name,
      group,
      official,
      sets: (unit.release_sets ?? unit.sets ?? []).map((set) => ({
        name: set.name,
        date: set.date,
      })),
      figures: unit.figures ?? attributes['# Figures'] ?? null,
      hexes: unit.hexes ?? attributes['# Hexes'] ?? null,
      rarity: unit.rarity ?? attributes.Rarity ?? null,
      type: unit.type ?? attributes.Type ?? null,
      size: unit.size ?? attributes.Size ?? null,
      height: unit.height ?? attributes.Height ?? null,
    }
  })

  units.sort((first, second) => first.slug.localeCompare(second.slug))

  for (const [slug, expectedName] of Object.entries(rules)) {
    const unit = units.find((candidate) => candidate.slug === slug)
    if (unit && (unit.name !== expectedName || !unit.official)) {
      throw new Error(
        `Name rule ${slug} does not map to an exact official name: ${expectedName}`,
      )
    }
  }

  for (const unit of units) {
    if (!unit.official) continue
    if (/\(\d+\.\d+\)\s*$/.test(unit.name) && !rules[unit.slug]) {
      throw new Error(
        `Official unit ${unit.slug} needs a name rule: ${unit.name}`,
      )
    }
  }

  const officialNames = new Map()
  for (const unit of units.filter((candidate) => candidate.official)) {
    const matches = officialNames.get(unit.name) ?? []
    matches.push(unit.slug)
    officialNames.set(unit.name, matches)
  }
  for (const [displayName, slugs] of officialNames) {
    if (slugs.length > 1 && slugs.some((slug) => !rules[slug])) {
      throw new Error(
        `Official units share display name ${displayName}: ${slugs.join(', ')}`,
      )
    }
  }

  return units
}

async function main() {
  const from = readCliArgument('--from')
  let source
  if (from) {
    source = JSON.parse(await readFile(from, 'utf8'))
  } else {
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`heroscape.org API returned ${response.status}`)
    }
    source = await response.json()
  }

  const ruleSource = await readFile(fileURLToPath(RULES_URL), 'utf8')
  const rules = readRulesFromTypeScript(ruleSource)
  const apiSlugSet = Array.isArray(source)
    ? new Set(source.map((unit) => unit.slug))
    : new Set((source.results ?? []).map((unit) => unit.slug))
  for (const slug of Object.keys(rules)) {
    if (!apiSlugSet.has(slug)) {
      console.warn(`Warning: name-rule slug is no longer in the API: ${slug}`)
    }
  }

  const units = buildSnapshot(source, rules)
  const names = buildNamesJson(units)
  await writeFile(SNAPSHOT_URL, `${JSON.stringify(units, null, 2)}\n`)
  await writeFile(NAMES_URL, `${JSON.stringify(names, null, 2)}\n`)

  const officialCount = units.filter((unit) => unit.official).length
  const vcCount = units.length - officialCount
  const renamedCount = units.filter((unit) => unit.name !== unit.apiName).length
  const sourceLabel = from ? basename(from) : 'heroscape.org API'
  console.log(
    `Units: ${units.length}; official: ${officialCount}; VC: ${vcCount}; renamed: ${renamedCount}; source: ${sourceLabel}`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
