import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

const sourceDirectory = resolve(process.cwd(), 'src')
const publicDirectory = resolve(process.cwd(), 'public')
const glbPathPattern = /(?:^|\/)[^/]+\.glb$/

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return getSourceFiles(path)
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

describe('GLB model assets', () => {
  it('keeps every referenced GLB path present in public', () => {
    const missingAssets = getSourceFiles(sourceDirectory).flatMap((file) => {
      const sourceFile = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      )
      const references: string[] = []

      function collectReferences(node: ts.Node) {
        if (
          (ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node)) &&
          glbPathPattern.test(node.text)
        ) {
          references.push(node.text)
        }
        ts.forEachChild(node, collectReferences)
      }

      collectReferences(sourceFile)

      return references
        .map((reference) =>
          reference.replace(/^\/+/, '').replace(/^public\//, ''),
        )
        .filter((reference) => {
          const assetPath = resolve(publicDirectory, reference)
          return (
            relative(publicDirectory, assetPath).startsWith('..') ||
            !existsSync(assetPath)
          )
        })
        .map((reference) => `${relative(sourceDirectory, file)}: ${reference}`)
    })

    expect(missingAssets).toEqual([])
  })
})
