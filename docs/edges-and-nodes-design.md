# Shared hex-grid edges and nodes

This is a design and pure-logic prototype only. The app still stores and
interprets pieces as before; no placement, conflict, rendering, picking, or
saved-map behavior changes here. The prototype lives in
[`src/data/hexGrid/edgesAndNodes.ts`](../src/data/hexGrid/edgesAndNodes.ts) and
is exercised by [`edges-and-nodes.test.ts`](../src/__tests__/edges-and-nodes.test.ts).

## Current inventory

The grid's six directions are numbered `0=E, 1=SE, 2=SW, 3=W, 4=NW, 5=NE`;
opposites are three steps apart. Integer rotations select sides and half-step
rotations select corners between adjacent directions. These are conventions,
not shared edge/node identifiers.

| Area | Current representation and canonicalization | Consumers |
| --- | --- | --- |
| Grid direction math | [`hex-utils.ts`](../src/utils/hex-utils.ts#L139-L197) exposes direction vectors, neighbor lookup, and half-step radial neighbors. An edge is described as `(hex, direction)`; the same edge also has `(neighbor, direction + 3)`. There is no canonical ID. | Placement, rotation, footprint, support, and drag code use these helpers. The direction vectors are in [`constants.ts`](../src/utils/constants.ts#L14-L19). |
| Laur add-on side/node identity | [`laurAddonPlacement.ts`](../src/data/laurAddonPlacement.ts#L46-L77) normalizes rotations into 12 half-steps. An integer rotation becomes `side:<sorted full q,r,s>|<sorted full q,r,s>`; a half-step becomes `vertex:<three sorted full q,r,s>`. The strings are canonical across adjacent hex anchors, but omit altitude. | Placement uses the key for snapping and stack matching ([`placement.ts`](../src/data/placement.ts#L241-L271)); [`laurAddonConflicts.ts`](../src/data/laurAddonConflicts.ts#L76-L129) groups add-ons by key and altitude interval. |
| Laur hit resolution / world points | [`laurAddonPlacement.ts`](../src/data/laurAddonPlacement.ts#L79-L164) projects side midpoints and vertex points to floating-point world coordinates, then chooses the nearest allowed feature. Ties use `1e-12`; the exact-center special case uses strict `===`. | Click/preview placement passes a world hit point to the resolver. The e2e bridge projects the feature point for Laur add-on picking ([`TestBridge.tsx`](../src/e2e/TestBridge.tsx#L175-L187)). |
| Laur pillar ports and support | [`laurPillarPorts.ts`](../src/data/laurPillarPorts.ts#L3-L24) represents ports as rotations from the pillar center: square pillars use four half-step/whole-step ports; triangle pillars use three whole-step ports. [`laurAddonSupport.ts`](../src/data/laurAddonSupport.ts#L36-L103) indexes them by `q,r,s@altitude` and stores a set of rotations. [`map-utils.ts`](../src/utils/map-utils.ts#L235-L241) also retains an unused square-pillar port list and flip table. | Port rotations restrict placement ([`laurAddonPlacement.ts`](../src/data/laurAddonPlacement.ts#L16-L44)) and are checked against required add-on ports in support evaluation. |
| Laur physical footprint | [`laurAddonFootprints.ts`](../src/data/laurAddonFootprints.ts#L42-L110) independently normalizes the rotation, chooses side versus vertex by integer versus half-step, and derives attachment and blocked hexes. | [`laurAddonConflicts.ts`](../src/data/laurAddonConflicts.ts#L89-L103) consumes this footprint for conflicts. It does not create edge/node occupancy in `boardHexes`. |
| Battlement, road-wall, and ladder placement | [`map-utils.ts`](../src/utils/map-utils.ts#L207-L224) translates clicked hexes and rotations for battlements and road walls; battlements and road walls have different anchor conventions. The saved piece still contains anchor hex plus rotation, not an edge ID. Additional resolver/support translation is repeated in [`dragMove.ts`](../src/data/dragMove.ts#L783-L801) and [`evaluateGroupRotation.ts`](../src/data/evaluateGroupRotation.ts#L61-L91). | `placement.ts` consumes the clicked-hex helpers; drag and group-rotation preflight recalculate the supporting hex. Rope ladders also use a direction/rotation, but have their own placement/stack behavior. |
| Edge drag target | [`dragMove.ts`](../src/data/dragMove.ts#L803-L849) returns `{ edgeIndex, rotation }`; its cache key is `<hex.id>:edge:<edgeIndex>`. [`dragRotation.ts`](../src/data/dragRotation.ts#L100-L130) compares a world point against six floating-point edge midpoints and applies tie/hysteresis rules. Laur drag keys instead append raw world-point `x,z`. | Drag placement, group movement, cache invalidation, and preview use the target. `dragRotation.ts` also resolves ladder pointer sectors. |
| Preview and rendered piece geometry | [`PlacementFootprint.tsx`](../src/world/PlacementFootprint.tsx#L82-L110) builds an edge segment with trigonometry from a rotation. Model offsets and rotations are separately encoded in [`piece-adjustments.ts`](../src/world/models/piece-adjustments.ts#L60-L105) and [`MapBoardPiece3D.tsx`](../src/world/MapBoardPiece3D.tsx#L207-L350). Laur pointer hits supply a world point through [`MapBoardPiece3D.tsx`](../src/world/MapBoardPiece3D.tsx#L125-L141). | The 3D drag preview consumes `edgeIndex`; actual piece models render from piece anchor and rotation. Ray hits currently identify pieces/hexes and supply world points, not a feature ID. |
| SVG and PDF | [`SvgMapBoardPiece.tsx`](../src/svg-map/SvgMapBoardPiece.tsx#L22-L48) and [`PdfMapBoardPiece.tsx`](../src/pdf-map/PdfMapBoardPiece.tsx#L22-L53) derive their transforms from the saved anchor and rotation. Their piece-family geometry is independently defined in [`SvgMapShapes.tsx`](../src/svg-map/SvgMapShapes.tsx#L923-L1040) and [`PdfMapShapes.tsx`](../src/pdf-map/PdfMapShapes.tsx#L818-L951). | Exporters do not currently consume edge/node IDs. |
| E2E edge picking | [`TestBridge.tsx`](../src/e2e/TestBridge.tsx#L161-L173) accepts a hex plus edge number, projects an interior point using the neighbor vector, and lets the regular pointer path resolve the target. Laur add-on picking uses its projected feature point. | `e2e/fixtures.ts` uses this helper for edge drags; [`e2e/README.md`](../e2e/README.md#L124-L129) documents it. |
| Registration and occupancy | Piece registrations in [`pieces.ts`](../src/data/pieces.ts#L1470-L1479) and [`pieces.ts`](../src/data/pieces.ts#L1683-L1702), plus the edge-piece templates in [`tileTemplates.ts`](../src/data/tileTemplates.ts#L323), describe piece metadata and hex templates, not feature footprints. `addPiece` keeps Laur add-ons boardPieces-only; edge pieces also do not get a shared edge/node occupancy entry. | Existing whole-hex placement/conflict code remains authoritative. The known-gap tests in [`place-and-remove.test.ts`](../src/__tests__/place-and-remove.test.ts#L489-L581) identify edge-piece duplicate/support behavior still to resolve. |

## Problems to solve

1. **Same feature, different names.** A side can be `(H,k)` or
   `(H + dir(k),k+3)`; a corner can be anchored by any of its three hexes.
   [`edges-and-nodes.test.ts`](../src/__tests__/edges-and-nodes.test.ts#L35-L101)
   proves those equivalences. Edge-piece placement keeps an anchor/rotation,
   while only Laur add-ons compute a canonical structural key.
2. **Different key semantics.** Laur structural keys omit altitude, while
   support lookup uses `q,r,s@altitude`, a drag cache key uses a board-hex ID
   plus edge index, and Laur drag cache keys include raw world coordinates.
   These keys answer different questions but are not represented by distinct
   types, so callers must know which form is valid for identity, support, or
   caching.
3. **Duplicated orientation and anchor math.** Laur feature identity,
   attachment/blocked hexes, required support ports, edge-piece clicked-hex
   conversion, drag support-hex calculation, group-rotation preflight, and
   preview geometry each interpret rotations locally. For example, battlement
   edge index is `(rotation + 3) % 6` in drag support logic, while road wall
   uses `rotation`; the model's rotation is not itself a universal edge index.
4. **Floating-point boundary leakage.** Nearest-feature picking necessarily
   starts with a world-space hit, but the result is then used for identity.
   Laur resolution uses geometric distances and exact center equality;
   edge-drag cache identity is an integer index, whereas Laur cache identity
   preserves unrounded pointer floats.
5. **No registry-level footprint contract.** Hex templates do not state that
   a piece occupies an edge or node, which supporting features it requires,
   or which adjacent hexes it physically blocks. Feature support and conflicts
   therefore live in family-specific logic. Existing board-hex occupancy
   cannot distinguish two edges of the same hex.
6. **Exports and picking are consumers of conventions, not topology.** 3D,
   SVG, and PDF code each position/rotate edge-oriented pieces from saved
   rotations. There is no common feature ID to pass from the pointer resolver
   through placement, preview, export, and conflict evaluation.

## Proposed shared layer

Use the integer cube-coordinate lattice and keep structural identity separate
from altitude, piece rotation, and world coordinates:

- **Edge ID:** `edge:<Q>,<R>,<S>`, where `(Q,R,S) = 2H + d`. `H` is either
  adjacent hex center and `d` is the direction from that center to the other.
  The doubled midpoint is integral and identical from both sides.
- **Node ID:** `node:<Q>,<R>,<S>`, where
  `(Q,R,S) = 3H + d[k] + d[(k+1)%6]`. The triple-scaled vertex is integral
  and identical from each of its three meeting hexes.
- Validate all input hexes as safe integer cube coordinates (`q+r+s=0`), and
  normalize negative zero at the serialization boundary. The prefix and scale
  distinguish edge and node IDs. Do not put altitude into either ID; use a
  separate feature occupancy key such as `(edgeId, altitude)` or a vertical
  interval when collision rules require it.
- Convert to world coordinates only at the drawing/picking boundary. The
  prototype maps the edge's doubled point or node's tripled point back through
  the existing cube projection. Those floats are presentation values, never
  identity or cache keys.

The pure prototype provides:

| Query | Prototype API |
| --- | --- |
| Hex + side direction → edge; hex + corner / half-step rotation → node | `edgeIdFromHex`, `nodeIdFromHexCorner`, `nodeIdFromHexRotation` |
| Edge → its two hexes and two nodes; node → its three hexes and three edges | `hexesForEdge`, `nodesForEdge`, `hexesForNode`, `edgesForNode` |
| Hex → six edges and six nodes | `edgesForHex`, `nodesForHex` |
| Hex distance and adjacency; edge/node adjacency through shared features | `hexDistance`, `hexesAreAdjacent`, `edgesShareNode`, `nodesShareEdge` |
| Feature → existing x/z world projection | `edgeToWorldPoint`, `nodeToWorldPoint` |

It uses the existing direction ordering in `hex-utils.ts`, is independent of
React and the store, and is not imported by any app caller.

### Consumer migration

- **Laur placement and support:** use node/edge IDs instead of canonical-string
  construction. Store feature IDs in support tables and add altitude as a
  separate key. Preserve allowed rotations as a user-facing orientation
  adapter; do not make piece rotation the identity.
- **Laur footprint/conflicts:** derive attachment features through shared
  constructors, then retain explicit blocked-hex and height data. This does
  not imply that Laur add-ons should begin writing `boardHexes`.
- **Battlements, road walls, rope ladders, and other edge pieces:** add a
  piece-specific adapter from legacy `(anchor, rotation)` to a canonical
  edge ID, including battlement's inverse side and road-wall anchor offset.
  Resolve the target once and pass the ID to placement, drag/group transforms,
  support, cache keys, and preview. Preserve the legacy anchor/rotation in
  saved maps until a separately reviewed format migration is justified.
- **Piece registry:** add typed edge/node footprint metadata (feature kind,
  anchor/rotation adapter, required/support features, blocked hex offsets, and
  height). Keep ordinary hex footprints unchanged. Physical dimensions and
  support rules still need verification against the actual pieces.
- **3D picking and preview:** convert the hit point to the nearest candidate
  edge/node, then carry its ID through the interaction. Render preview
  geometry by converting the ID to a world point/segment. Keep world-space
  hit tests at the pointer boundary; never use their floats as identity.
- **SVG/PDF:** have both renderers consume the same resolved feature footprint
  and convert canonical grid coordinates to their own page coordinates. Keep
  SVG and PDF shape generation separate where their geometry APIs differ, and
  compare exports against current output before removing rotation adapters.
- **Saved maps, undo, and share links:** continue reading/writing existing
  `altitude~q~r~rotation~id` records. Rebuild runtime feature IDs from those
  fields; do not serialize IDs or grow URLs as part of the first migration.

## Migration plan

1. **DONE — Land the pure ID layer and characterization tests.** Completed on
   `dev`: the
   integer constructors, incidence queries, adjacency helpers, world-point
   conversion, and cross-checks against current Laur keys and edge-drag targets.
   No app callers or saved data change. Test with `edges-and-nodes.test.ts`,
   `hex-grid.test.ts`, and the full unit suite. **Risk: low.**
2. **DONE — Add registry footprint declarations and adapters.** The
   read-only declarations cover the three Laur pillars and their ports, all
   eight Laur add-ons, battlements, road walls, and rope ladders. The adapter
   returns canonical feature IDs and expresses existing add-on footprint ends
   and blocked hexes as hex IDs. `piece-features.test.ts` sweeps every legal
   rotation and compares with the current Laur keys, footprints, pillar ports,
   and edge-drag targets. The sweep found no convention mismatches. No app
   callers or saved data change. **Risk: low to medium; the piece-specific
   anchor conventions must be exact.**
3. **Migrate Laur support and conflict identity.** Replace duplicate Laur
   canonical strings and rotation-key support lookup with typed feature IDs,
   while preserving altitude intervals, stack exemptions, blocked cells, and
   boardPieces-only storage. Run the Laur placement, support, footprint,
   conflict, load-order, and known-good map tests. **Risk: medium; a wrong
   feature or altitude key changes legal stacking/conflicts.**
4. **Migrate edge-piece placement and movement.** Pass canonical IDs through
   placement, support, drag/group rotation, no-op detection, and drag caches.
   Keep legacy saved fields and compare all six rotations, tie cases, group
   movement, undo, and blocked placement. Run placement, edge drag, ladder
   drag, group rotation, and related click/e2e tests. **Risk: high; battlement,
   road-wall, ladder, castle rim, and group-pivot conventions differ.**
5. **Migrate 3D picking and previews.** Resolve one feature ID from pointer
   hits and share it with preview/picking; retain current pointer behavior at
   ties. Run edge and Laur drag e2e specs with the existing app-ready and
   screen-position helpers. **Risk: high; pointer hit location and camera
   projection affect user-visible targeting.**
6. **Migrate SVG/PDF geometry.** Reuse the registry footprint and shared
   projection while retaining separate renderer primitives. Compare edge/node
   pieces at every rotation in both exports and test map round-trips before
   deleting old transform code. **Risk: medium; export geometry and visual
   ordering can drift independently.**
7. **Only then consider feature occupancy and serialized format changes.**
   Resolve which feature overlaps are physical conflicts and whether any
   serialized form should change. Add migration tests for existing JSON and
   share links before changing formats. **Risk: highest; impacts old maps,
   conflicts, undo/redo, and URL compatibility.**

## Prototype coverage

The existing [`edges-and-nodes.test.ts`](../src/__tests__/edges-and-nodes.test.ts)
now checks side symmetry from both adjacent hexes, node symmetry from all
three meeting hexes, all six directions/corners, a signed-coordinate sweep,
incidence and adjacency, world-point conversion, and equivalence with current
Laur side/vertex keys and battlement/road-wall/rope-ladder drag targets.
[`piece-features.test.ts`](../src/__tests__/piece-features.test.ts) checks the
read-only registry adapters against the legacy implementations for every
registered edge/node feature piece and legal rotation.
Existing `it.todo` entries remain application-level acceptance work; this
prototype does not implement placement conflicts, support requirements,
serialization migration, or renderer integration.
