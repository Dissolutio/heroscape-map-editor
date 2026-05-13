We use BoardHexes state in files as follows:
<!-- 3D -->
- `MapDisplay3D.tsx` compute instanced caps, map dimensions, adjust clicked hex in onPointerUpPaintPiece
- `CastleArch.tsx`, `CastleWall.tsx` generate hex for click handler

- `MapBoardPiece.tsx` is underhex terrain fluid, for positioning of glyphs, laur pillars, startzones
- `PiecePreview.tsx` lookup hovered hex for ladder
- `HexCapHeightTextDisplay.tsx` is underhex terrain fluid, for positioning

- `World.tsx` map dimensions to position lights, axes helper
- `useApplyHotkeys.tsx` map dimensions for camera autozoom
- `ViewControlsTab.tsx` map dimensions for camera autozoom
<!-- SVG/PDF -->
- `SvgMapDisplay.tsx` compute svg dimensions 
- `PdfMap6LevelsPerPage.tsx` compute svg dimensions, calculates per level chunks 
- `ReactPdfSvgMapDisplay.tsx` renders chunks and boardhexes
- `ReactPdfRoot.tsx`  `ReactPdfDownloadLink.tsx` pass props
<!-- MISC -->
- `EditControlsTab.tsx` dev log