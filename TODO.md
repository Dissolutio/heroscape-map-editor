
3. Move, rotate, switch pieces that are on the board already

## Build constraints and Inventory **NEW**
You can add them to a map, it **Becomes part of MapFileState**.
It specifies id and quantity array of sets used, and of any piece-meal added items.
You can remove them. They are removed from MapFileState.


## PDF Build Instructions

Shapes and Patterns remaining: 

- Start Zones( as one layer)
- LaurWall Arch
- LaurWall Ruins 2 & 3 (just different styles, slightly larger)
- Wallwalk/Road decor

- Ladder Summaries
- Map Key(see LeftOn4Ya's ultimate key, Renegade key, and old Hasbro key)
- Fortress Banner (see GaryLASQ site)
- Tree415 Boulders (see GaryLASQ site, or old Hasbro docs)

Then need some formatting options (1-pager, map key?), author name, maybe more.

## 3D Models
<!-- MAKE SOON -->
Triple Cactus - Laur Underbrush
Lone Cactus - Laur Underbrush
Fortress Banner
FatLeaf - Laur Underbrush (6 leaves, 3 nodes, stem ends at last node, with wingspan and tilt it is the tallest plant)
Tri-Leaf - Laur Underbrush (8 leaves, 4 nodes, stem ends at last node, each leaf is like a small plant)
Winter trees
Laur Wall:
- Laur Ruin2 Ruin3
- Laur LongWallArchStacker
- Laur Ruin1 redux
- Laur ShortWallStacker 
- Laur LongWallStacker 
- Laur PillarStacker TrianglePillar check/build their stacked configuration

<!-- Refine -->
Refine Laur Palm Leaves
Refine Marvel
Refine Ticalla Palm Leaves


## Home Page
Cartographers => Maps Gallery
New => Editor
Load => Editor
About => Info

## 2D SVG Builder
Building pretty much exactly like you did in Virtualscape. This will probably be a requirement.

## Restructure the controls completely
1. Build/Main
    * Undo/Redo
    * Pen Mode
    * Piece size
    * Piece rotation

2. Edit
    * change map name
    * alter map dimensions / shift pieces
    * **change build constraints**
    * **change notes**

3. View
    * **Toggle Hexes show coords (cube, odd-R, letter-number like virtualscape, axial)**
    * **Toggle Hexes show altitude**
    * **Toggle BuildConstraints show In Map**
    * **Toggle BuildConstraints show Available**
    * Camera: Lock, Reset, Ortho, TakePicture
    * **Toggle Build Constraints display (pieces left & pieces used, counts and visuals)**

4. File
    * New Map (**Choose build constraints**)
    * Share Map URL
    * Export file
    * Load map
    * Save map
    * Save map as (copy map, new id, choose new name)

## Build & Editing Features

1. Middle mouse click or btn on selected piece readout, to grab that terrain as pen mode.
2. Show ghost piece on hover.
3. Quick rotate pieces somehow.
4. Keyboard move and rotate pieces.


## Multi-Select & Copy/Paste  
1. Selection Tool: Add a selection tool at the bottom. Functionally, you would click the selection tool, then click multiple hexes to highlight them. Then click the copy button. It would place in your hand what you just copied and then you can left click to place it in the world. Might need a reset button for when you are done copying to put one hex back in your hand.



## Local Storage Load/Save/Edit maps

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