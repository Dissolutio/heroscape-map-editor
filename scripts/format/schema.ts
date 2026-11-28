import { resolve } from 'node:path'
import { createGenerator } from 'ts-json-schema-generator'

export function generateHexMapSchema(root: string) {
  return createGenerator({
    path: resolve(root, 'src/types.ts'),
    tsconfig: resolve(root, 'tsconfig.app.json'),
    type: 'HexMap',
  }).createSchema('HexMap')
}
