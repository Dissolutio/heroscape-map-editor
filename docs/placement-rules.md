# Placement rules

## Rule 4: Laur add-ons place permissively and report support

Laur wall add-ons can be placed with the pen on any hovered board surface.
The clicked surface supplies the anchor hex and altitude; no Laur pillar is
required. The pointer's world-space position resolves the nearest allowed
side or vertex, with the current pen rotation used at the exact hex center.
Short walls use integer rotations, long walls and arches use half-step
rotations, and ruins allow both.

Placement never rejects or displaces a piece because of Laur support or
conflicts. Support is derived from `boardPieces`: square pillars have ports
at `r`, `r+1.5`, `r+3`, and `r+4.5`; triangle pillars have ports at `r`,
`r+2`, and `r+4` (all modulo 6). Short walls and short stackable walls need
matching ports on the anchor and the adjacent far pillar. Long walls,
stackable long walls, and arches bridge to the pillar two hexes away across a
vertex and need matching ports at both ends. Ruins need one matching port on
the anchor pillar. A required pillar must have the same `BoardPiece.altitude`
as the add-on.

Unsupported add-ons are shown in amber; if an add-on is also conflicted, the
orange conflict style remains and an amber cross adds a second signal.
Conflict and support status are derived state, not fields on `BoardPiece`;
they are not included in map files, autosaves, or share links. Add-ons remain
boardPieces-only and do not expand `boardHexes`. They do not move
automatically with pillars, and dragging is not enabled here.

Conflict checks use the canonical identity for shared sides and vertices.
Measured footprint conflicts are enabled only for `lwl2`, `lwr2`, and `lwr3`;
other add-on footprints remain unmeasured and are not inferred. The footprint
source uses a 10-level height for those three pieces, while registered piece
metadata uses 12. Conflict checks intentionally keep the footprint source's
value unchanged.
