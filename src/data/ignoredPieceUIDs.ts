export type IgnoredPieceUIDs = string | readonly string[] | ReadonlySet<string>

export function toIgnoredPieceUIDSet(
  ignoredUIDs?: IgnoredPieceUIDs,
): ReadonlySet<string> {
  if (!ignoredUIDs) return new Set()
  if (typeof ignoredUIDs === 'string') return new Set([ignoredUIDs])
  if ('has' in ignoredUIDs) return ignoredUIDs
  return new Set(ignoredUIDs)
}
