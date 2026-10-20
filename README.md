# Heroscape Map Editor

## How to Install and Run

### 🪟 Windows
1. Download the installer from the [Official Windows Download](https://github.com/dissolutio/heroscape-map-editor/releases/latest/download/Hexoscape.msi).
2. Double-click the `.msi` file to run the installer.
3. *Note:* If a blue "Windows protected your PC" popup appears, click **More info** and then click **Run anyway**.

### 🍏 macOS (Apple Silicon)
1. Download the disk image from the [Official Mac Download](https://github.com/dissolutio/heroscape-map-editor/releases/latest/download/Hexoscape.dmg).
2. Double-click the `.dmg` file, then **drag and drop** the application icon into your `Applications` folder.
3. *Note:* If it says the developer cannot be verified, open your Mac's **System Settings > Privacy & Security**, scroll down, and click **Open Anyway**.

### 🐧 Linux
- Debian/Ubuntu: download the [`.deb` package](https://github.com/dissolutio/heroscape-map-editor/releases/latest/download/Hexoscape.deb), then install it with `sudo apt install ./Hexoscape.deb`.
- Fedora/RPM-based distributions: download the [`.rpm` package](https://github.com/dissolutio/heroscape-map-editor/releases/latest/download/Hexoscape.rpm), then install it with `sudo dnf install ./Hexoscape.rpm`.
- Other distributions: download the [AppImage](https://github.com/dissolutio/heroscape-map-editor/releases/latest/download/Hexoscape.AppImage) and follow your distribution's instructions for running AppImages.


## Table of Contents

- [How to Install and Run](#how-to-install-and-run)
- [Getting Started on Development](#getting-started-on-development)
- [Selected Libraries Used](#selected-libraries-used)
- [Blender Models](#blender-models)
- [Quick Overview of How It Works](#quick-overview-of-how-it-works)
- [Scripts](#scripts)
- [App Requirements: What this editor intends to fulfill, eventually](./app-requirements.md)
- [Vite Template: The README.md that was included by the initial Vite Typescript template](./vite-template-README.md)
- [License](#license)


## Getting Started on Development

This project is a Heroscape map editor built with React, TypeScript, and Vite.

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

4. Open `http://localhost:5173` in your browser. The root route redirects to
   the editor at `/hs`.

## Scripts

The following scripts are available in the project:

- `dev`: Starts the development server with Vite.
- `format`: Formats the code using BiomeJS.
- `build`: Builds the project using TypeScript and Vite.
- `lint`: Lints the code using BiomeJS and fixes any issues.
- `preview`: Previews the production build using Vite.
- `test`: Runs the Vitest unit tests.
- `test:watch`: Runs Vitest in watch mode.
- `test:e2e`: Runs the Playwright end-to-end tests.

To run any of these scripts, use the following command:
```sh
npm run <script-name>
```
Note that `lint` and `format` modify files.

## Selected Libraries Used

The application uses the following libraries for its UI, state management,
rendering, and map data:

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite**: A fast build tool and development server.
- **BiomeJS**: Fast code linter/formatter.
- **@emotion/react** and **@emotion/styled**: Libraries for writing CSS styles with JavaScript.
- **@mui/material**: A popular React UI framework.
- **@react-three/drei** and **@react-three/fiber**: Libraries for working with Three.js in React.
- **@sentry/react**: A library for error tracking and monitoring.
- **immer**: A library for working with immutable state.
- **jsoncrush**: Compresses map data for shareable URLs. URL length limits vary
  by browser and platform, so compression cannot guarantee that every map will
  fit in a URL.
- **lodash**: Utility functions used by the application.
- **nanoid**: Generates unique IDs for map and piece instances.
- **notistack**: A library for displaying snackbars (feedback/notifications when something is successful or errors) in React.
- **papaparse**: A library for parsing CSV (and TSV etc) files, used for loading non-standard piece inventories.
- **react-hotkeys-hook**: A library for handling keyboard shortcuts in React.
- **react-icons**: A library for including popular icons in React.
- **wouter**: A minimalistic routing library for React.
- **zundo**: A library for managing undo/redo functionality.
- **zustand**: State management; **zundo** adds undo/redo history.

## Quick Overview of How It Works

The app uses a [hex grid and several coordinate systems](https://www.redblobgames.com/grids/hexagons/#coordinates).
Virtualscape exports tiles with X and Y values using Odd-R offset coordinates;
the importer converts those coordinates for the editor.

Placed pieces are represented by `BoardPieces`. The app derives a grid of
`BoardHexes` from them for rendering and placement validation. For example, an
obstacle such as a tree can occupy multiple grid cells and block placement at
some elevations above its base.


### Blender Models

The app uses GLB models stored in [`public/`](./public/), rendered at hex-grid
positions with `@react-three/fiber`.

### Piece IDs and Heroscape Map Storage

Each placed piece has a compact encoded ID containing its altitude, Q and R
coordinates, rotation, and Heroscape inventory ID. The values are separated by
`~`; rotations are numeric and may use half-step values for pieces that need
them. A runtime piece instance also has its own unique ID.

The inventory ID identifies a piece definition, and the app includes data for
Heroscape pieces.
Piece data includes the terrain type, the hex-count, whether it is an obstacle, what template of hexes does it use if it is a multi-hex land tile, the obstacle height, etc.

The encoded piece ID contains the placement data needed to reconstruct a piece
on the hex grid. A saved map stores map details and its placed pieces; map
sharing encodes and compresses that data with
[JSONCrush](https://github.com/KilledByAPixel/JSONCrush). The app rejects
payloads above its input-size limit, but practical URL length limits vary, so
not every map is guaranteed to be shareable in a URL.

### Expansion of BoardPieces into BoardHexes

`BoardPieces` are the canonical placed pieces on the current map.
`BoardHexes` are the derived 3D hex-grid occupancy used for placement and
validation. For example, a tree blocks placement in its footprint and at
elevations covered by its vertical clearance.

Some pieces, like the Ruins from Rise of the Valkyrie, have different amounts of vertical clearance in its various hexes that it occupies.

BoardHex IDs are structured based on their coordinates in the hex grid.
Each hex on the board has a unique ID that is derived from its Q and R coordinates, and its altitude. This allows the application to efficiently manage and reference each hex on the board.

### Adding New Terrain Pieces

Terrain registration touches more than the model and UI: it can require piece
metadata, footprints, inventory, placement rules, previews, and tests. Follow
the current [terrain addition guide](./docs/adding-a-piece.md), which describes
the implementation and registration tests.

## License

This project is dedicated to the public domain under the
[CC0 1.0 Universal](./LICENSE) waiver. Refer to the license for its terms and
limitations.