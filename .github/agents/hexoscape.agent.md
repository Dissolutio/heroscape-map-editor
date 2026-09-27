---
name: "Hexoscape"
description: "Use for Hexoscape development: hex-grid placement, collision constraints, R3F rendering, shared SVG/PDF exports, map serialization, and Tauri desktop integration."
---

## OVERVIEW & INTENT
- Hexoscape is a HeroScape map editor for the web and Windows/macOS/Linux desktops, supporting multi-hex terrain, elevation, obstacles, map sharing, and build instructions.
- Act as a project-aware technical collaborator. This context applies when the Hexoscape custom agent is selected or invoked; it is not an always-on repository instruction file.

## SYSTEM ARCHITECTURE & TECH STACK
- **Frontend:** Vite, React 18, TypeScript; MUI/Emotion UI; Zustand state, Immer updates, Zundo undo/redo. Dependencies and scripts: [package.json](../../package.json).
- **3D:** R3F, Drei, Three.js in [src/world](../../src/world); Blender-authored GLB models and extensive instancing. Textures remain work in progress.
- **2D/PDF:** [src/svg-map](../../src/svg-map) renders SVG; [src/pdf-map](../../src/pdf-map) uses `@react-pdf/renderer`, not a PDF viewer library. SVG elements are adapted into PDF components, with shared geometry/layout in [src/pdf-svg-shared](../../src/pdf-svg-shared). Changes can affect both outputs; DOM SVG and PDF primitives are not interchangeable.
- **Desktop:** Tauri 2/Rust in [src-tauri](../../src-tauri); signed auto-updates configured in [src-tauri/tauri.conf.json](../../src-tauri/tauri.conf.json). GitHub Actions builds native release artifacts via [.github/workflows](../workflows).
- **Deployment:** Project-declared hosting is Netlify, deploying main to hexoscape.com; native distribution/updates use GitHub Releases. Do not infer hosted settings or release health from checked-in configuration alone.

## THE 3D WORLD COORDINATE SPACE
- **World axes:** +X = left to right; +Z = map top to bottom; +Y = ground to sky. X/Z form the board plane; Y is elevation, not the hex-grid `r` coordinate.
- **Grid:** signed cube coordinates satisfy $q+r+s=0$. Positive axis direction does not imply nonnegative coordinates; do not clamp cube coordinates or world X/Z to zero.
- **Scale:** `HEXGRID_HEX_HEIGHT = 0.35` world units per standard level, matching the authored model scale. For level $L$, $Y=0.35L$ and $\Delta Y=0.35\Delta L$; fluid/cap geometry has separate thicknesses and offsets.
- **World vector:** with $(u,v)=\operatorname{cubeToPixel}(q,r,s)$ and spacing $S$, $(X,Y,Z)=(Su,0.35L,Sv)$. Reuse [src/utils/hex-utils.ts](../../src/utils/hex-utils.ts), [src/utils/map-utils.ts](../../src/utils/map-utils.ts) (`getBoardHex3DCoords`), and [src/utils/constants.ts](../../src/utils/constants.ts).
- **Altitude semantics:** `BoardPiece.altitude` is placement altitude; ordinary land placed at $L$ produces surface hexes at $L+1$. Use existing base/cap/glyph offsets; not every mesh origin sits at its surface Y. Preserve Blender/export alignment; do not assume Blender's native axis convention is Three.js's.
- **Level budget:** intended nonnegative integer levels, typically below 10 and strictly below 100. `HEXGRID_MAX_ALTITUDE = 100` is declared, but do not assume every placement/import path enforces that boundary.

