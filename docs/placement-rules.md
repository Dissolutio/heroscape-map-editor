# Placement rules

## Rule 4: Laur add-ons place permissively and report support

Laur wall add-ons can be placed with the pen on any hovered board surface.
The clicked surface supplies the anchor hex and altitude; no Laur pillar is
required. When the pointer is over a Laur pillar, the nearest rotation is
chosen from the add-on's allowed rotations that match that pillar's ports.
Square pillars offer two matching rotations for short walls, long walls and
arches, and four for ruins. Triangle pillars offer three matching rotations
of one kind; an incompatible side/vertex kind has no matches. With no match,
or when the pointer is not over a pillar, rotation stays permissive and an
unsupported placement is still shown in amber. The current pen rotation wins
an exact hex-center tie.

Piece `height` counts the whole blocked levels starting at the obstacle
origin: the origin plus `height - 1` vertical-clearance levels. The first
unblocked level is `origin altitude + height`. Measured Laur pillars block
12 levels (core 9.5, top 12) and stack at an eight-level increment. The
measured tree heights are recorded by piece ID in
[pieceHeightAudit.ts](../src/data/pieceHeightAudit.ts).

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
automatically with pillars; users can move a whole wall system by explicitly
multi-selecting its pieces before dragging.

Laur stacking uses an eight-level increment. Matching square pillars
(including the stackable square variant) and triangle pillars stack at
`lower.altitude + 8`. A short stackable wall stacks on the same short
stackable wall; a long stackable wall stacks on the same long stackable wall
or an arch. The arch cannot stack on another piece. Ruin style 1 can stack on
another style 1; styles 2 and 3 cannot stack. Legal stacks are not flagged as
conflicts. A non-stackable wall placed over a wall remains allowed but is
flagged as conflicted. Existing saved altitudes are not migrated.

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
