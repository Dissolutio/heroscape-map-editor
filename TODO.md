## General TODO
- Objective markers that you can adjust the labels for (example, the start positions of specific figures in Renegade web scenarios)
- New piece: Exit spaces, or some kind of other generalized hex marker that isn't a start zone or an objective, to match current Renegade web scenarios
- Ability to build Ruins at Laur's Edge pieces on top of corresponding Laur Wall pieces (pillars/long walls can stack etc.)
- For OHS pictures: Remove the white from the glyphs. Additionally, don't display hex heights above glyphs making it easier to label the glyphs online
- Display inventory usage info in pen mode selector
- Road tiles need their own textured/complex cap for 3D high quality render
- Wood tiles need their own textured/complex-geometry cap for 3D high quality render
- All solid land tiles need textures to avoid the geometry-induced jank of current high-quality render mode
- Ancient terrain in 3D should have darker brown color
- Hexagon shaped maps should produce a map with same side-length as map size (1 smaller than current)
- StartZones should not have a vertical clearance, should not be blocked by vertical clearance of obstacles (so they can be placed adjacent to ruins/fortified-walls)
- Middle click a piece to make it the pen mode
- In View Map Inventory dialog, clicking a terrain from the list selects it for Pen Mode
- Format painter (set as grass, then click land pieces to convert them to grass)
- Outcrop bases into inventory (when you use a 3-hex rock outcrop and your terrain constraints are using Battle for the Underdark, a 3-hex shadow with holes should be "used up", and if your terrain constraints are using a Caverns of Valhalla, 3 1-hex shadows with holes should be "used up" -- these "with holes" piece variations do not exist yet)
- Personal Inventory: a form to adjust your exact piece inventory, with "add set" buttons and all available sets for easy entry, and also per-piece adjustments for entry of counts that do not conform to just set inventories (pieces break, old expansions included amounts of terrain)
- When piece preview is active, scrolling should rotate the piece, not zoom the camera
- A way to double stack (or even beyond) fluid tiles (which is as tall as one solid tile minus the cap) in any combination.
- Hotkey setup: let users edit which key combinations (from the possible combinations)  with which app actions
- More hotkeys: add more app actions, all available terrains, etc. so that more hotkeys are available
- Convert current map to fit personal inventory and conversion guide for which pieces could be substituted for other pieces, when converting map
- Calculate which sets a map could be built with
- Output virtualscape file (needs mappings, and refactor of VS file input code)
- Adjustable lights: color, intensity, persisted position, light types, etc. (enable glow-in-the-dark of toxic/shroudshroom tiles)
- Import new figure-as-terrain pieces from VirtualScape (needs mappings)
- Add Arena of the Planeswalker terrain (Shandalar water and sand boards, as well as the Shandalar ruins A/B)
- Allow cycling through sizes for similar terrains, just like how land pieces do. For example rock outcrops, hotkeyd 1 & 3 for their sizes
- Land tile size select: Hotkeys 1, 2, 3, 4, 5 should always map to sizes 1, 2, 3, 7, 24, put special sizes on hotkeys 6+
- Customizeable Colors: PDF/SVG & 3D
- A major UI overhaul, as it becomes apparent what items need to be surfaced to always viewable, and what can be hidden away in a menu or dialog (i.e. current pen mode, viewing level, and piece errors probably need to be always visible)

## INFO TODO
- A tutorial of some kind
- A general FAQ/help page with links and buttons that help users find and access features (maybe do this after a UI overhaul)

## PDF/SVG TODO
- PDF/SVG level logo from Renegade publications (just looks nicer and more official)
- PDF/SVG option to show overlay pieces on own level
- PDF: way to add multiple Sets Used list
- PDF option to enable overlay layer
- PDF styles update to match SVG (sub terrain less-saturated-colors)
- PDF style option: disable land tile piece outline colors (make black)
- PDF style option: disable hexgrid lines over sub-levels
- PDF style option: use original Virtualscape colors
- PDF 2 column format
- PDF portrait as level format (6 levels per page, first level slot would be the map image)
- Ladder Summaries (in overlay layer, maybe display ladders with total number of ladder pieces they include)
- PDF Add a map Legend for all the pieces that are in the map

## Models TODO
- Make top section of Laur Long Walls and Arch skinnier, so it fits inside of the bottom (for stackability)
- Clickable section to build terrain on ship walls/bow
- Winter trees
- New evergreen trees
- Refine Laur Ruin1 3D model (redo)
- Make Laur Ruin2 Ruin3 models
- Refine Marvel (thicker, add texture image)
- Fortress Banner (3D model and svg -- see GaryLASQ site maps for svg idea)
- Refine Laur Palm Leaves
- Refine Ticalla Palm Leaves

## New Home Page TODO
Cartographers => Maps Gallery
New => Editor
Load => Editor
About => Info/Tutorial

## 2D SVG Builder TODO
Building pretty much exactly like you did in Virtualscape.

## Database TODO
A database, so users can sign in and share maps with a shorter URL, and save maps and browse maps and find maps and select groups of maps and see the total terrain etc. Still has to be free for everyone, so hold out on this one as long as possible ($$$)

## Local Storage Load/Save/Edit maps

Make a react component that can be shown in the modal like `CreateMapFormDialog.tsx`. The new component is for the user to save and load maps from local storage. They can also edit their local storage, to peruse and delete maps or other unused data stored in local storage. Some user settings may get saved there, and can be exported to a file/string and imported as easily.

When user clicks SAVE/LOAD, show:
    1. free space: KB unused capacity in local storage
    2. unavailable space: KB used capacity in local storage that is not a hexoscape map that can be saved or loaded
    3. map space: individual map objects of type MapFileState, their unique id can be their key, we can validate them with a function
        * SAVE => Select map to overwrite if there is an existing key that matches the id of the map being saved, or save as a new map key in local storage 
        * LOAD => Load selected map, user may select a map object from the list
        * EDIT => Delete button for items in local storage, the delete button changes its text and turns red to verify and requires one more click to actually delete.
