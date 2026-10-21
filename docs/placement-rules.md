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
automatically with pillars, and dragging is not enabled here.

Laur stacking uses an eight-level increment. Matching square pillars
(including the stackable square variant) and triangle pillars stack at
`lower.altitude + 8`. A short stackable wall stacks on the same short
stackable wall; a long stackable wall stacks on the same long stackable wall
or an arch. The arch cannot stack on another piece. Ruin style 1 can stack on
another style 1; styles 2 and 3 cannot stack. Legal stacks are not flagged as
conflicts. A non-stackable wall placed over a wall remains allowed but is
flagged as conflicted. Existing saved altitudes are not migrated.

Conflict checks use the canonical identity for shared sides and vertices.
Measured footprint conflicts are enabled only for `lwl2`, `lwr2`, and `lwr3`;
other add-on footprints remain unmeasured and are not inferred. The footprint
source uses a 10-level height for those three pieces, while registered piece
metadata uses 12. Conflict checks intentionally keep the footprint source's
value unchanged.
