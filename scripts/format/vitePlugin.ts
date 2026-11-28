import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { generateFormatFiles, type FormatFiles } from './generateFormatFiles'
import { generateHexMapSchema } from './schema'

type PackageLock = {
  packages?: Record<string, { version?: unknown }>
}

function getGitCommit(root: string) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  if (result.error) {
    if ('code' in result.error && result.error.code === 'ENOENT') {
      return undefined
    }
    throw result.error
  }
  if (result.status !== 0) return undefined
  return result.stdout.trim() || undefined
}

function generateFiles(root: string, hexMapSchema: unknown): FormatFiles {
  const packageLock = JSON.parse(
    readFileSync(resolve(root, 'package-lock.json'), 'utf8'),
  ) as PackageLock
  const jsoncrushVersion =
    packageLock.packages?.['node_modules/jsoncrush']?.version
  if (typeof jsoncrushVersion !== 'string') {
    throw new Error('Could not read the locked jsoncrush version')
  }

  return generateFormatFiles({
    hexMapSchema,
    jsoncrushVersion,
    generatedAt: new Date().toISOString(),
    gitCommit: getGitCommit(root),
  })
}

export function shareLinkFormatPlugin(): Plugin {
  let root = process.cwd()
  let files: FormatFiles = {}
  let hexMapSchema: unknown

  const generate = () => {
    hexMapSchema ??= generateHexMapSchema(root)
    files = generateFiles(root, hexMapSchema)
  }

  return {
    name: 'hexoscape-share-link-format-files',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      generate()
      server.middlewares.use((request, response, next) => {
        if (request.method !== 'GET' || !request.url) return next()

        const requestPath = request.url.split('?')[0] ?? ''
        const fileName = requestPath.startsWith('/')
          ? requestPath.slice(1)
          : requestPath
        const content = files[fileName]
        if (!content) return next()

        response.statusCode = 200
        response.setHeader('content-type', 'application/json; charset=utf-8')
        response.end(content)
      })
    },
    buildStart() {
      generate()
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}
