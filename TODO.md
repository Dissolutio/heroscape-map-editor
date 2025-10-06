## Move/rotate/switch pieces BIG REFACTOR to boardPiece render
THIS IS THE BIG REFACTOR: Mixed up validation in addPiece, which should just place the piece if able, then a validator runs in the background
1. Move, rotate, switch pieces that are on the board already

## BowTie Jones requests
- Indicate which way piece is being shifted
- Format painter
- PDF 2 column format
- PDF portrait as level format
- Select existing piece as pen mode


## What are BoardHexes used for
- MapDisplay3D => empty/fluid/solid caps, => render pieces
- MapHex3D => underHexTerrain
- ReactPdfDownloadLink / ReactPdfRoot => PdfMapLevels6PerPage => ReactPdfSvgMapDisplay => render
- CastleArch: calculate clicked hex
- useZoomCameraToMapCenter: width/height of map
- World: width/height of map
- Controls: log state

## Separation of State (pieces) / Validation
- Validation through BoardHexes, but render through BoardPieces
- Add/Remove Piece will add to BoardPieces.
- Top-level (HomePage) will call Service Worker to recalculate BoardHexes, when BoardPieces changes.

1. Land / EZ/Based Obstacles
2. Laur Addons / Castle Walls / Wall Walk / Ladder

## Build constraints and Inventory **NEW**
You can add them to a map, it becomes part of  **HexMap**.
It is an array of Set IDS.
User must choose appropriate sets, it doesn't calculate # sets used.
Display pieces used / left.

## PDF Build Instructions

Shapes and Patterns remaining: 

- Start Zones( as one layer)
- LaurWall Arch
- LaurWall Ruins 2 & 3 (just different styles, slightly larger)
- Wallwalk/Road decor

- Ladder Summaries
- Map Key(see LeftOn4Ya's ultimate key, Renegade key, and old Hasbro key)
- Fortress Banner (see GaryLASQ site)
- Tree415 Boulders? (see GaryLASQ site, or old Hasbro docs)

Then need some formatting options (1-pager, map key?), author name, maybe more.

## 3D Models
<!-- MAKE SOON -->
Winter trees
Laur Wall:
- Laur Ruin2 Ruin3
- Laur LongWallArchStacker
- Laur Ruin1 redux
- Laur ShortWallStacker 
- Laur LongWallStacker 
- Laur PillarStacker TrianglePillar check/build their stacked configuration
Fortress Banner

<!-- Refine -->
Refine Marvel
Refine Laur Palm Leaves
Refine Ticalla Palm Leaves

## Home Page
Cartographers => Maps Gallery
New => Editor
Load => Editor
About => Info

## 2D SVG Builder
Building pretty much exactly like you did in Virtualscape. This will probably be a requirement.

## Build & Editing Features

* Grab terrain as pen.
* Paint format as pen
* Quick rotate pieces somehow. 

## Multi-Select & Copy/Paste  
1. Selection Tool: Add a selection tool at the bottom. Functionally, you would click the selection tool, then click multiple hexes to highlight them. Then click the copy button. It would place in your hand what you just copied and then you can left click to place it in the world. Might need a reset button for when you are done copying to put one hex back in your hand.

## Local Storage Load/Save/Edit maps

Deleted the component for analyzing local storage space. `LocalStorageList.tsx`, check commits.

Make a react component that can be shown in the modal like `CreateMapFormDialog.tsx`. The new component is for the user to save and load maps from local storage. They can also edit their local storage, to peruse and delete maps or other unused data stored in local storage. Some user settings may get saved there, and can be exported to a file/string and imported as easily.

When user clicks SAVE/LOAD, show:
    1. free space: KB unused capacity in local storage
    2. unavailable space: KB used capacity in local storage that is not a hexoscape map that can be saved or loaded
    3. map space: individual map objects of type MapFileState, their unique id can be their key, we can validate them with a function
        * SAVE => Select map to overwrite if there is an existing key that matches the id of the map being saved, or save as a new map key in local storage 
        * LOAD => Load selected map, user may select a map object from the list
        * EDIT => Delete button for items in local storage, the delete button changes its text and turns red to verify and requires one more click to actually delete.


## Settings / Preferences
- Customizable Hotkeys,
- Customizeable Colors
- Toggle Renegade style