# Hexoscape TODO

One bullet per item, 80 characters or less. Same text as the Project doc
`claude/roadmap.md`. ❓ = needs a decision, 👤 = waiting on John.

## In progress

- Trim map button, PDF key notice cell, resize redraw (local prompt)

## Next

- Check Sentry after deploy: web release version, Sentry 11 events
- ❓ Confirm cells for obstacles still marked "full hex" (list in #404)
- 👤 Check Ruins 2/3 cells with `?cells=1` (some may be 1 level off)
- Laur add-ons on edge/node cells (no false flags next to walls)
- Ships on cells against every piece, not just walls
- ❓ More right-click menu items: grow selection, convert, delete, use as pen
- ❓ More moments to drop the selection: level change, leave 3D, inventory
- ❓ Piece key font: Proxima Nova license, or free Sofia Sans Condensed
- ❓ "Notice centers and border colors" wording, maybe "Size and border color"
- More hotkey actions: inventory dialog, convert terrain
- OHS picture preset: see-through jungle leaves, quiet glyphs, no table
- SVG: classic shapes that don't scale well (Marvel ruin)
- Virtualscape-style color option
- Edges and nodes step 5: 3D picking and previews on edges
- Edges and nodes step 6: SVG and PDF geometry on edges
- Edges and nodes step 7: occupancy and saving on edges
- Outcrop bases count in inventory
- ❓ Snow trees texture plan (no Virtualscape model)
- 👤 Laur Ruin 1 redo
- Refresh the developer guide (`docs/adding-a-piece.md`)

## Upgrades (Dependabot skips these on purpose)

- React 19, @react-three/fiber 9 and drei 10
- Vite 8 and its React plugin
- TypeScript 7 (native compiler)
- MUI 7+ (for X Data Grid 9)
- Vitest 5
- three and @types/three, together
- opentype.js 2 (can't read our Inter font yet)

## Later

- 👤 UI layout rework: fewer clicks, no tabs on the left
- Map inventory always visible
- Tray of unused pieces by terrain set, drag and drop from it
- Always-visible pen, level and errors
- Inventory hints in the pen selector
- Conflict lens (heat map of problem pieces)
- Command palette, help, tutorial, About
- Homepage: Gallery, New map, Load, About, Desktop downloads
- Database: accounts, saved maps, short share links, browse by terrain
- Collection in the database; tournament view with TOTK kits
- Shareable map image URL
- 2D builder: zoom, select, rotate, convert
- Copy/paste, saved templates, template library
- Combine selected pieces into one larger piece
- Mouse-only rotation (no wheel)
- Community custom terrain set, behind Include VC Content
- Arena of the Planeswalker terrain
- Custom colors, textures and models
- Virtualscape export and figure-piece import (needs the mappings)
- Glow-in-the-dark toxic tiles and Shroudshroom
- Palm fronds modeled from photos
