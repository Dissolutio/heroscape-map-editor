# Hexoscape TODO

One bullet per item, 80 characters or less. Same text as the Project doc
`claude/roadmap.md`. ❓ = needs a decision, 👤 = waiting on John.

## In progress

- 👤 Smoke-test the Windows desktop app on the next release
- Sentry: confirm the next web error reports the right release (#463)

## Next

- 👤 Ask Caps if he wants a Virtualscape compatibility doc
- Fortress Banner piece: 7 tall, on a battlement (GLB from Virtualscape ready)
- ❓ Fortress models: keep the Classic option, or drop it later
- ❓ Confirm cells for obstacles still marked "full hex" (list in #404)
- 👤 Check Ruins 2/3 cells with `?cells=1` (some may be 1 level off)
- ❓ Piece key font: Proxima Nova license, or free Sofia Sans Condensed
- ❓ SVG key "Notice centers" wording, maybe "Size and border color"
- OHS picture preset: see-through jungle leaves, quiet glyphs, no table
- SVG: classic shapes that don't scale well (Marvel ruin)
- Virtualscape-style color option
- Edges and nodes step 5: 3D picking and previews on edges
- Edges and nodes step 6: SVG and PDF geometry on edges
- Edges and nodes step 7: occupancy and saving on edges
- ❓ Snow trees texture plan (no Virtualscape model)
- 👤 Laur Ruin 1 redo

## Upgrades (Dependabot skips these on purpose)

- React 19, @react-three/fiber 9 and drei 10
- Vite 8 and its React plugin
- TypeScript 7 (native compiler)
- MUI 7+ (for X Data Grid 9)
- Vitest 5
- three and @types/three, together
- opentype.js 2 (can't read our Inter font yet)

## Later

- Arena of the Planeswalker sets (official; John's map coming)
- Freeform mat (Virtualscape's custom hex grid mats)
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
- Virtualscape figure-piece import (needs the mappings)
- Pylon energy beam glow effect
- Glow-in-the-dark toxic tiles and Shroudshroom
- Palm fronds modeled from photos
