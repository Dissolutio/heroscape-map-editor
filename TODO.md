## TODO
- New PDF Format: Cover Sheet with inventory on 1st page
- Marvel Ruin Wall Destroyed: placing it removes some caps that are walkable, removes Hex Height display for OHS-view
- Update conflicted states for ship pieces (account for level 0)
- Map inventory and available terrain should be always visible. Not in separate modal.
- Malfunctioning on Edge, Firefox, and maybe Samsung 8.
- When no color outlines for land pieces, we must distinguish between Asphalt and Shadow better ( maybe blue outlines for fluid tiles?)
- Personal Inventory: a form to adjust your exact piece inventory, with "add set" buttons and all available sets for easy entry, and also per-piece adjustments for entry of counts that do not conform to just set inventories (pieces break, old expansions included amounts of terrain)
- Objective markers that you can adjust the labels for (example, the start positions of specific figures in Renegade web scenarios)
- New piece: Exit spaces, or some kind of other generalized hex marker that isn't a start zone or an objective, to match current Renegade web scenarios
- OHS (Online Heroscape) pictures: Remove the white from the glyphs. Additionally, don't display hex heights above glyphs making it easier to label the glyphs online
- OHS: Add a toggle that invokes all the desired settings to get a good image for OHS (semi transparency to palm leaves, more compatible glyph spaces, don't display table, perhaps even display overhung sections on the side as a separate section)
- Display inventory usage info in pen mode selector (so you can select one that is available easily)
- Ancient terrain in 3D should have darker brown color
- Hexagon shaped maps should produce a map with same side-length as map size (1 smaller than current)
- StartZones should not have a vertical clearance, should not be blocked by vertical clearance of obstacles (so they can be placed adjacent to ruins/fortified-walls)
- Middle click a piece to make it the pen mode
- In View Map Inventory dialog, clicking a terrain from the list selects it for Pen Mode
<!-- LESS IMPORTANT BELOW -->
- Onion Skin 3D mode: Current viewing level opacity is 1, but pieces on other levels will go down by distance from viewing level ( to make building from instructions easier, maybe other use cases also)
<!-- - Format painter (set as grass, then click land pieces to convert them to grass) -->
- Outcrop bases into inventory (when you use a 3-hex rock outcrop and your terrain constraints are using Battle for the Underdark, a 3-hex shadow with holes should be "used up", and if your terrain constraints are using a Caverns of Valhalla, 3 1-hex shadows with holes should be "used up" -- these "with holes" piece variations do not exist yet)
- Hotkey setup: let users edit which key combinations (from the possible combinations)  with which app actions
- More hotkeys: add more app actions, all available terrains, etc. so that more hotkeys are available
- Adjustable lights: color, intensity, persisted position, light types, etc. 
- Allow cycling through sizes for similar terrains, just like how land pieces do. For example rock outcrops, hotkeyd 1 & 3 for their sizes
- Land tile size select: Hotkeys 1, 2, 3, 4, 5 should always map to sizes 1, 2, 3, 7, 24, put special sizes on hotkeys 6+
## PDF/SVG TODO
- PDF/SVG level logo from Renegade publications (just looks nicer and more official)
- PDF/SVG overlay level options parity
- PDF: way to add multiple Sets Used list
- PDF style parity with SVG (sublevel less-saturated-colors)
- PDF style option: disable land tile piece outline colors (make black)
- PDF style option: disable hexgrid lines over sub-levels
- PDF style option: use original Virtualscape colors
- PDF 2 column format
- PDF portrait as level format (6 levels per page, first level slot would be the map image)
- Ladder Summaries (in overlay layer, maybe display ladders with total number of ladder pieces they include)
- PDF Add a map Legend for all the pieces that are in the map

## Big TODO
- A major UI overhaul, as it becomes apparent what items need to be surfaced to always viewable, and what can be hidden away in a menu or dialog (i.e. current pen mode, viewing level, and piece errors probably need to be always visible)
- Pieces with conflicts need improved visibility
- When piece preview is active, scrolling should rotate the piece, not zoom the camera
- A way to double stack (or even beyond) fluid tiles (which is as tall as one solid tile minus the cap) in any combination.
- Convert current map to fit personal inventory and conversion guide for which pieces could be substituted for other pieces, when converting map
- Calculate which sets a map could be built with
- Output virtualscape file (needs mappings, and refactor of VS file input code)
- Import new figure-as-terrain pieces from VirtualScape (needs mappings)
- Add Arena of the Planeswalker terrain (Shandalar water and sand boards, as well as the Shandalar ruins A/B)
- Customizeable Colors: PDF/SVG & 3D
- Add copy/paste and templates: Be able to multi-select a group of pieces, and copy/paste it to another spot on your map. Also, to be able to save a conglomeration of pieces as a template to be re-used in other maps (the bilateral symmetry templates are a good candidate here as presets)
- Add Lighting Glow-in-the-dark of toxic tiles and shroudshroom pieces
- A tutorial of some kind
- A general FAQ/help page with links and buttons that help users find and access features (maybe do this after a UI overhaul)

## Blender TODO
- Road tiles need their own textured/complex cap for 3D high quality render
- Wood tiles need their own textured/complex-geometry cap for 3D high quality render
- All solid land tiles need textures to avoid the geometry-induced jank of current high-quality render mode
- Refine Laur Ruin1 3D model (redo)
- Make Laur Ruin2 Ruin3 models
- Refine Marvel (thicker, add texture image)
- Fortress Banner (3D model and svg -- see GaryLASQ site maps for svg idea)
- Contemporary evergreen trees
- Update Winter trees with more realistic model
- Refine Laur Palm Leaves
- Refine Ticalla Palm Leaves

## DOWNRIVER TODO
### New Home Page TODO
Cartographers => Maps Gallery (database of some kind?)
New => Editor
Load => Editor
About => Info/Tutorial

### 2D SVG Builder TODO
Building pretty much exactly like you did in Virtualscape.

### Database TODO
A database, so users can sign in and share maps with a shorter URL, and save maps and browse maps and find maps and select groups of maps and see the total terrain, or select a map group based off of available terrain etc. Still has to be free for everyone, so holding off as long as possible (estimated $20-40/month cost at estimated usage in 1 year, up to maybe $100/month if map creation and Heroscape player-count skyrocket over several years, no clue if this is possible or likely)

### GAME TODO
The original project was a way to play a game of heroscape against my buddy in the browser. So, eventually, this is the dream. What does it need? Well:
1. A breakdown of all the unit powers (card abilities, whatever you wanna call it) into categories. Some are explicit, after moving and before attacking, before taking a turn with, after rolling initiative, etc. These are very handy triggers when it comes to coding up abilities. Other categories include what they do, like buff defense or attack, buff starting move for adjacent figures, buff re-rolls of dice during attack or defense, debuff move when engaged, etc. The idea is to get as many abilities grouped together, with minimal outliers, such that coding up the exceptions to game state for these abilities can be batched, and even modified. For example, some characters have Double Attack. This ability could be generalized as Multi-Attack, with an input of "How Many Attacks", and now it can accomodate Triple Attack etc.