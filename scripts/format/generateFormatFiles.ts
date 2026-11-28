import { getPossibleRotationsForPenMode } from '../../src/controls/getPossibleRotationsForPenMode'
import { piecesSoFar } from '../../src/data/pieces'
import {
  getPortAddon,
  getPortPillar,
  getPortPieceRotations,
} from '../../src/data/portPieces'
import getPieceTemplateCoords from '../../src/data/rotationTransforms'
import {
  MAX_SHARE_URL_LENGTH,
  SHARE_URL_FALLBACK_DROP_ORDER,
} from '../../src/data/shareUrlConstants'
import tileTemplates from '../../src/data/tileTemplates'
import { ROUTES } from '../../src/ROUTES'
import { ORIGIN_000 } from '../../src/utils/constants'
import {
  MAP_SHARE_URL_PARAM_KEYS,
  MAP_SHARE_VIEW_PARAM_VALUES,
} from '../../src/utils/mapShareUrl'

const JSON_SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema'

export type FormatFiles = Record<string, string>

export type GenerateFormatFilesOptions = {
  hexMapSchema: unknown
  jsoncrushVersion: string
  generatedAt: string
  gitCommit?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected the generated HexMap schema to be an object')
  }
  return value as Record<string, unknown>
}

function rewriteDefinitionRefs(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/#\/definitions\//g, '#/$defs/')
  }
  if (Array.isArray(value)) return value.map(rewriteDefinitionRefs)
  if (typeof value !== 'object' || value === null) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      rewriteDefinitionRefs(child),
    ]),
  )
}

function makeShareLinkSchema(hexMapSchema: unknown) {
  const generated = asRecord(hexMapSchema)
  const definitions = asRecord(generated.definitions)
  const hexMapDefinition = definitions.HexMap
  if (!hexMapDefinition) {
    throw new Error('The TypeScript schema generator did not emit HexMap')
  }

  return {
    $schema: JSON_SCHEMA_DRAFT,
    title: 'Hexoscape share-link payload',
    description:
      'A HexMap followed by zero or more encoded piece strings. Piece s coordinates are derived as -q-r. Unknown inventory IDs are dropped with a warning when loaded.',
    type: 'array',
    minItems: 1,
    prefixItems: [rewriteDefinitionRefs(hexMapDefinition)],
    items: {
      type: 'string',
      pattern: '^-?\\d+(?:\\.\\d+)?~-?\\d+~-?\\d+~-?\\d+(?:\\.\\d+)?~[^~]+$',
      description:
        'altitude~q~r~rotation~inventoryID; s is derived as -q-r and unknown IDs are dropped with a warning on load.',
    },
    $defs: rewriteDefinitionRefs(definitions),
  }
}

function makePieceList() {
  return Object.values(piecesSoFar)
    .map((piece) => {
      if (!tileTemplates[piece.template]) {
        throw new Error(
          `Piece ${piece.id} references missing tile template ${piece.template}`,
        )
      }

      const base = {
        id: piece.id,
        title: piece.title,
        terrain: piece.terrain,
        size: piece.size,
        height: piece.height,
        template: piece.template,
      }
      const pillar = getPortPillar(piece.id)
      const addon = getPortAddon(piece.id)

      if (pillar || addon) {
        const allowedRotations = getPortPieceRotations(piece.id)
        if (!allowedRotations) {
          throw new Error(`Port piece ${piece.id} has no rotation rules`)
        }
        return {
          ...base,
          allowedRotations: [...allowedRotations],
          rotationNote: pillar
            ? `Port pillar rotations follow ${pillar.rotations} port alignment.`
            : `Port add-on rotations follow its ${addon?.span} span.`,
        }
      }

      const allowedRotations = getPossibleRotationsForPenMode(piece.id)
      return {
        ...base,
        allowedRotations,
        footprints: allowedRotations.map((rotation) => ({
          rotation,
          offsets: getPieceTemplateCoords({
            clickedHex: ORIGIN_000,
            rotation,
            template: piece.template,
            isVsTile: false,
          }),
        })),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function jsonFile(value: unknown) {
  return `${JSON.stringify(value)}\n`
}

export function generateFormatFiles({
  hexMapSchema,
  jsoncrushVersion,
  generatedAt,
  gitCommit,
}: GenerateFormatFilesOptions): FormatFiles {
  const version = {
    formatVersion: 1,
    jsoncrushVersion,
    route: ROUTES.heroscapeHome,
    mapParam: MAP_SHARE_URL_PARAM_KEYS.map,
    viewParam: {
      name: MAP_SHARE_URL_PARAM_KEYS.viewMode,
      values: {
        [MAP_SHARE_VIEW_PARAM_VALUES.pdf]: 'PDF',
        [MAP_SHARE_VIEW_PARAM_VALUES.twoD]: '2D',
        default: '3D',
      },
    },
    maxUrlLength: MAX_SHARE_URL_LENGTH,
    fallbackDropOrder: [...SHARE_URL_FALLBACK_DROP_ORDER],
    docsUrl:
      'https://github.com/Dissolutio/heroscape-map-editor/blob/main/docs/share-links.md',
    generatedAt,
    ...(gitCommit ? { gitCommit } : {}),
  }

  return {
    'format/share-link.schema.json': jsonFile(
      makeShareLinkSchema(hexMapSchema),
    ),
    'format/pieces.json': jsonFile(makePieceList()),
    'format/version.json': jsonFile(version),
  }
}
