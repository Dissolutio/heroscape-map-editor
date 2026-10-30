import { nanoid } from 'nanoid'
import type { CubeCoordinate } from '../types'
import { genBoardHexID } from '../utils/map-utils'
import getPieceTemplateCoords from './rotationTransforms'

export const OBJECTIVE_MARKER_PEN_MODE = 'objectiveMarker'

export type ObjectiveMarkerAnchor = CubeCoordinate & {
  altitude: number
}

export type ObjectiveMarkerContent =
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string }

export type ObjectiveMarker = {
  uid: string
  anchor: ObjectiveMarkerAnchor
  size: 1 | 2
  rotation: 0 | 1 | 2 | 3 | 4 | 5
  style: 'black' | 'white'
  content: ObjectiveMarkerContent
  name?: string
}

export type ObjectiveMarkerDraft = Pick<
  ObjectiveMarker,
  'size' | 'style' | 'content' | 'name'
> & {
  pinNumber: boolean
}

export type NewObjectiveMarker = Omit<ObjectiveMarker, 'uid'> & {
  uid?: string
}

const MAX_MARKER_TEXT_LENGTH = 3
export const MAX_OBJECTIVE_MARKER_NAME_LENGTH = 60
export const MAX_OBJECTIVE_MARKER_NUMBER = 99

export function generateObjectiveMarkerUID() {
  return `om_${nanoid(10)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined
  const cleaned = Array.from(value.normalize('NFC'))
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint > 0x1f && (codePoint < 0x7f || codePoint > 0x9f)
    })
    .join('')
    .trim()
  return Array.from(cleaned).slice(0, maxLength).join('')
}

export function normalizeObjectiveMarkerName(value: unknown) {
  const name = normalizeText(value, MAX_OBJECTIVE_MARKER_NAME_LENGTH)
  return name || undefined
}

export function getObjectiveMarkerContentError(
  content: ObjectiveMarkerContent,
) {
  if (content.kind === 'number') {
    if (
      !Number.isInteger(content.value) ||
      content.value < 1 ||
      content.value > MAX_OBJECTIVE_MARKER_NUMBER
    ) {
      return 'Enter a whole number from 1 to 99.'
    }
    return null
  }

  const value = content.value
  if (!value.trim()) return 'Enter 1 to 3 characters.'
  if (
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)
    })
  ) {
    return 'Control characters are not allowed.'
  }
  if (Array.from(value.trim()).length > MAX_MARKER_TEXT_LENGTH) {
    return 'Use no more than 3 characters.'
  }
  return null
}

export function getNextObjectiveMarkerNumber(
  markers: readonly ObjectiveMarker[],
  style: ObjectiveMarker['style'],
  placedNumber: number,
): number | undefined {
  if (
    !Number.isInteger(placedNumber) ||
    placedNumber < 1 ||
    placedNumber > MAX_OBJECTIVE_MARKER_NUMBER
  ) {
    return undefined
  }

  const usedNumbers = new Set([placedNumber])
  for (const marker of markers) {
    if (
      marker.style === style &&
      marker.content.kind === 'number' &&
      getObjectiveMarkerContentError(marker.content) === null
    ) {
      usedNumbers.add(marker.content.value)
    }
  }

  for (
    let number = placedNumber + 1;
    number <= MAX_OBJECTIVE_MARKER_NUMBER;
    number += 1
  ) {
    if (!usedNumbers.has(number)) return number
  }
  for (let number = 1; number < placedNumber; number += 1) {
    if (!usedNumbers.has(number)) return number
  }
  return undefined
}

export function getEffectiveObjectiveMarkerNumber(
  markers: readonly ObjectiveMarker[],
  style: ObjectiveMarker['style'],
  baseNumber: number,
): number {
  if (
    !Number.isInteger(baseNumber) ||
    baseNumber < 1 ||
    baseNumber > MAX_OBJECTIVE_MARKER_NUMBER
  ) {
    return baseNumber
  }

  const isUsed = markers.some(
    (marker) =>
      marker.style === style &&
      marker.content.kind === 'number' &&
      marker.content.value === baseNumber &&
      getObjectiveMarkerContentError(marker.content) === null,
  )
  if (!isUsed) return baseNumber

  return getNextObjectiveMarkerNumber(markers, style, baseNumber) ?? baseNumber
}

function normalizeObjectiveMarker(value: unknown): ObjectiveMarker | null {
  if (!isRecord(value) || !isRecord(value.anchor) || !isRecord(value.content)) {
    return null
  }

  const { q, r, s, altitude } = value.anchor
  if (
    !Number.isInteger(q) ||
    !Number.isInteger(r) ||
    !Number.isInteger(s) ||
    (q as number) + (r as number) + (s as number) !== 0 ||
    typeof altitude !== 'number' ||
    !Number.isFinite(altitude)
  ) {
    return null
  }

  if (value.size !== 1 && value.size !== 2) return null
  if (typeof value.rotation !== 'number' || !Number.isFinite(value.rotation)) {
    return null
  }
  if (value.style !== 'black' && value.style !== 'white') return null
  if (typeof value.uid !== 'string' || value.uid.trim() === '') return null

  let content: ObjectiveMarkerContent
  if (value.content.kind === 'number') {
    const number = value.content.value
    if (typeof number !== 'number' || !Number.isFinite(number)) return null
    content = {
      kind: 'number',
      value: Math.max(1, Math.min(99, Math.trunc(number))),
    }
  } else if (value.content.kind === 'text') {
    const text = normalizeText(value.content.value, MAX_MARKER_TEXT_LENGTH)
    if (!text) return null
    content = { kind: 'text', value: text }
  } else {
    return null
  }

  const marker: ObjectiveMarker = {
    uid: value.uid.trim(),
    anchor: {
      q: q as number,
      r: r as number,
      s: s as number,
      altitude,
    },
    size: value.size,
    rotation: Math.max(0, Math.min(5, Math.round(value.rotation))) as
      | 0
      | 1
      | 2
      | 3
      | 4
      | 5,
    style: value.style,
    content,
  }
  const name = normalizeObjectiveMarkerName(value.name)
  if (name) marker.name = name
  return marker
}

export function normalizeObjectiveMarkers(raw: unknown): ObjectiveMarker[] {
  if (!Array.isArray(raw)) return []

  const markers: ObjectiveMarker[] = []
  const usedUIDs = new Set<string>()
  for (const value of raw) {
    const marker = normalizeObjectiveMarker(value)
    if (!marker || usedUIDs.has(marker.uid)) continue
    usedUIDs.add(marker.uid)
    markers.push(marker)
  }
  return markers
}

export function getObjectiveMarkerFootprint(
  marker: Pick<ObjectiveMarker, 'anchor' | 'size' | 'rotation'>,
): ObjectiveMarkerAnchor[] {
  return getPieceTemplateCoords({
    clickedHex: marker.anchor,
    rotation: marker.rotation,
    template: String(marker.size),
    isVsTile: false,
  }).map((coords) => ({ ...coords, altitude: marker.anchor.altitude }))
}

export function objectiveMarkersOverlap(
  first: Pick<ObjectiveMarker, 'anchor' | 'size' | 'rotation'>,
  second: Pick<ObjectiveMarker, 'anchor' | 'size' | 'rotation'>,
) {
  const firstHexes = new Set(
    getObjectiveMarkerFootprint(first).map(genBoardHexID),
  )
  return getObjectiveMarkerFootprint(second).some((hex) =>
    firstHexes.has(genBoardHexID(hex)),
  )
}
