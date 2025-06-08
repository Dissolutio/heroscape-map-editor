## 2D SVG Builder
Building pretty much exactly like you did in Virtualscape. This will probably be a requirement.

## Build Instructions

Shapes and Patterns remaining: 

- Start Zones( as one layer)

- LaurWall Triangle
- LaurWall Arch
- LaurWall Ruins 2 & 3 (just different styles, slightly larger)

- Fortress Banner
- Wallwalk/Road decor
- Ladder Summaries
- Tree415 Boulders

Then need some formatting options (1pg, map key?), author name, maybe more.

## Home Page

Cartographers => Maps Gallery
New => Editor
Load => Editor
About => Info

## Controls

Several sub sections!!!

### Add Laur Wall Addons Etc
Can't even add laur addons right now!

### Restructure the controls completely
1. Build/Main
    * Undo/Redo
    * Pen Mode
    * Piece size
    * Piece rotation

2. Edit
    * change map name
    * alter map dimensions / shift pieces
    * **change piece inventory**

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

### Build & Editing Features

3. Fast Hex Swap on Mouseover: Middle mouse button while hovering over a hex to make it the new active hex to draw with.
4. Fast Rotate: SHIFT + mouse wheel to rotate whatever is in your hand.
Using the arrow keys to rotate is fine, but if my hand is on the left side of the keyboard using WASD to move around, I'd like the option for a quick rotate by holding shift and scrolling the mouse wheel so I don't have to move my left hand.

### Multi-Select & Copy/Paste  
1. Selection Tool: Add a selection tool at the bottom. Functionally, you would click the selection tool, then click multiple hexes to highlight them. Then click the copy button. It would place in your hand what you just copied and then you can left click to place it in the world. Might need a reset button for when you are done copying to put one hex back in your hand.

<!-- END ##Controls -->

## Map Build constraints **NEW**
You can add them to a map, it **Becomes part of MapFileState**.
It specifies id and quantity array of sets used, and of any piece-meal added items.

You can remove them. They are removed from MapFileState.

## Local Storage Load/Save/Edit maps

Make a react component that can be shown in the modal like `CreateMapFormDialog.tsx`. The new component is for the user to save and load maps from local storage. They can also edit their local storage, to peruse and delete maps or other unused data stored in local storage. Some user settings may get saved there, and can be exported to a file/string and imported as easily.


When user clicks SAVE/LOAD, show:
    1. free space: KB unused capacity in local storage
    2. unavailable space: KB used capacity in local storage that is not a hexoscape map that can be saved or loaded
    3. map space: individual map objects of type MapFileState, their unique id can be their key, we can validate them with a function
        * SAVE => Select map to overwrite if there is an existing key that matches the id of the map being saved, or save as a new map key in local storage 
        * LOAD => Load selected map, user may select a map object from the list
        * EDIT => Delete button for items in local storage, the delete button changes its text and turns red to verify and requires one more click to actually delete.

## 3D Models
Marvel ruin buildout.
All Jungle is pretty bad.
Fortress Banner.
Winter trees?
New Laur Ruin2 Ruin3 ShortWallStacker LongWallStacker ArchStacker PillarStacker TrianglePillar
Laur Ruin1 redux

## Map Notes

Can be added to build instructions, and **added to MapFileState**.


## UI/ Settings
Customizable Hotkeys, Colors
Toggle Renegade style
Toggle other ETC ...