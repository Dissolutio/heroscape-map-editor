/**
 * Maps a string to a stable number in [0, 1) (the 53-bit "cyrb53" hash).
 * Used under `?e2e` so cosmetic "randomness" is the same on every run (for
 * repeatable screenshots), and depends only on the key, not on render order.
 */
export function hashToUnit(key: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  // 21 bits from h2 and 32 bits from h1 = 53 bits, scaled into [0, 1)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) / 9007199254740992
}
