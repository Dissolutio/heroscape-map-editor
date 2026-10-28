## RECENT TODOS
1. Generic piece type with the normal sizes: 1,2,3,7,24. One solid, one fluid. User can designate the colors for the subterrain and cap. Or the sides and cap, with the upcoming textures upgrade.
2. We need Laur Ruins 2/3 from RaLE. We need models and we need pen modes, and we need SVG render to distinguish
3. lighten sub-level shadow color
4. Adopt a treasure glyph color for contemporary SVG display
5. Add marker to Ancient Shroudshroom to denote orientation


## QUICK FIXES AND POLISH (noted 2026-10-25 while hand-testing; small, mostly independent)
- Asphalt border color: when the PDF/SVG color outlines are turned off, solid land gets black borders and fluid land blue borders, so a field of Asphalt tiles (black) cannot be told apart. Use a gray border for Asphalt tiles when color borders are off (SVG and PDF, shared helper).
- Wheel-rotate hint snackbar: only show "Scroll the mouse wheel to rotate while you drag." for drags where the wheel works. Ladders (sector rule), Laur add-ons and a lone battlement/road wall/rope ladder ignore the wheel, so no hint for those (`shouldRotateDragWithWheel` already knows; decide in `showWheelHint`, and consider showing it the first time a wheel-capable piece is dragged instead of the first drag of any piece).
- Move the long text under "Generic Piece Colors" into a tooltip on the field label: "Cap colors also drive SVG/PDF; 2D sub-level shades are derived automatically. Side colors affect only 3D."
- Move the long text under "Show Buried Tile Marks" into a tooltip: "* = the top of this tile will be covered. † = its sides will be covered. Both = fully hidden, so any piece of the same size and kind (solid for solid, fluid for fluid) works."
- View Controls tab: only show the camera options (zoom to map, lock camera, reset camera, orthographic toggle, take map picture, camera hotkeys) in the 3D view.
- Create New Map dialog: offer the same fields as Edit Map Details (author was missing), except maybe the picture. Optionally remember the author name in local storage if the user wants.
- Rotate hotkeys (the two rotate-piece keys): work whenever a piece is selected in select pen mode, not only while hovering a hex, and also while click-dragging (for ladders and other pointer-controlled rotations the key still applies until the pointer next moves and the sector rule takes over again).
- Map picture crop flow: crop and submit should be one step; show clearly what is cropped in and out and do not discard the cropped-off part, so the crop can be readjusted; offer the crop right after taking a map picture (like checking a photo on a camera's screen).
- Navbar view-mode buttons: the 2D/3D icon buttons swap one way, the PDF button does not switch at all. Redesign this small state machine so it is clear (for example a single segmented control: 3D / 2D / PDF with the active one highlighted).

## SELECTION (design these together)
- Clicking an empty hex should deselect the current selection, like clicking the canvas background. Held back until selection history exists (below), because it makes an accidental deselect more likely.
- Separate undo/redo history for the selection itself, so assembling a big selection and accidentally deselecting it does not mean reselecting piece by piece, and so individual piece selections do not pollute the map's undo/redo. Build it together with selection-expanding tools (a right-click context menu: select same piece type, select connected, select level, invert, and so on) and with empty-hex deselect. Design note for the PM: needs its own hotkeys (for example Ctrl+Shift+Z for selection undo, or Alt+Z) that do not collide with map undo, and a decision on whether map undo should also restore selection (it does today for deletes, see `undoWithSelectionRestore`).

## TODO
- Group LoS blockers such as trees/outcrops/similar so that they can be rotated through like regular terrain (how land types can toggle their size using hotkeys "1" - "7"). For example once an outcrop piece is chosen as the pen mode, then the hotkeys are 1 for 1-hex outcrop, 3 for 3-hex outcrop, etc.
- Remove the white from the glyphs. Additionally, don't display hex heights above glyphs (making it easier to label the glyphs online). This is for when a user wants to make an OHS map, which is a top down view of a map for playing online heroscape on. Glyph spaces normally get edited at a later step and so less stuff displaying on those hexes would be nice.
- If you enter some filters and search into Pieces Grid, then Zoom to Piece, all those filters and search are lost. State should persist?
- The "Zoom to Piece" opacity effects that we have for pieces and caps is broken. We should just remove it, and if we want to build a more robust system for controlling each level's opacity in the future, we will.
- Laur wall ruin pieces have 3 types, not accounted for currently (or miscounted, perhaps). We do not have 3D models for the 2 new types yet, but we will. Currently, we only have a way to play 1 type, so any display we have regarding more than 1 type is kind of confusing and misleading.
- Update conflicted states for ship pieces (account for level 0). This will require a physical testing with the terrain pieces.
- OHS: Add a toggle that invokes all the desired settings to get a good image for OHS, like: 1. semi transparency to jungle palm leaves portion of jungle meshes because they obscure adjacent hexes 2. more compatible glyph spaces (glyph spaces often have another OHS picture of a glyph put over them in an OHS match, so less crap displaying in those hexes is nice) 3. don't display the 3D table under the map (which is already a toggleable option for the user)
- In View Map Inventory dialog, clicking a terrain from the list selects it for Pen Mode
- Outcrop bases into inventory (when you use a 3-hex rock outcrop and your terrain constraints are using Battle for the Underdark, a 3-hex shadow with holes should be "used up", and if your terrain constraints are using a Caverns of Valhalla, 3 1-hex shadows with holes should be "used up" -- these "with holes" piece variations do not exist yet)
## Hotkeys
- Hotkey setup: let users edit which key combinations (from the possible combinations)  with which app actions, and save that to local state, and enable them to download their hotkey config file, or upload a hotkey config file.
- More hotkeys: add more app actions, all available terrains, etc. so that more hotkeys are available, and more actions in the app that are high-use have a hotkey (opening the inventory dialog, a button to convert and then the next hotkey combo pressed will be the terrain that we are converting to, or perhaps a key to cycle it through the terrains that still have that size available)
- Allow cycling through sizes for similar terrains, just like how land pieces do. For example rock outcrops, hotkeyd 1 & 3 for their sizes

## PDF/SVG TODO
- PDF style parity with SVG (sublevels using colors that are just 0.5 opacity versions of their current level counterparts, against a white background, instead of using actual opacity and white backer shapes in PDF render)
- PDF style option: use original Virtualscape colors and styles (this cannot be complete yet until all previous styles are copied to svg)
- Some classic piece shapes are not scale-friendly in SVG (as was desired for SVG export for Adobe Illustrator), ie marvel ruin, hive, etc.
- Ladder Summaries (in overlay layer, maybe display ladders with total number of ladder pieces they include) (castle ladders are stacked on top of eachother when they are used, unless they are placed alone, which sometimes happens). On the overlay layer, we could put a pdf/svg multihex-1 shape, with a ladder shape inside of that, with a number over that of how many ladder pieces are stacked on that coordinate. We must account for that fact that multiple ladders could theoretically be longer than 1 piece and on the same coordinate but not connected to eachother. That would be a very labrynthine map but it is possible, and in that case, we should display everything the same but the numbers for the counts will display like "X/Y/Z" instead of "X" when there is multiple ladders in the same hex.
- PDF Add a map Legend for all the pieces that are in the map. A grid, with the land terrains first, then obstacles, then abstract/gameplay pieces. Just the symbols, with some words defining, in a concise grid, and condensed to just the pieces that are in the current map.

## Big TODO (these potentially need refinement, research, maybe big code changes)
- A major UI overhaul, as it becomes apparent what items need to be surfaced to always viewable, and what can be hidden away in a menu or dialog (i.e. current pen mode, viewing level, and piece errors probably need to be always visible)
- Map inventory and available terrain should be always visible. Not in separate modal. Or maybe another box that floats over the 3D Canvas and can be shrunk or expanded, and shows the inventory dialog's info in a more condensed format.
- Display inventory usage info in pen mode selector (so you can select one that is available easily). When you click the pen mode selector, a visual cue showing you what is available would be helpful.
- Pieces with conflicts need improved visibility, maybe a conflict lens that shows you all pieces that are conflicting, and especially highlights where multiple pieces are conflicting, perhaps like a heat map.
- When piece preview is active (because you are hovering a place where you can build and your pen mode is loaded with something you can build), scrolling should rotate the piece, not zoom the camera. We would have to pause the camera and then switch to letting the mousewheel change our piece rotation.
- A way to double stack (or even beyond) fluid tiles (which is as tall as one solid tile minus the cap) in any combination. Many map makers (users) do this as a way to add support to pieces eventhough they intend to hide it (technically, the rules do not allow stacking half-height or fluid tiles, but it is a very handy building technique to get the most out of your available tiles). Multi-stacked fluid tiles would also need a strategy for how to illustrate them in the SVG/PDF view. And how to handle, potentially, stacking them beyond just 2. This would require some physical testing, to see if a small difference in heights would result in the fluid tiles obviously being less than half-height of their adjacent solid tiles.
- Convert current map to fit personal inventory and conversion guide for which pieces could be substituted for other pieces, perhaps an auto-convert button.
- Calculate which sets a map could be built with
- When multiple pieces are selected that together are the exact shape of a larger piece, we should offer the option to combine the pieces into becoming that larger piece, and prompt the user what terrain the new piece should be. Often when building, a map maker will desire to use up big pieces and free up smaller ones.
- Output virtualscape file (needs mappings from new pieces to the new-piece-hacks that the community has been making lately, and refactor of VS file input code)
- Import new figure-as-terrain pieces from VirtualScape (needs mappings): The community made hacks could be accepted in map files, and converted so that the terrain pieces the user intended to place are the ones that show up in our app when they load their map file.
- Add new pieces: Arena of the Planeswalker terrain (Shandalar water and sand boards, as well as the Shandalar ruins A/B)
- Customizeable Colors: PDF/SVG & 3D: It could be cool to allow the user to customize all the colors in the app, or perhaps to be able to create personal tiles, they could follow the current templates, for example they can make a solid or fluid terrain, add whatever sizes they want, and selected a color for the subterrain (and later maybe they can add texture images, once we get that going) and a color for the cap, and a color for the fill of the SVG/PDF shape for their new terrain.
- Add copy/paste and templates: Be able to multi-select a group of pieces, and copy/paste it to another spot on your map. Also, to be able to save a conglomeration of pieces as a template to be re-used in other maps, saved in local storage. Maybe a UI to edit which exact hex coordinate in the template will be its origin hex.
- If we add templates (collections of pieces that you can copy/paste), then we should add a library of helpful templates, to include the bilateral symmetry templates from heroscapers
- Add Lighting Glow-in-the-dark of toxic tiles and shroudshroom pieces, or an option to enable it, since they are glow-in-the-dark in real life.
- A tutorial of some kind, to teach users where everything is, how to use the app (maybe do this after a UI overhaul)
- A general FAQ/help page with links and buttons that help users find and access features (maybe do this after a UI overhaul)
- Adjustable lights: color, intensity, persisted position after they move them with TransformControls, light types, etc. 
- Make a homepage that will replace our current home page. Instead of us dropping the user straight into the 3D editor, we will help guide them to where they want to go:
  * Maps Gallery (database of some kind, or just official maps JSON files?)
  * Create New Map => Editor
  * Load Map => Editor
  * About => Info/Tutorial
  * Download Desktop App => Just like README, offer the downloads from the releases page
  
- Shareable map image URL (idea, 2026-10-25): users already share a link to a map with the PDF view open in the app, so they no longer need to host build instructions on Drive or Dropbox. Next wish: a URL that returns an IMAGE of the map (optionally with camera angle properties) that can be used as an image source on heroscape.org, so people stop hosting two files per map. Feasibility notes: the app is a static client app, so an image URL needs a small server-side piece. The 2D SVG could be produced by a serverless function if the SVG renderer runs under Node; the 3D view needs WebGL, so it would take a headless-browser render (for example Playwright/Chromium on a small container, or a managed browser-rendering service), with caching and abuse limits. Maps travel in the share link, so very large maps may exceed URL length limits; a database with short map ids would remove that limit (see Database). Research and cost first.
- Background color for the 3D view (user setting), or the Drei Stars component as a background option.

## Blender TODO
- Road tiles need their own textured/complex cap for 3D high quality render
- Wood tiles need their own textured/complex-geometry cap for 3D high quality render
- All solid land tiles need textures to avoid the geometry-induced jank of current high-quality render mode
- Refine Laur Ruin1 3D model (redo, it is sloppy)
- Make Laur Ruin2 Ruin3 models, none exist yet

### 2D SVG Builder
Currently the 2D view is only good for exporting SVG images of the map. We need to add functionality to this SVG based view. Zooming in and out. Selecting pieces, rotating them, converting their terrain, everything you can do in the 3D view, maybe even more.

### Database
A database, so users can sign in and share maps with a shorter URL, and save maps and browse maps and find maps and select groups of maps and see the total terrain, or select a map group based off of available terrain etc. Still has to be free for everyone, so holding off as long as possible (estimated $20-40/month cost at estimated usage in 1 year, up to maybe $100/month if map creation and Heroscape player-count skyrocket over several years, no clue if this is possible or likely)