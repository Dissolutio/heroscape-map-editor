# Hexoscape roadmap

Updated 2026-11-08. One page. This file and the project doc
`claude/roadmap.md` are kept identical.

Legend:
- 🔧 Copilot has it (issue #)
- 👀 needs your eyes
- 👤 waiting on you
- ❓ needs a decision or measurement
- 💤 later

## Where we are

Released to `main` on Nov 8 (`e517d0ec`). Since then on `dev`:

- react-hotkeys-hook 5
- Dependabot holds MUI and Vitest major upgrades
- this TODO update

The release notes still end at Nov-07. A Nov-08 entry is drafted in chat.
Two Nov-07 bullets no longer match what shipped:

- "Objective marker numbers face you" (now an option, off by default)
- "Ladder stack counts" (the "x3" text was replaced by the PDF ladder
  overlay)

Shipped in the Nov 8 release:

- Adapt to my Collection (land only)
  - ranked substitutes, a new-map naming step, no Generic pieces
- Right-click selection menu
  - same type, connected, same level, invert
  - "connected" means land, obstacles on their land, Laur, edge pieces
- Navbar: the original 3D, 2D and PDF icons, showing the two other views
- Piece key in SVG and PDF
  - official-style table with real shapes
  - drawn from a rotation-0 placement
  - PDF pages break only between rows
- SVG downloads
  - one level, the Legend, or the whole map as a .zip or one SVG
  - the Legend is its own step in the 2D view
  - key text is paths, no strokes
- PDF ladder overlay (replaces the "x3" text)
- 2D view about 4x faster
- Printed heights use the game height
  - Evergreen Tree (10) prints 10, Laur walls print 9
- Ship family: Ship Wall, Ship Bow, Rope Ladder, Cannon on keys 1-4
- Switching to a placement pen clears the selection
  - logged and recallable; "Use as Pen" keeps it
- "Objective text follow camera" option, off by default
- "Show Glyphs" switch for 3D ("Transparent glyph spaces" removed)
- Fixes
  - deleting a piece no longer makes other pieces vanish
  - ship pieces always show in 2D, SVG and PDF
- e2e runs in 5 shards; Dependabot targets `dev`

Earlier (Nov 2-6):

- textures for the Marro Hive, Evergreen Trees, Warehouse Ruin,
  Stone Wall, Ruins 2 and 3
- numbered obstacle variants
- action log and saved selections
- Show Objective Markers
- Windows 3D recovery

## 1. Now

- 🔧 Piece key fixes (#350, PR #351)
  - ladder text, rope ladder centering
  - Laur add-ons drawn as on the map
  - SVG caption overlap and spacing, "Toxic Land"
- 👀 Hand-test the Nov 8 release
  - right-click menu: all four actions, right-drag still orbits, Escape,
    Select connected with start zones shown
  - Adapt to my Collection: 2nd and 3rd substitute only when needed,
    buried fill, naming step, one Undo
  - piece key in SVG and PDF on a real map with rotated pieces
  - SVG downloads: zip, one SVG, the Legend step
  - PDF ladder overlay, including two runs on one edge
  - pen switch clears the selection, and the log row brings it back
  - ship family keys 1-4, Show Glyphs
  - "Objective text follow camera" at low camera angles
  - deleting near ships no longer eats water; ship walls and bows print
- 👀 Hotkeys after react-hotkeys-hook 5 (merged)
  - Q/E rotate, number keys, Shift+1, arrows, Ctrl+Z, pen hotkeys
- 👀 Delete speed on a big map (delete now replays the board, like move)
- 👀 Older hand-tests still open
  - Warehouse Ruin variants, Stone Wall, big-tree squash
  - Laur wall variant buttons (label fit, Shift+1)
  - textured hive and trees
  - hex sides under start zones and beside water
- 👀 First release build after the Rust 1.90 minimum; the two zip
  Dependabot alerts close once the updater fix ships
- 👤 Release notes: add the Nov-08 entry, fix the two stale Nov-07 bullets

## 2. Next (catch-up, in rough order)

**Bugs and quality**

- Ship conflict rules to match the real pieces (ships over water)
  👤 your rules first
- Piece key text is small next to full-size pieces ❓ say go
- Lock the SVG colors with a snapshot test, so any change fails CI
  ❓ say go
- 2D view still takes about 1 s to open on big maps; profile it against
  Oct 1 ❓ say go

**Selection**

- More right-click menu items ❓ pick which
  - grow selection, convert terrain, delete, use as pen
- More moments to drop the selection ❓ pick which
  - a level change hides the selection, leaving 3D, inventory jump

**Adapt to my Collection**

- Obstacle substitution: trees for trees; Jungle, Shroudshrooms and
  Cannons only as a last resort
- What sets can build this map

**Hotkeys**

- Edit hotkeys; import and export a config file
- More actions on keys (inventory dialog, convert terrain)

**Exports (SVG / PDF)**

- Preset for OHS pictures: see-through jungle leaves, quiet glyph hexes,
  no table
- Classic shapes (Marvel ruin, hive) that don't scale well in SVG
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

- Jungle palms (Laur and Ticalla) with cut-out, drooping fronds, 3D only
  - issue drafted in `claude/jungle-palm-3d-issue-draft.md`
  - file it after the release
  - 👤 frond photos from the community

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
- Frond photos for the jungle palms: one frond with a sheet of colored
  card slid behind it, shot straight down in daylight
- Ship physical rules
- Where to take the UI layout (you said the layout is "way off")
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

- Fluid stacks beyond 2: done. Fluid stacks a half level per tile, and
  loading a map warns when a straight run is over 8 tiles (measured: 8
  fluid = 4 solid, 10 fluid is taller than 5)
- Nov 8 release: everything listed under "Where we are"
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
