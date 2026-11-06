# Selection context menu

The right-click menu is registered in
[`src/selection/selectionMenuActions.ts`](../src/selection/selectionMenuActions.ts).
To add an action, add one `SelectionMenuAction` entry to
`selectionMenuActions`; `SelectionContextMenu` derives the labels, enabled
state, groups, tooltips, and execution from that registry. Keep selection
computation pure and apply results with `ctx.setSelectedPieceIDs()` so the
selection stays in transient UI state.

The current type rule is exact `inventoryID` for non-land pieces. Thus `tr10`
and `tr11` are different types. Land uses its registered `landPrefix` across
all sizes, so `g1` and `g2` match.

“Select connected” follows only these connections:

- Solid and fluid land connect across a shared side at the same altitude, or
  when stacked directly above or below one another. Corner-only contact does
  not connect.
- Obstacles connect only to land directly beneath their footprint. This
  includes trees, palms, outcrops, glaciers, ruins, and similar pieces;
  obstacles do not connect to adjacent obstacles or unsupported neighboring
  land.
- Laur pillars, walls, add-ons, and stacks retain their shared edge/node and
  stacking connections, and connect to the land beneath them.
- Ladders connect to land at their bottom and top. Battlements and rope ladders
  connect through their edge to attached land or walls.

Other touching pieces, including road walls, do not connect. Selection still
uses only pieces visible at the current viewing level and respects hidden
start zones. Objective markers are separate from `BoardPiece` selection and
are not included.
