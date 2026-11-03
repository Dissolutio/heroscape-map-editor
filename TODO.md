# Hexoscape roadmap

Updated 2026-11-03 (evening). One page. Legend: 🔧 Copilot has it (issue #) · 👀 needs your eyes · 👤 waiting on you · ❓ needs a decision or measurement · 💤 later

## Where we are
Merged Nov 3: upright and unmirrored side textures, size hotkeys for obstacles, one 3D | 2D | PDF navbar switch, optional PDF piece legend, shared marker/glyph rotation, no random rotation on Wood caps, quieter action log, selection units (saved named selections pinned above the action log, log rows recall their selection; replaces back/forward history).
Shipped Nov 2: Windows 3D recovery, action log, selection history + undo restores selection, rotate hotkeys (q/e) while dragging, Use as Pen, upright side textures, fluid caps, old-map loading fix. Textures (3 graphics tiers), objective markers, edge IDs for Laur/battlements/ladders are all in.

## 1. Now
- 👀 Hand-test the Nov 3 merges: side textures not mirrored, size hotkeys (#239), navbar 3D | 2D | PDF switch (#238), PDF piece legend (#240), shared marker/glyph rotation (#241)
- 👀 Zoom-to-Piece fade: Copilot found no fade code in source. Does it still happen?
- 👀 Test selection units: click action-log rows, save and recall a named selection (Shift adds), save and reload a map keeps them
- 👀 Test the ghost-preview fix and Windows diagnostics (Sentry tag `webgl`)

## 2. Next (catch-up, in rough order)
**Selection**
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
- Retire the old High-Quality render path and the unused textured model files (the new textures replace them)
- Rough-edges cleanup (small known nits, list in project docs)
- E2E flake watch (tooltips can cover buttons: move the pointer away before clicking)
- Developer guide refresh once edges are done (`docs/adding-a-piece.md`)
- "Retry 3D" button if the Windows panel shows up in the wild

## 3. Waiting on you 👤
- Laur Ruin 1 redo; Ruin 2 and 3 models
- Hand-testing after each deploy (list in section 1)
- Where to take the UI layout (you said the layout is "way off")

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
Generic pieces, buried marks, Treasure glyph color, Shroudshroom marker, objective markers, 3D Look + field of view, transparent pictures, crop dialog, Pieces Grid filter keeps, Map Inventory click-to-pen, action log, background color, adjustable lights (3D Look). The old Flash-era `REFACTORED_TODO.md` was retired; this file is the only list.
