# Hexoscape roadmap

Updated 2026-11-03. One page. Legend: 🔧 Copilot has it (issue #) · 👀 needs your eyes · 👤 waiting on you · ❓ needs a decision or measurement · 💤 later

## Where we are
Shipped Nov 2: Windows 3D recovery, action log, selection history + undo restores selection, rotate hotkeys (q/e) while dragging, Use as Pen, upright side textures, fluid caps, old-map loading fix. Textures (3 graphics tiers), objective markers, edge IDs for Laur/battlements/ladders are all in.

## 1. Now
- 👀 Side textures mirrored left-right (PR #237): look at a side with your height map after merge
- 👀 Test selection history, the ghost-preview fix, Windows diagnostics (Sentry tag `webgl`)
- 🔧 #238 Remove broken Zoom-to-Piece fade; one 3D | 2D | PDF switch in the navbar
- 🔧 #239 Size hotkeys (1, 3, ...) for trees, outcrops and other obstacle families
- 🔧 #240 PDF legend of the pieces used in the map
- 🔧 #241 One shared rotation for markers and glyphs (camera shots)

## 2. Next (catch-up, in rough order)
**Selection** (design together first)
- Click an empty hex to deselect
- Right-click menu: select same type, connected, same level, invert

**Hotkeys**
- Edit hotkeys, import/export a config file
- More actions on keys (inventory dialog, convert terrain)

**Exports (SVG / PDF)**
- PDF sub-level colors match SVG (opaque 50% blend)
- Ladder stack counts on the overlay
- Preset for OHS pictures (see-through jungle leaves, quiet glyph hexes, no table)
- Classic shapes (Marvel ruin, hive) that don't scale well in SVG
- Virtualscape-style colors option (after the above)

**Edges and nodes** (Laur, battlements, ladders already use edge IDs)
- Step 5: 3D picking and previews on edges
- Step 6: SVG/PDF geometry on edges
- Step 7: occupancy and saving on edges

**Rules and pieces**
- Ship conflicts at level 0 ❓ needs physical testing
- Outcrop bases count in inventory ("with holes" pieces don't exist yet)
- Tall stacks of fluid beyond 2 ❓ needs physical testing
- Laur Ruin 2 and 3: pen modes and 3D models 👤 models from you

**Health**
- Rough-edges cleanup (small known nits, list in project docs)
- E2E flake watch
- Developer guide refresh once edges are done (`docs/adding-a-piece.md`)
- "Retry 3D" button if the Windows panel shows up in the wild

## 3. Waiting on you 👤
- Road and Wood textured caps, all remaining solid land textures (Blender)
- Laur Ruin 1 redo; Ruin 2 and 3 models
- Hand-testing after each deploy
- Where to take the UI layout (you said the layout is "way off")

## 4. After catch-up
**UI and structure**
- Rework the layout (always-visible pen, level, errors; inventory in a floating box)
- Inventory hints in the pen selector
- Conflict lens (heat map of problem pieces)
- Command palette, help/encyclopedia, tutorial, About

**Site**
- Homepage at `/` (Gallery, New map, Load, About, Desktop downloads)
- Database: accounts, save/share maps with short URLs, browse by terrain
- Shareable map image URL (needs a small server piece)

**2D builder**
- Zoom, select, rotate, convert in the 2D view

**Builder power tools**
- Copy/paste and saved templates (plus a template library)
- Combine selected pieces into one larger piece
- Convert a map to fit your inventory; what sets can build this map
- Smarter mouse-only rotation (no wheel)

**More content**
- Arena of the Planeswalker terrain (Shandalar boards, ruins)
- Custom colors; custom textures and models
- Virtualscape export and community figure-piece import (need the mappings)
- Glow-in-the-dark toxic tiles and Shroudshroom
- Import Virtualscape PDFs as maps (not a priority)

## 5. Done and retired
Generic pieces, buried marks, Treasure glyph color, Shroudshroom marker, objective markers, 3D Look + field of view, transparent pictures, crop dialog, Pieces Grid filter keeps, Map Inventory click-to-pen, action log, background color, adjustable lights (3D Look). `REFACTORED_TODO.md` (the Flash plan) is superseded by this file.
