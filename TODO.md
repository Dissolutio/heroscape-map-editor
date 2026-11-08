# Hexoscape roadmap

Updated 2026-11-08. One page. This file and the project doc `claude/roadmap.md` are kept identical.
Legend: 🔧 Copilot has it (issue #) · 👀 needs your eyes · 👤 waiting on you · ❓ needs a decision or measurement · 💤 later

## Where we are
Released to `main` Nov 8 (`e517d0ec`), everything below included. Release notes: the top entry is still Nov-07. A drafted Nov-08 entry is in chat; two Nov-07 bullets (marker numbers always face you, ladder "x3") no longer match what shipped.
Since Nov 6: Adapt to my Collection (land only; ranked substitutes, new-map naming step, no Generic); right-click selection menu (same type, connected, same level, invert; "connected" = land, obstacle on its land, Laur, edge pieces); 3D | 2D | PDF switch replaced by the original icons; official-style piece key in SVG and PDF (real shapes, drawn from a rotation-0 placement, PDF breaks only between rows); SVG downloads (one level, Legend, whole map .zip or one SVG; Legend is its own 2D step; key text as paths, no strokes); PDF ladder overlay (the "x3" text is gone); 2D view about 4x faster; printed heights use the game height (Evergreen Tree (10) prints 10, Laur walls 9); ship family (Ship Wall, Ship Bow, Rope Ladder, Cannon = 1-4); switching to a placement pen clears the selection (logged, recallable; Use as Pen keeps it); "Objective text follow camera" option (default off); "Show Glyphs" for 3D (Transparent glyph spaces removed); fixes: deleting a piece made other pieces vanish, ship pieces missing from 2D/SVG/PDF; e2e in 5 shards; Dependabot targets `dev`.
Earlier (Nov 2-6): textures for Marro Hive, Evergreen Trees, Warehouse Ruin, Stone Wall, Ruins 2/3; numbered obstacle variants; action log and saved selections; Show Objective Markers; Windows 3D recovery.

## 1. Now
- 👀 Hand-test the Nov 8 release: right-click menu (all four actions, right-drag still orbits, Escape; Select connected on a map with start zones shown); Adapt to my Collection (2nd/3rd substitute appears only when needed, buried fill, naming step, one Undo); piece key in SVG and PDF on a real rotated map; SVG downloads (zip, one SVG, Legend step); PDF ladder overlay (two runs on one edge); pen switch clears selection + log recall; ship family keys 1-4; Show Glyphs; Objective text follow camera at low angles; delete near ships no longer eats water; ship walls and bows print
- 👀 Delete speed on your big map (delete now replays the board, like move already did)
- 👀 Earlier hand-test lists still open: Warehouse Ruin variants, Stone Wall, big-tree squash, Laur wall variant buttons (label fit, Shift+1), textured hive and trees, hex sides under start zones and beside water
- 👀 First release build after the Rust 1.90 minimum; the two zip Dependabot alerts close once the updater fix ships
- 👤 Dependabot: try the hotkeys with #344 (react-hotkeys-hook 5) before merging; merge #348 (hold MUI and Vitest majors)
- 👤 Delete the leftover branch `parity/svg-snapshot-on-dev` (`git push origin --delete parity/svg-snapshot-on-dev`)
- 👤 Release notes: add the Nov-08 entry and fix the two stale Nov-07 bullets

## 2. Next (catch-up, in rough order)
**Bugs and quality**
- Ship conflict rules to match the physical pieces (ships over water) 👤 your rules first
- Piece key text is small next to full-size pieces (headings about one hex radius, subtitles about half) ❓ say go
- Lock the SVG colors with a snapshot test so any change fails CI; optional render comparison against Oct 1 ❓ say go
- 2D view still about 1 s to open on big maps: profile Oct 1 vs now ❓ say go

**Selection**
- More right-click menu items (grow selection, convert terrain, delete, use as pen) ❓ pick which
- More "drop the selection" moments: level change hides it, leaving 3D, inventory jump ❓ pick which

**Adapt to my Collection**
- Obstacle substitution (trees for trees; Jungle, Shroudshrooms, Cannons as last resort)
- What sets can build this map

**Hotkeys**
- Edit hotkeys, import/export a config file
- More actions on keys (inventory dialog, convert terrain)

**Exports (SVG / PDF)**
- Preset for OHS pictures (see-through jungle leaves, quiet glyph hexes, no table)
- Classic shapes (Marvel ruin, hive) that don't scale well in SVG
- Virtualscape-style colors option (after the above)

**Edges and nodes** (Laur, battlements, ladders already use edge IDs)
- Step 5: 3D picking and previews on edges
- Step 6: SVG/PDF geometry on edges
- Step 7: occupancy and saving on edges

**Rules and pieces**
- Outcrop bases count in inventory ("with holes" pieces don't exist yet)
- Tall stacks of fluid beyond 2 ❓ needs physical testing
- Snow trees: no Virtualscape model, needs a different texturing plan ❓
- Delete leftover old GLBs (`marvel-ruins_v2.glb`, old tree GLBs) once their bounds tests use recorded bounds

**3D looks**
- Jungle palms (Laur and Ticalla) with cut-out drooping fronds, 3D only. Issue drafted in `claude/jungle-palm-3d-issue-draft.md`, file after the release 👤 frond photos from the community

**Planned upgrades** (Dependabot skips these on purpose)
- React 19 with @react-three/fiber 9 and drei 10
- Vite 8 with the matching React plugin
- TypeScript 7 (native compiler)
- MUI 7+ (X Data Grid 9)
- Vitest 5 (bench export moved)
- three and @types/three together

**Health**
- Rough-edges cleanup (small known nits, list in `claude/backlog.md`)
- E2E flake watch (tooltips can cover buttons: move the pointer away before clicking)
- Developer guide refresh once edges are done (`docs/adding-a-piece.md`)

## 3. Waiting on you 👤
- Laur Ruin 1 redo
- Frond photos for the jungle palms (one frond with a card slid behind it, shot straight down in daylight)
- Ship physical rules
- Where to take the UI layout (you said the layout is "way off")
- Hand-testing after each deploy (list in section 1)

## 4. After catch-up
**UI and structure**
- Rework the layout: tabs on the left are not the right way to build; fewer clicks
- Map inventory always visible, especially when building with constraints
- Tray of unused pieces off to the side, grouped by terrain set, drag and drop from it
- Always-visible pen, level, and errors
- Inventory hints in the pen selector
- Conflict lens (heat map of problem pieces)
- Command palette, help/encyclopedia, tutorial, About

**Site**
- Homepage at `/` (Gallery, New map, Load, About, Desktop downloads)
- Database: accounts, save/share maps with short URLs, browse by terrain; the collection moves there too (Adapt already reads it through one function)
- Shareable map image URL (needs a small server piece)

**2D builder**
- Zoom, select, rotate, convert in the 2D view

**Builder power tools**
- Copy/paste and saved templates (plus a template library)
- Combine selected pieces into one larger piece
- Smarter mouse-only rotation (no wheel)

**More content**
- Arena of the Planeswalker terrain (Shandalar boards, ruins)
- Custom colors; custom textures and models
- Virtualscape export and community figure-piece import (need the mappings)
- Glow-in-the-dark toxic tiles and Shroudshroom
- Import Virtualscape PDFs as maps (not a priority)

## 5. Done and retired
Adapt to my Collection (land), right-click selection menu, official-style piece key, SVG download rework, PDF ladder overlay, game heights, ship family, Show Glyphs, faster 2D view, textured Warehouse Ruin, Stone Wall, Ruins 2/3, Marro Hive and evergreen trees, numbered obstacle variants, Show Objective Markers switch, Dependabot setup, generic pieces, buried marks, Treasure glyph color, Shroudshroom marker, objective markers, 3D Look + field of view, transparent pictures, crop dialog, Pieces Grid filter keeps, Map Inventory click-to-pen, action log, background color, adjustable lights (3D Look). The old Flash-era `REFACTORED_TODO.md` was retired; this file is the only list.
