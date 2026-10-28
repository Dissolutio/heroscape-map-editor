import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const e2eRoot = resolve(process.cwd(), 'e2e')
const evidencePath = /docs[\\/]+evidence/

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(?:[cm]?[jt]sx?)$/.test(entry.name) ? [path] : []
  })
}

describe('E2E evidence screenshots', () => {
  it('keeps docs/evidence writes inside the opt-in helper', () => {
    const references = sourceFiles(e2eRoot)
      .filter((path) => evidencePath.test(readFileSync(path, 'utf8')))
      .map((path) => relative(e2eRoot, path))

    expect(references).toEqual(['fixtures.ts'])
    expect(readFileSync(resolve(e2eRoot, 'fixtures.ts'), 'utf8')).toMatch(
      /process\.env\.E2E_EVIDENCE !== ['"]1['"]/,
    )
  })
})
