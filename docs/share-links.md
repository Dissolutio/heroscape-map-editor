# Building Hexoscape share links

Use this guide to build a URL that opens your map in Hexoscape. Links open in
3D by default; the optional view parameter can open the map in 2D or PDF.

## URL and encoding

```text
https://hexoscape.com/hs?m=<data>[&v=a|b]
```

The `m` value is made by JSON-stringifying the payload below, compressing that
string with JSONCrush, and applying `encodeURIComponent` to the compressed
value. Use the exact JSONCrush version named by `jsoncrushVersion` in
[`/format/version.json`](https://hexoscape.com/format/version.json). That
manifest is the source of truth for the route, parameter names, and view
values. An absent `v` opens 3D.

## Payload

The JSON payload is an array: `[hexMap, ...pieceStrings]`. The first item is
the map object; each remaining item is one placed-piece string. The generated
[JSON Schema](https://hexoscape.com/format/share-link.schema.json) describes the map fields and
payload shape.

The required `hexMap` fields are `id`, `name`, `author`, `shape`, `length`, and
`width`. Optional fields include `version`, `originQ`, `originR`, `setsUsed`,
and `objectiveMarkers`. The app encoder does not share the map portrait or
notes: it writes `mapPortraitBase64: ''` and `mapNotes: ''` in their place.
Omitted `version` loads as version 1 (legacy hexagon maps may be migrated).

## Piece strings and coordinates

Each piece string has this form:

```text
altitude~q~r~rotation~id
```

`id` is the registry ID listed in
[`/format/pieces.json`](https://hexoscape.com/format/pieces.json).
The coordinate system is cube coordinates: `q + r + s = 0`, so `s` is
calculated as `-q-r` and is not included in the string. Hexoscape uses flat-top
hexes. On screen, positive `q` points right and positive `r` points down and
right. `(0,0,0)` is the coordinate origin, not necessarily the visual center
of a particular map.

```text
                   NW (0,-1,+1)   NE (+1,-1,0)
                         \         /
W (-1,0,+1) ------------- O ------------- E (+1,0,-1)  rotation 0
                         /         \
                   SW (-1,+1,0)   SE (0,+1,-1)
```

Rotation 0 is the piece's unrotated baseline. For directional pieces, side 0
faces east (`+q`); positive rotation steps turn clockwise. A step is 60
degrees. Some side- and vertex-aligned pieces allow half steps (30 degrees),
between a side and the next vertex direction. Check each piece's
`allowedRotations` in
[`/format/pieces.json`](https://hexoscape.com/format/pieces.json).

Altitude is the placement level, not the physical height of the piece. A piece
placed on the table uses altitude 0. A piece placed on top of one level of land
uses altitude 1. Some fluid stacking rules use half-level values.

The piece coordinate is its anchor hex. For ordinary pieces, the footprint
offsets in [`/format/pieces.json`](https://hexoscape.com/format/pieces.json)
are cube-coordinate
offsets from that anchor; add each offset to the piece's `q` and `r` (and
derive `s` again). Port-rule pieces list allowed rotations and a `rotationNote`
instead of generated footprints.

## Limits and unknown pieces

Use `maxUrlLength` and `fallbackDropOrder` in
[`/format/version.json`](https://hexoscape.com/format/version.json). If a
generated URL is too long, Hexoscape retries after dropping start zones,
objective markers, and then glyphs, in that order. If it still does not fit,
the app reports: “Map is too large to be stored in a URL. You can try
downloading your map as a file and sharing the file.”

An unrecognized piece ID is dropped when loading, and the app shows a warning.

## Format versioning

Links in format version 1 continue to load. A breaking format change must bump
`formatVersion` in [`/format/version.json`](https://hexoscape.com/format/version.json)
and keep older links loading.

## Complete example

[`docs/examples/encode-share-link.mjs`](./examples/encode-share-link.mjs) is a
plain ES module that uses JSONCrush and Node's built-in URL helper. Run it with
Node after installing JSONCrush; it prints a link for a seven-hex grass tile,
a tree on the tile, and a start zone.
