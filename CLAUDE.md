# Hexoscape (heroscape-map-editor)

HeroScape map editor: Vite, React 18, TypeScript, Zustand + Immer (Zundo
undo/redo), R3F/Three, Tauri 2. Biome: single quotes, no semicolons, 80 cols.
Architecture, coordinate space and data model are described in
[.github/agents/hexoscape.agent.md](.github/agents/hexoscape.agent.md); check
the source before relying on it.

Checks: `npm test` (Vitest), `npx tsc -b`, `npx @biomejs/biome lint ./src`,
`npx @biomejs/biome format ./src`, `npm run build`. `npm run lint` and
`npm run format` rewrite files.

## Project decisions

### Goals

- Catch up on the TODO list.
- Add textures, and objective markers.
- Extend the hex grid with edges and nodes (some pieces fit, and compute
  conflicts, better that way).
- Bring in good, non-outdated ideas from old branches (the owner triages old
  branches by hand).
- Make it easy for future developers to add new terrain, with good tests.
- Pieces model real physical product: conflict and support checks should
  eventually match reality exactly.

### Decisions

- Work happens on `dev`, not `main`. After reporting on a PR and getting the
  owner's go-ahead, Claude merges it into `dev` (merge commit, no squash). The
  owner tests `dev` before production. Never merge into `main`, never
  force-push; the owner promotes to `main`, tags and publishes releases.
- Unknown pieces on load: drop and warn. They never enter the app and never
  cause crashes (`buildupJsonFileMap` returns `droppedPieces`; the load sites
  show one warning).
- Double-stacking fluid tiles on `dev` is recent work the owner will test and
  may refactor. Tests must not pin its behavior.
- Canonical state is `boardPieces`; `boardHexes` is the derived grid
  expansion. Laur wall add-ons (terrain `laurWallAddon`) have no grid
  expansion: addPiece's laurWallAddon branch only records the BoardPiece and
  they render straight from `boardPieces`. Keep it that way for now.
  `src/data/laurAddonFootprints.ts` describes what they block, for the future
  edges-and-nodes work; nothing calls it yet.
- `src-tauri/Cargo.lock` is often dirtied by Rust tooling; do not commit it
  unless asked.

### Tests and the `it.fails` convention

Read [src/__tests__/README.md](src/__tests__/README.md) first. Tests are
pure-logic characterization tests. A known defect is written as an `it.fails`
test titled `KNOWN GAP: ...`: it passes while the defect exists and goes red
when someone fixes it. Fixing one means changing it to `it`. Never flip one (or
weaken a test) just to get green; a gap that goes red unexpectedly means the
defect is not what was described, so report it.

### Browser automation (Playwright)

The 3D map is a canvas that Playwright cannot see into. Read
[e2e/README.md](e2e/README.md) before driving the app in a browser. In short:
open `/hs?e2e=1` (not `/`), wait for `window.__APP_READY__` instead of
sleeping, read state from `window.__TEST__.snapshot()` and
`[data-testid="app-status"]`, and click pieces at
`window.__TEST__.screenPosOfPiece(uid)`, never at guessed coordinates.
