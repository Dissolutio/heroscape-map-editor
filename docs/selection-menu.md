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
all sizes, so `g1` and `g2` match. Connectivity follows occupied `BoardHex`
cells that share a side at the same altitude or stack at the same coordinate
on adjacent altitudes; corner-only contact does not connect. Laur attachments
also connect through their shared edge/node feature.

Selection actions use only pieces visible at the current viewing level and
respect hidden start zones. Objective markers are separate from `BoardPiece`
selection and are not included.
