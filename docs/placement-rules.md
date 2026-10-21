# Placement rules

## Rule 4: Laur wall add-ons are placed permissively

Laur wall add-ons can be placed with the pen on any hovered board surface.
The clicked surface supplies the anchor hex and altitude; no Laur pillar is
required. The pointer's world-space position resolves the nearest allowed
side or vertex, with the current pen rotation used at the exact hex center.
Short walls use integer rotations, long walls and arches use half-step
rotations, and ruins allow both.

Placement never displaces or rejects a piece because of a Laur conflict.
Conflicts are derived from `boardPieces` and shown through the existing
footprint status colors. The same canonical side or vertex is one identity
from every adjacent hex. Measured footprint conflicts are enabled only for
`lwl2`, `lwr2`, and `lwr3`; other add-on footprints remain unmeasured and are
not inferred.

Laur add-ons remain boardPieces-only and do not expand `boardHexes`. They do
not move automatically with pillars, and dragging is not enabled here.
Support evaluation is a seam only: the support table is empty, so no piece is
marked unsupported yet.

The footprint source uses a 10-level height for `lwl2`, `lwr2`, and `lwr3`,
while registered piece metadata uses 12. Conflict checks intentionally keep
the footprint source's value unchanged until the physical measurements are
verified.
