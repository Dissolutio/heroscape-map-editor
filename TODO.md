## Current todo
- Move/rotate placed pieces
- Validation through BoardHexes, but render through BoardPieces
- Multi-select pieces
- Road tiles need their own textured/complex cap for 3D high quality render
- Wood tiles need their own textured/complex-geometry cap for 3D high quality render
- Ancient terrain in 3D should have darker brown color
- Hexagon shaped maps should produce a map with same side-length as map size (1 smaller than current)
- Display inventory usage info in pen mode selector
- Organize pen mode selector according to Sets Used in the map
- StartZones should not have a vertical clearance, should not be blocked by vertical clearance
- PDF/SVG level logo from Renegade
- PDF option to enable overlay layer
- PDF/SVG option to show overlay pieces on own level
- PDF styles, update to match SVG
- PDF style option: disable land tile piece outline colors (make black)
- PDF style option: disable hexgrid lines over sub-levels
- Add 3D object, UI, and PDF/SVG for Objective/meta markers

## Todo EZ
- Move wallwalk in pen mode selector to be closer to road
- Add a hotkey for wallwalk
- Middle click a piece to make it the pen mode
- Hotkey for rotating camera azimuth angle by 15 degree increments
- Format painter (paint tiles to be grass etc.)
- In View Map Inventory dialog, clicking the line item selects it for your terrain placer
- Outcrop bases into inventory
- PDF 2 column format
- PDF portrait as level format
- PDF: way to add options Sets Used list(or more than 1 in general perhaps)
- PDF style option: enable legacy Virtualscape colors
- SVG Hive update with text "Hive" instead of non-scaleable bubbles
- SVG Ruins 2 redo as scaleable  (no stroke, only fill)
- SVG Ruins 3 redo as scaleable  (no stroke, only fill)
- SVG Ruins Marvel redo as scaleable  (no stroke, only fill)
- SVG Battlement redo as scaleable path (no stroke, only fill)
- SVG Ladder redo as scaleable path (no stroke, only fill)
- SVG Castle Corner / End / Straight / Arch redo as scaleable path (no stroke, only fill)

## Todo
- Personal Inventory: let users enter their own piece count and save that inventory in local storage as a set for Sets Used
- When piece preview is active, scrolling should rotate the piece, not zoom the camera
- A way to double stack fluid tiles (which is as tall as one solid tile minus the cap)
- Hotkey setup
- More hotkeys
- Indicate which way piece is being shifted
- Conversion guide for which pieces could be substituted for other pieces, when converting map
- Convert current map to personal inventory
- Calculate which sets a map could be built with
- Output virtualscape file (needs mappings, and refactor of VS file input code)
- Adjustable lights: color, intensity, persisted position
- Add a Snow tree model
- Update laur jungle to official models
- Import new figure-as-terrain pieces from VirtualScape (needs mappings)
- Add Arena of the Planeswalker terrain (Shandalar water and sand boards, as well as the Shandalar ruins A/B)
- Allow cycling through sizes for similar terrains, just like how land pieces do. Like outcrops, hotkey 1,2,3 for their sizes
- Land tile size select: Hotkeys 1, 2, 3, 4, 5 could always map to sizes 1, 2, 3, 7, 24
- Move all pieces up or down a level (requires new boardHexes/validation todo to be done)
- Customizeable Colors: PDF/SVG & 3D


## Suggestion TODOs
- Remove the white from the glyphs. Additionally, don't display hex heights above glyphs making it easier to label the glyphs online [link to comment](https://discord.com/channels/212408450750218244/1433872869040980059/1495569069338923098)


## PDF Build Instructions
- Ladder Summaries
- PDF Add a map Legend for all the pieces that are in the map
- Fortress Banner (see GaryLASQ site)

## 3D Models
- Winter trees
- New evergreen trees
- Refine Laur Ruin1 (redo)
- Laur Ruin2 Ruin3
- Refine Marvel
- Fortress Banner
- Refine Laur Palm Leaves
- Refine Ticalla Palm Leaves


## Home Page
Cartographers => Maps Gallery
New => Editor
Load => Editor
About => Info

## 2D SVG Builder
Building pretty much exactly like you did in Virtualscape.

## Local Storage Load/Save/Edit maps

Make a react component that can be shown in the modal like `CreateMapFormDialog.tsx`. The new component is for the user to save and load maps from local storage. They can also edit their local storage, to peruse and delete maps or other unused data stored in local storage. Some user settings may get saved there, and can be exported to a file/string and imported as easily.

When user clicks SAVE/LOAD, show:
    1. free space: KB unused capacity in local storage
    2. unavailable space: KB used capacity in local storage that is not a hexoscape map that can be saved or loaded
    3. map space: individual map objects of type MapFileState, their unique id can be their key, we can validate them with a function
        * SAVE => Select map to overwrite if there is an existing key that matches the id of the map being saved, or save as a new map key in local storage 
        * LOAD => Load selected map, user may select a map object from the list
        * EDIT => Delete button for items in local storage, the delete button changes its text and turns red to verify and requires one more click to actually delete.



We use BoardHexes state in files as follows:
<!-- 3D -->
- `MapDisplay3D.tsx` compute instanced caps, map dimensions, adjust clicked hex in onPointerUpPaintPiece
- `CastleArch.tsx`, `CastleWall.tsx` generate hex for click handler

- `MapBoardPiece.tsx` is underhex terrain fluid, for positioning of glyphs, laur pillars, startzones
- `PiecePreview.tsx` lookup hovered hex for ladder
- `HexCapHeightTextDisplay.tsx` is underhex terrain fluid, for positioning

- `World.tsx` map dimensions to position lights, axes helper
- `useApplyHotkeys.tsx` map dimensions for camera autozoom
- `ViewControlsTab.tsx` map dimensions for camera autozoom
<!-- SVG/PDF -->
- `SvgMapDisplay.tsx` compute svg dimensions 
- `PdfMap6LevelsPerPage.tsx` compute svg dimensions, calculates per level chunks 
- `ReactPdfSvgMapDisplay.tsx` renders chunks and boardhexes
- `ReactPdfRoot.tsx`  `ReactPdfDownloadLink.tsx` pass props
<!-- MISC -->
- `EditControlsTab.tsx` dev log