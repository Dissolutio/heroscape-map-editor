# URL parameters

Add these to the page address, for example `/hs?perf=1&perfSeconds=5`. They
last only for that page load and don't change saved settings. Keep this list
up to date when you add one.

## Everyone

| Param          | Values           | What it does                                          | Code                                  |
| -------------- | ---------------- | ----------------------------------------------------- | ------------------------------------- |
| `m`            | crushed map      | Share link: loads the map                             | `src/utils/mapShareUrl.ts`            |
| `v`            | `a` / `b`        | Share link view: `a` PDF, `b` 2D, absent 3D           | `src/utils/mapShareUrl.ts`            |
| `perf`         | `1`              | Performance overlay (see `docs/performance.md`)       | `src/performance/performanceFlags.ts` |
| `perfNoEvents` | `1`              | With `perf=1`: skip window/event timing               | `src/performance/performanceFlags.ts` |
| `bench`        | `1`              | With `perf=1`: run the benchmark phases               | `src/performance/performanceFlags.ts` |
| `perfSeconds`  | 1–60             | With `bench=1`: seconds per phase (default 2)         | `src/performance/performanceFlags.ts` |
| `cells`        | `1`              | Debug overlay of edge/node cells (walls, ships, Laur) | `src/e2e/isE2E.ts`                    |

## Tests (see `e2e/README.md`)

| Param          | Values                    | What it does                                   | Code               |
| -------------- | ------------------------- | ---------------------------------------------- | ------------------ |
| `e2e`          | `1`                       | Test mode: test bridge, deterministic startup  | `src/e2e/isE2E.ts` |
| `perHexLand`   | `1`                       | With `e2e=1`: draw land per hex, not instanced | `src/e2e/isE2E.ts` |
| `graphicsTier` | `low` / `medium` / `high` | With `e2e=1&perHexLand=1`: start tier          | `src/e2e/isE2E.ts` |
| `whats-new`    | `1`                       | With `e2e`: show the What's new dialog         | `src/e2e/isE2E.ts` |

## Development builds only (ignored in production)

| Param                 | Values      | What it does                         | Code                                    |
| --------------------- | ----------- | ------------------------------------ | --------------------------------------- |
| `selTint`             | number      | Land selection tint dial             | `src/world/models/landHexInstances.ts`  |
| `selEdge`             | number      | Land selection edge dial             | `src/world/models/landHexInstances.ts`  |
| `capRim`              | `unrotated` | Unrotated solid cap rim experiment   | `src/world/models/landHexInstances.ts`  |
| `markerHexScale`      | 0.1–1.5     | Objective marker shape dial          | `src/world/models/objectiveMarker3D.ts` |
| `markerBridge`        | number      | Objective marker bridge width dial   | `src/world/models/objectiveMarker3D.ts` |
| `markerBridgeOverlap` | number      | Objective marker bridge overlap dial | `src/world/models/objectiveMarker3D.ts` |
