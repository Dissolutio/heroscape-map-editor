## What are BoardHexes used for
- MapDisplay3D => empty/fluid/solid caps, => render pieces
- MapHex3D => underHexTerrain
- ReactPdfDownloadLink / ReactPdfRoot => PdfMapLevels6PerPage => ReactPdfSvgMapDisplay => render
- CastleArch: calculate clicked hex
- useZoomCameraToMapCenter: width/height of map
- World: width/height of map
- Controls: log state

## Obstacle bases
When adding an outcrop (lavarock, rock, or glacier), also add a base.
Check `setsUsed`, and choose the corresponding pieces. (Caverns of valhalla doesn't have shadow-3 bases for the triple outcrop, you combine 3 "modified" shadow-1 spaces)


## Separation of State (pieces) / Validation
- Validation through BoardHexes, but render through BoardPieces
- use worker?: HomePage calls Service Worker to recalculate BoardHexes, when BoardPieces changes.

1. Land / EZ/Based Obstacles
2. Laur Addons / Ruins / Ladders / Battlements / RoadWalls / 

## Bow Tie requests
- Indicate which way piece is being shifted
- Format painter
- Select existing piece as pen mode
- PDF 2 column format
- PDF portrait as level format

## Obstacle bases
When adding an outcrop (lavarock, rock, or glacier), also add a base.
Check `setsUsed`, and choose the corresponding pieces. (Caverns of valhalla doesn't have shadow-3 bases for the triple outcrop, you combine 3 "modified" shadow-1 spaces)

## PDF Build Instructions
- Start Zones( as one layer)
- Piece count as toggleable section
- LaurWall Arch pdf/svg shape
- LaurWall Ruins 2 & 3 pdf/svg shape
- Wallwalk/Road pdf/svg decor

- Ladder Summaries
- Map Key(see LeftOn4Ya's ultimate key, Renegade key, and old Hasbro key)
- Fortress Banner (see GaryLASQ site)
- Tree415 Boulders? (see GaryLASQ site, or old Hasbro docs)

Then need some formatting options (1-pager, map key?), author name, maybe more.

## 3D Models
- Winter trees
- Toxic tiles
- New evergreen trees
- Refine Laur Ruin1 (redo)
- Laur Ruin2 Ruin3
- Refine Marvel
- Fortress Banner
- Refine Laur Palm Leaves
- Refine Ticalla Palm Leaves


## Home Page
Map/Authors Gallery
New => Editor
Load => Editor
About => Info

## 2D SVG Builder
Building pretty much exactly like you did in Virtualscape.

## Build & Editing Features

* Grab terrain as pen.
* Paint format as pen
* Quick rotate pieces somehow. 

## Multi-Select & Copy/Paste  
- Multi-select pieces

## Local Storage Load/Save/Edit maps
Old component for local storage space: `LocalStorageList.tsx`, check commits.

A dialog to save, load, edit maps from local storage. 
User settings could be exported.

## Settings / Preferences
- Customizable Hotkeys
- Customizeable Colors
- Toggle Renegade style

## Update Inventories for Pieces with Variations (Marvel Ruin, Castle Arch)
- Marvel ruin counts once in inventories, but has 4 variations
- Castle arch counts once in inventories, but has 2 variations