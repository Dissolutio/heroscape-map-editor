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

Footprints are defined for all eight Laur add-ons and use registered heights:
short walls attach to the anchor and the adjacent pillar with no blocked hex;
long walls and arches attach to the anchor and the pillar two hexes away across
a vertex, blocking the two intervening hexes; ruins attach to the anchor and
block the neighbor across their side (one hex at integer rotations, two at
half-steps). Ruin style 1 uses its registered height of 8; all other add-ons
use their registered height of 12.

Conflict checks use the canonical identity for shared sides and vertices and
compare altitude bands. A footprint end conflicts with a land or non-pillar
piece in that band when no Laur pillar is present. A pillar there—including a
stacked pillar—is an allowed attachment and exempts its supporting land
surface; a separate non-pillar obstacle at that end still conflicts. A missing
end pillar is reported by the separate support status. A blocked hex conflicts
with land or another non-add-on piece in-band. Add-on footprints conflict with
each other only where their blocked hexes overlap; sharing an end pillar, such
as two walls on different ports, is not a physical conflict.