## DATA ARCHITECTURE SCHEMA
Authoritative types: [src/types.ts](../../src/types.ts). Conceptual projection below, not replacement declarations:
```typescript
type CubeCoordinate = { q: number; r: number; s: number }
type BoardPiece = {
  uid: string; inventoryID: string; altitude: number
  rotation: number; pieceCoords: CubeCoordinate
}
type BoardPieces = BoardPiece[]
type BoardHex = CubeCoordinate & {
  id: string; altitude: number; terrain: string; inventoryID: string
  pieceID: string; pieceRotation: number; boardPieceUID?: string
  isCap?: boolean; isObstacleOrigin?: boolean; isObstacleSecondary?: boolean
  isObstacleAuxiliary?: boolean; isVerticalClearanceHex?: boolean
  obstacleHeight?: number; interlockType?: string; interlockRotation?: number
}
type BoardHexes = Record<string, BoardHex>
type MapFileState = { hexMap: HexMap; boardPieces: BoardPieces }
type MapState = MapFileState & { boardHexes: BoardHexes }
```
- **Relationship:** one placed `BoardPiece` expands into footprint/surface/clearance `BoardHexes`, linked by `boardPieceUID`; some overlays/addons create no occupancy cells. Multi-hex land renders a subterrain body plus individual hex caps, not independent placed pieces.
- **Identity:** hex key = `altitude~q~r`; encoded piece = `altitude~q~r~rotation~inventoryID`. Instance `uid` is distinct from encoded `pieceID`. Use existing ID/rotation helpers, including Virtualscape-specific transforms.
- **Persistence:** local JSON/browser storage keeps map metadata and piece instances; derived occupancy is reconstructed. Share URLs encode pieces and compress with JSONCrush through [src/data/jsonCrush.ts](../../src/data/jsonCrush.ts); compression reduces size but does not guarantee every map fits a URL. Preserve normalization of legacy saved formats.
- **Virtualscape:** binary imports use [src/data/readVirtualscapeMapFile.ts](../../src/data/readVirtualscapeMapFile.ts); Odd-R coordinates and rotations require conversion. Export also exists in [src/data/writeVirtualscapeMapFile.ts](../../src/data/writeVirtualscapeMapFile.ts). Rebuild occupancy/conflicts on load; do not persist the matrix as the source of truth.

## CORE LOGIC & CONSTRAINT ENGINE
- **Owners:** [src/data/addPiece.ts](../../src/data/addPiece.ts), [src/data/removePiece.ts](../../src/data/removePiece.ts), and [src/store/map-slice.ts](../../src/store/map-slice.ts) coordinate placement/removal, occupancy, and conflict state.
- **Land:** single-/multi-hex playable surfaces; solid/fluid classification and piece-specific support rules decide placement. Do not reduce all terrain to one support rule.
- **Obstacles:** footprints may block multiple elevations with unequal clearance per hex. Consult [src/data/rotationTransforms.ts](../../src/data/rotationTransforms.ts), [src/data/vertical-obstruction-templates.ts](../../src/data/vertical-obstruction-templates.ts), and [src/utils/board-utils.ts](../../src/utils/board-utils.ts); preserve bridging, open-base, interlock, and special-piece handling.
- **Abstract helpers:** start zones and conceptual objective markers are not physical terrain. Verified start-zone behavior: `boardPieces` only, no `boardHexes` writes or displacement conflicts. Do not generalize this exception to glyphs or every addon; inspect its placement branch.
- **Known limitation:** collision mapping is incomplete, with both false positives (physically fitting pieces flagged) and false negatives (physical overlaps missed). The matrix approximates physical occupancy; it is not a proven collision oracle.
- **Conflict mechanics:** permissive writes can replace a cell's owner; `addPiece` reports `displacedUIDs`, and store logic marks both incoming and displaced piece UIDs. A cell holds one owner, not every overlapping piece. Preserve replay/restoration and conflict recomputation when loading, moving, removing, or undoing pieces.

## COPILOT BEHAVIORAL DIRECTIVES
- Verify current types, helpers, and callers before editing; this document is a navigation aid, not authority over source. Distinguish observed behavior, intended game rules, and proposed fixes; never invent APIs or enforcement guarantees.
- Preserve the **0.35 Y-axis level constraint**, signed cube coordinates, placement/surface distinction, and established model offsets. Reuse coordinate conversions rather than duplicating formulas.
- Keep `boardPieces`, derived `boardHexes`, stable instance UIDs, conflict tracking, serialization, and undo/redo consistent. Never treat each cap or clearance cell as a separate inventory piece.
- Use the **BoardHexes matrix and piece templates** for existing collision logic. Do not invent standard bounding-box collisions or substitute mesh bounds for physical game rules. Check overlaps, legal exceptions, and displaced-piece restoration when changing constraints.
- For **every 2D/SVG change**, inspect shared helpers and PDF adapters; verify geometry, transforms, text, and supported primitives in both outputs. Preserve instancing/shared resource lifecycles in 3D changes.
- Validate the touched behavior first. `npm run build` runs TypeScript and Vite; no test script is currently declared. `npm run lint` and `npm run format` modify source files, so avoid unrelated rewrites. Report checks not run; never claim visual, native-update, or collision correctness from compilation alone.