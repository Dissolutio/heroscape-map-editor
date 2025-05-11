# Heroscape Map Editor

This project is a Heroscape map editor built with React, TypeScript, and Vite. It allows users to create and edit Heroscape terrain maps using a web-based interface.

## Table of Contents

- [Getting Started](#getting-started)
- [Libraries Used](#libraries-used)
- [Blender Models](#blender-models)
- [Quick Overview of How It Works](#quick-overview-of-how-it-works)
- [Scripts](#scripts)
- [App Requirements: What this editor intends to fulfill, eventually](./app-requirements.md)
- [Vite Template: The README.md that was included by the initial Vite Typescript template](./vite-template-README.md)

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/Dissolutio/heroscape-map-editor.git
    cd heroscape-map-editor
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Start the development server:
    ```sh
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173` to see the application in action.

## Scripts

The following scripts are available in the project:

- `dev`: Starts the development server with Vite.
- `format`: Formats the code using Prettier.
- `build`: Builds the project using TypeScript and Vite.
- `lint`: Lints the code using ESLint and fixes any issues.
- `preview`: Previews the production build using Vite.

To run any of these scripts, use the following command:
```sh
npm run <script-name>
```

## Libraries Used

This project utilizes several libraries to provide a rich development experience and 3D features:

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite**: A fast build tool and development server.
- **@emotion/react** and **@emotion/styled**: Libraries for writing CSS styles with JavaScript.
- **@mui/material**: A popular React UI framework.
- **@react-three/drei** and **@react-three/fiber**: Libraries for working with Three.js in React.
- **@sentry/react**: A library for error tracking and monitoring.
- **immer**: A library for working with immutable state.
- **jsoncrush**: A library for compressing JSON data. (to keep as many maps as possible within the URL-shareable length of ~2000 characters)
- **lodash**: A utility library for JavaScript. (included by React, so is "free")
- **nanoid**: A library for generating unique IDs. (to keep mapID's unique, in case they one day become cloud-storable)
- **notistack**: A library for displaying snackbars (feedback/notifications when something is successful or errors) in React.
- **papaparse**: A library for parsing CSV (and TSV etc) files, used for loading non-standard piece inventories.
- **react-hotkeys-hook**: A library for handling keyboard shortcuts in React.
- **react-icons**: A library for including popular icons in React.
- **wouter**: A minimalistic routing library for React.
- **zundo**: A library for managing undo/redo functionality.
- **zustand**: A small, fast, and scalable state-management library. (included by react-three/fiber so is "free"; it is also awesome)

## Blender Models
All models used in the app are maintained in a blender file that you are welcome to access here: https://drive.google.com/file/d/1LY0ZwMMO2QvL_fQ9Ua4d-PpvixZn4XFQ/view?usp=sharing

## Quick Overview of How It Works

So you have your [hex-grid and various coordinate systems](https://www.redblobgames.com/grids/hexagons/#coordinates).
Virtualscape exports tiles with an X and Y value, and uses Odd-R offset coordinates.

The app converts pieces/tiles to hexes. The hexes are used for validation.
For instance, if a tree piece is placed at one coordinate, then it occupies a certain number of hexes above that as vertical clearance.


### Blender to .glb Export

Blender is used to create 3D models of the terrain pieces. These models are then exported as `.glb` files, which is a binary format for glTF (GL Transmission Format) files. The `.glb` files are imported into the application and rendered at specific hex positions using the `@react-three/fiber` library.

### Piece IDs and Heroscape Map Storage

Each piece in the application is assigned an ID built from its altitude, Q-cube-coordinate, R-cube-coordinate, rotation (1-6, at 0.5 intervals), and its (Heroscape) Inventory ID. (There might be future hex games, with different pieces.)
These 5 strings are separated by a "~" which is a URL valid character.

The Inventory ID uniquely identifies a piece, and this app includes piece data for Heroscape pieces.
Piece data includes the terrain type, the hex-count, whether it is an obstacle, what template of hexes does it use if it is a multi-hex land tile, the obstacle height, etc.

It also means, importantly, that a piece's ID contains all the data required to place it on the hex-grid.
Thus a stored map can simply be the map details (name,id,shape,width,height) and an array of piece ID's.
This is important for map sharing, which can be done via URL -- no database/paywall required!
The requisite data is minified using [JSONCrush](https://github.com/KilledByAPixel/JSONCrush) to try and make as many maps possible fit within the browser URL character-limit of 2000 characters.

### Expansion of BoardPieces into BoardHexes

BoardPieces is just the name for pieces that are on the current map.
BoardHexes are a 3D-hexgrid expansion of pieces. This representation is useful for validation. If you place a tree, it blocks any land hexes from being placed in the same cube-coordinate, and it does this on however many altitude levels depending how tall the tree is.

Some pieces, like the Ruins from Rise of the Valkyrie, have different amounts of vertical clearance in its various hexes that it occupies.

BoardHex IDs are structured based on their coordinates in the hex grid.
Each hex on the board has a unique ID that is derived from its Q and R coordinates, and its altitude. This allows the application to efficiently manage and reference each hex on the board.

### Adding New Terrain Pieces

To add new terrain pieces, follow these steps:
1. **Create the 3D Model**: Use Blender to create the 3D model of the new terrain piece.
2. **Export as .glb**: Export the model as a `.glb` file.
3. **Add to Project**: Add the `.glb` file to the appropriate directory in the project.
4. **Create a React Component for the Model**: Run the `.glb` through [`gltfjsx`](https://gltf.pmnd.rs/), for example.
5. **Update UI**: Update the user interface to allow users to select and place the new terrain piece. (as the project is under development, this step is subject to considerable change)

By following these steps, you can expand the application to support new releases of Heroscape terrain.

LavaField: rgb(160, 32, 32)
Lava: rgb(255, 64, 64)
Sand: rgb(204, 171, 41)
Water: rgb(32, 32, 255)
Swampwater: rgb(222, 210, 42)
Snow: rgb(255,255,255)
Ice: rgb(180,180,255)
Shadow: rgb(0,0,0)

COLOR MAPPING:
Gpick                 |||  Coolors
hsl(359, 51%, 36%)  hsl(354, 65%, 36%)
hsl(232, 42%, 71%) hsl(231, 46%, 71%)
