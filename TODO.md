# Hexoscape roadmap

Updated 2026-11-11 (evening). One page. This file and the project doc
`claude/roadmap.md` are kept identical.

Legend:
- 🔧 in progress (PR or local batch)
- 👀 needs your eyes
- 👤 waiting on you
- ❓ needs a decision or measurement
- 💤 later

## Where we are

`main` is at **v1.0.34** (Nov 11). Releases on Nov 11:

- v1.0.31 / v1.0.32: the Nov 11 feature release
  - Sets dialog, hotkey editor and pen keys, share-link fallback
  - Adapt for obstacles and covered pieces, 3D palms, piece key polish
  - cannons face corners (#378), rotation can't hang a piece off the map
- v1.0.33: Windows desktop 3D and PDF fixed (#379, #393), the Edit tab
  freeze fixed (#392), convert hexagon and rectangle maps (#390)
- v1.0.34 ("Nov-11-2026 Hotfix"): Windows desktop textures and map picture
  (#395), map size in hexes and inches/cm with a diagram (#391)

The Windows desktop app is confirmed working (3D, PDF, SVG, textures, map
picture) on an installed MSI.

## 1. Now

- 🔧 Fix the preview crash over castle wall caps (#397, Sentry 7G)
- 🔧 Remove "Hide heights on glyphs" (local prompt)
- 🔧 Dependabot #387 (@sentry/react 11): PM added the v10 privacy
  baseline (`dataCollection`); merge when green
- 🔧 Dependabot #386 (Biome 2): local migration prompt; run it last, when no
  other PRs are open
- 👀 Hand-test after each deploy
  - Sets dialog on a few real maps
  - piece key in PDF and SVG, PDF Color Borders on and off
  - palms in Low, Medium, High
  - hotkey editor (search, recording, reset)
  - Adapt with obstacles and covered pieces
  - map size steppers and convert in Edit Map Details

## 2. Next (catch-up, in rough order)

**Bugs and quality**

- Web build release version: Sentry shows web errors as
  `hexoscape@local-development`; set the release on the site build
- Ship conflict rules to match the real pieces 👤 your rules first
- Piece key text is small next to full-size pieces ❓ say go
- 2D view still takes about 1 s to open on big maps ❓ say go

**Selection**

- More right-click menu items ❓ pick which
  - grow selection, convert terrain, delete, use as pen
- More moments to drop the selection ❓ pick which
  - a level change hides the selection, leaving 3D, inventory jump

**Piece key**

- Font: Renegade uses Proxima Nova Condensed (commercial) ❓ license
  check, or the free Sofia Sans Condensed
- "Notice centers and border colors" wording ❓ maybe "Size and border
  color"

**Hotkeys**

- More actions on keys (inventory dialog, convert terrain)

**Exports (SVG / PDF)**

- Preset for OHS pictures: see-through jungle leaves, quiet glyph hexes,
  no table
- Classic shapes (Marvel ruin) that don't scale well in SVG
- Virtualscape-style colors option (after the above)

**Edges and nodes** (steps 1-4 are done; see
`docs/edges-and-nodes-design.md`)

- Step 5: 3D picking and previews on edges
- Step 6: SVG and PDF geometry on edges
- Step 7: occupancy and saving on edges

**Rules and pieces**

- Outcrop bases count in inventory ("with holes" pieces don't exist yet)
- Snow trees: no Virtualscape model, so they need another texture plan ❓

**3D looks**

- Palm fronds modeled from real photos 💤 (the code-only fronds look good
  for now)

**Planned upgrades** (Dependabot skips these on purpose)

- React 19, with @react-three/fiber 9 and drei 10
- Vite 8, with the matching React plugin
- TypeScript 7 (the native compiler)
- MUI 7+ (needed for X Data Grid 9)
- Vitest 5 (the bench export moved)
- three and @types/three, together

**Health**

- Rough-edges cleanup (small known nits, listed in `claude/backlog.md`)
- E2E flake watch: tooltips can cover buttons, so move the pointer away
  before clicking
- Developer guide refresh once edges are done (`docs/adding-a-piece.md`)

## 3. Waiting on you 👤

- Laur Ruin 1 redo
- Ship physical rules
- Where to take the UI layout (you said the layout is "way off")
- Frond photos (optional now)
- Hand-testing after each deploy (list in section 1)

## 4. After catch-up

**UI and structure**

- Rework the layout: tabs on the left are not the right way to build;
  fewer clicks
- Map inventory always visible, especially when building with constraints
- Tray of unused pieces off to the side, grouped by terrain set, with drag
  and drop from it
- Always-visible pen, level and errors
- Inventory hints in the pen selector
- Conflict lens (heat map of problem pieces)
- Command palette, help/encyclopedia, tutorial, About

**Site**

- Homepage at `/`: Gallery, New map, Load, About, Desktop downloads
- Database
  - accounts, save and share maps with short URLs, browse by terrain
  - the collection moves there too (Adapt already reads it through one
    function)
  - tournament view: TOTK kits plus a group of maps within their limits
- Shareable map image URL (needs a small server piece)

**2D builder**

- Zoom, select, rotate and convert in the 2D view

**Builder power tools**

- Copy/paste and saved templates, plus a template library
- Combine selected pieces into one larger piece
- Smarter mouse-only rotation (no wheel)

**More content**

- Arena of the Planeswalker terrain (Shandalar boards, ruins)
- Custom colors; custom textures and models
- Virtualscape export and community figure-piece import (need the
  mappings)
- Glow-in-the-dark toxic tiles and Shroudshroom
- Import Virtualscape PDFs as maps (not a priority)

## 5. Done and retired

- Nov 11 (v1.0.31 to v1.0.34): Sets dialog, hotkey editor and pen keys,
  share link fallback, Adapt for obstacles, 3D palms, piece key polish,
  color lock, hive SVG export fix, convert map shape, map size display,
  Windows desktop fixes, 3D load watchdog, cannon corners
- Nov 8 release: Adapt (land), right-click menu, piece key in SVG and
  PDF, SVG downloads, PDF ladder overlay, 2D view 4x faster, game
  heights, ship family, pen switch clears the selection
- Fluid stacks beyond 2: done. Fluid stacks a half level per tile, and
  loading a map warns when a straight run is over 8 tiles
- Textured Warehouse Ruin, Stone Wall, Ruins 2 and 3, Marro Hive and
  Evergreen Trees
- Numbered obstacle variants, Show Objective Markers, Dependabot setup
- Generic pieces, buried marks, Treasure glyph color, Shroudshroom marker
- Objective markers, 3D Look and field of view, background color,
  adjustable lights
- Transparent pictures, crop dialog, Pieces Grid filter keeps, Map
  Inventory click-to-pen, action log
- The old Flash-era `REFACTORED_TODO.md` was retired; this file is the
  only list
