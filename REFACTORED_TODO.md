# Hexoscape AI-Assisted Developer Pipeline

Source: [TODO.md](TODO.md). Architecture contract: [.github/agents/hexoscape.agent.md](.github/agents/hexoscape.agent.md).

All 45 top-level source tasks are represented below, including the prose-only 2D Builder and Database tasks. The five homepage destinations remain acceptance scope under B20. Source IDs retain original order within each section: T = TODO, H = Hotkeys, P = PDF/SVG, B = Big TODO, M = Blender, S = 2D Builder, D = Database. The original file is unchanged.

## Execution Order

| Stage | Work | Release Gate |
| --- | --- | --- |
| 1. Small, independent changes | T04, T05, T09, B03, then T03 | Each behavior verified independently; one task per Flash session. |
| 2. Bounded settings and export work | H01, P01, P05 | Hotkey regression checks; paired SVG/PDF verification for export changes. |
| 3. Resolve the separate pile | Answer Bucket 2 questions; acquire physical fixtures for T07/B06 and asset specifications for M01-M05 | Approved behavior, fixtures, and asset contracts before implementation. Reclassify only after answers. |
| 4. Shared interaction foundations | B05; B14; S01 after selection/command semantics are agreed | One source of map mutation truth; input ownership and undo verified. |
| 5. Constraint and optimization work | T07 and B06 after measurements; B09; B08 after T10 accounting; B07 after substitution policy | Replay, conflicts, inventory, persistence, and undo agree on representative maps. |
| 6. Dependent presentation/features | P04 after ladder connectivity fixtures; T08 after T02; B15 after B14; P02 after style parity; B17/B18 after B01 | Each predecessor's contract is stable; do not batch unrelated work. |

Priority is based on implementation readiness and dependencies, not estimated user value. Unanswered items are not authorization to invent product behavior. A high-reasoning model cannot substitute for measurements, missing assets, or user decisions.

## Shared Handoff Contract

Every implementation session must read the master agent and verify current source before editing. Paths below are starting points, not promises about uninspected APIs.

- Use React 18, MUI/Emotion, Zustand/Immer, and existing Zundo history boundaries. Do not introduce React 19-only APIs or a second map state engine.
- Preserve signed cube coordinates, `q+r+s=0`, the X/Z board plane, and `Y = 0.35 * level`. Placement altitude is not necessarily surface altitude; preserve piece-specific cap, fluid, and glyph offsets.
- `boardPieces` contains physical/logical instances. `boardHexes` is derived occupancy, not inventory and not the persisted source of truth. Keep UIDs, conflict restoration, serialization, and undo coherent. Start zones are the verified no-occupancy exception; glyphs are not automatically equivalent.
- For constraints, use occupancy/templates and existing legal exceptions, not mesh bounds or generic bounding-box collisions. One matrix cell stores one owner, so it cannot directly answer overlap multiplicity.
- Preserve R3F instancing and shared resource lifetimes. Check shared SVG/PDF helpers for every 2D change; DOM SVG and `@react-pdf/renderer` primitives are not interchangeable.
- Validate the smallest changed behavior first, then `npm run build` for application changes. No test script is currently declared. Reuse available checks or add a small focused regression check without assuming a test framework. Do not use the source-rewriting lint/format scripts as passive checks. Build success alone does not prove visuals, collisions, or desktop behavior.

## Bucket 1: Flash Ready

Eight bounded work items. Each block is a standalone prompt for MAI 1.1 Flash. Shared-file dependencies still require sequential execution or careful integration.

### T03 - Convert Start Zone Colors

Source: TODO #3. Depends on: nothing.

**Copy-Paste Prompt**

```text
Implement start-zone color conversion in Hexoscape. First read .github/agents/hexoscape.agent.md, src/controls/ConvertTerrainQuickSelect.tsx, src/controls/SelectedPieceControls.tsx, and the conversion action in src/store/map-slice.ts; verify start-zone identifiers in src/data/pieces.ts and src/data/pieceCodes.ts.

When the existing selected-piece conversion control targets start-zone pieces, offer startZone1 through startZone8 using the existing labels/colors. Keep ordinary terrain options and behavior unchanged. For selections mixing start zones with physical terrain, disable start-zone conversion rather than partially applying it. Match existing selection availability rules elsewhere.

Implement through the existing store conversion transaction. Preserve instance UID, position, altitude, rotation, selection, and one-step undo/redo. Per the master agent, start zones live in boardPieces only: conversion must not write boardHexes or create/displace occupancy conflicts. Do not generalize this exception to glyphs. Keep map serialization and the 0.35 Y-level convention unchanged.

Verify each of the eight destination colors, a same-color no-op, applicable multi-selection, mixed-selection rejection, undo/redo, and save/load. Assert occupancy and physical-piece conflicts are unchanged. Run npm run build and report any checks not run. Do not modify unrelated conversion behavior.
```

### T04 - Preserve Pieces Grid Filters During Zoom

Source: TODO #4. Depends on: nothing. Bounded interpretation: preserve filters/search for the current app session, not across reloads.

**Copy-Paste Prompt**

```text
Fix Pieces Grid losing filters and search after Zoom to Piece. Read .github/agents/hexoscape.agent.md. Locate the grid and Zoom to Piece handler by their visible labels, then inspect the owner of the grid's filter/search state and its mount/unmount path. Reproduce: filter and search -> zoom to a row -> reopen the grid.

Keep the grid's existing filter model, including quick-filter/search terms, controlled by the nearest owner that survives that zoom/dialog cycle. Use existing UI-state conventions; do not invent storage persistence or preserve unrelated pagination/selection behavior. Reset through existing explicit reset controls, not because the grid unmounts. Keep current-session filters even if new map data produces zero matches.

The master agent separates Zustand UI state from map data: this is UI state only. Do not change boardPieces, derived boardHexes, map files, or Zundo history. Do not change camera fitting, R3F coordinates, or the 0.35 Y-axis scale.

Verify filtered rows and search text survive zoom/reopen, ordinary close/reopen works, clearing filters still works, and changed/deleted rows cannot leave stale row references. Run npm run build and report checks not run.
```

### T05 - Remove Zoom-to-Piece Opacity Effects

Source: TODO #5. Depends on: nothing. Does not authorize removing unrelated transparency.

**Copy-Paste Prompt**

```text
Remove only the opacity/fading effect associated with Zoom to Piece in Hexoscape. Read .github/agents/hexoscape.agent.md, src/controls/SelectedPieceControls.tsx, and src/utils/camera-utils.ts. Trace zoom-related state to its consumers in src/world, including both piece bodies and caps.

Remove the zoom-specific opacity overrides and any state/helper that becomes unused exclusively because of this removal. Preserve camera movement/framing, selection, the existing target viewing level, normal fluid transparency, previews, hidden-level rules, and all non-zoom opacity behavior. Do not build a replacement level-opacity system.

Per the master agent, preserve R3F instancing and shared material/resource lifetimes. Do not mutate a shared material to reset one instance. Keep boardPieces/boardHexes, conflict logic, model offsets, signed coordinates, and the 0.35 Y-level scale untouched.

Verify repeated zooms to single- and multi-hex pieces, bodies and caps on multiple levels, normal transparent terrain, preview appearance, selection, and camera framing. Search for remaining consumers before deleting zoom-fade state. Run npm run build; report visual checks separately from compilation.
```

### T09 - Select Pen Mode From Map Inventory

Source: TODO #9. Depends on: nothing.

**Copy-Paste Prompt**

```text
Make selectable terrain entries in View Map Inventory choose the corresponding pen mode. Read .github/agents/hexoscape.agent.md, locate that dialog's row renderer, and inspect src/controls/PenModeControls.tsx and the existing togglePenMode action in src/store/ui-slice.ts before changing anything.

Reuse the exact inventory-piece-to-pen-mode mapping used by existing controls. An entry representing a specific piece must select that piece and size; an entry representing a terrain family must use the existing family/default-size behavior. Headings, totals, and entries without a supported buildable mapping remain noninteractive. Respect current terrain-constraint rules; do not fabricate a mapping or create a piece. Leave the dialog open after selection, preserving its current close controls.

Use an accessible MUI button/row interaction with keyboard activation and visible focus. Per the master agent, pen mode is UI state, not boardPieces or derived boardHexes; selecting it must not alter inventory usage, conflicts, map persistence, or undo history. Preserve all R3F coordinates and the 0.35 Y-level rule.

Verify representative land sizes, obstacles, start zones where listed, constrained inventories, nonselectable summary rows, and Enter/Space activation. Confirm the next preview matches the chosen mode. Run npm run build and report any blocked mapping or unrun check.
```

### H01 - Editable Hotkey Configuration

Source: Hotkeys #1. Depends on: nothing; coordinate with H02 and T01 before adding new actions. Scope: existing allowed key combinations and existing actions only.

**Copy-Paste Prompt**

```text
Add an editor plus JSON import/export for existing Hexoscape hotkeys. Read .github/agents/hexoscape.agent.md, src/controls/useHotkeyConfig.tsx, src/controls/useApplyHotkeys.tsx, and existing settings/persistence patterns. Preserve the current defaults, action identifiers, allowed key-combination universe, and keyboard-library behavior. Do not add new actions, chord sequences, or a new shortcut engine.

Use MUI controls to assign one existing allowed combination to one existing action, or leave a combination unassigned; retain the current multiplicity of combinations per action. Preserve required nonconfigurable/reserved bindings. Persist only validated overrides in browser local state/storage using repository conventions, falling back to defaults for missing or invalid data. Keep hotkey badges/readouts and the runtime handlers on the same effective configuration.

Export a versioned JSON object containing the supported bindings. Import must validate version, object shape, allowed keys, known action IDs, and reserved bindings before atomically applying anything. Invalid input leaves the current config intact and shows a concise error. Avoid prototype-key assignment from imported data. Include reset-to-defaults. Reuse the project's file handling where available; do not touch map file import/export.

Per the master agent, this is React 18/Zustand UI state, not BoardPieces/BoardHexes state and not Zundo map history. Preserve input-field shortcut suppression and existing 3D actions; do not change coordinates or the 0.35 Y-scale.

Verify remapping applies immediately, old bindings stop firing, badges agree, reload persists overrides, reset works, valid export/import round-trips, invalid/unknown-version imports are atomic no-ops, and typing in form controls does not trigger map actions. Run npm run build and report checks not run. If the current code has no finite supported key/action contract, stop and report that specific missing contract rather than inventing it.
```

### P01 - Opaque PDF Sublevel Color Parity

Source: PDF/SVG #1. Depends on: nothing. Precedes: P02.

**Copy-Paste Prompt**

```text
Match PDF sublevel colors to the requested SVG appearance using opaque colors blended halfway with white. Read .github/agents/hexoscape.agent.md. Trace sublevel styling in src/svg-map, src/pdf-map, and src/pdf-svg-shared to the shared terrain palette and the PDF white-backer/opacity implementation.

For the affected sublevel terrain fill, compute each output RGB channel as round(0.5 * sourceChannel + 0.5 * 255), using existing color utilities where possible. Emit an opaque fill at opacity 1. Derive from the current-level source color, not an already faded value. Preserve current-level styling, outlines, labels, draw order, unrelated intentional transparency, and user style choices. Remove only backers made redundant by this change; keep geometry/masking backers that still serve another purpose. Avoid duplicate SVG/PDF palette logic.

The master agent requires checking both SVG and @react-pdf/renderer adapters; DOM SVG primitives cannot be copied directly into PDF. This is a presentation-only change: do not alter boardPieces, boardHexes, altitudes, transforms, or the 0.35 world-level scale.

Check known blends (black -> RGB 128/128/128, white -> white) and representative terrain colors. Render a map containing current and several sublevels in both SVG and PDF; verify matched faded fills, preserved outlines/text, and no cumulative darkening where shapes overlap. Run npm run build and report visual checks not run.
```

### P05 - Map-Specific PDF Legend

Source: PDF/SVG #5. Depends on: nothing. Bounded interpretation: one entry per distinct placed inventory piece type, ordered land, obstacles, abstract/gameplay.

**Copy-Paste Prompt**

```text
Add a compact map legend to Hexoscape PDF output. Read .github/agents/hexoscape.agent.md and inspect src/pdf-map, src/pdf-svg-shared, and existing piece labels/grouping in src/data/pieces.ts and src/data/pieceGroups.ts.

Derive legend entries from distinct inventoryIDs in boardPieces, not boardHexes, so multi-hex caps and clearance cells do not create extra entries and boardPieces-only start zones remain included. Use existing classification/labels and stable ordering: land first, obstacles second, abstract/gameplay last; use existing catalog order within each group. Include only types actually placed, without counts or unused inventory entries. Reuse each type's existing PDF-compatible symbol with its readable label. If an imported ID has no symbol, show its existing fallback label rather than crashing.

Place the legend after existing build instructions; use a compact multi-column grid in existing page margins, flow to another page when needed, and avoid splitting an entry's symbol and label. Omit the section for an empty map. Do not redesign the coversheet or add legend UI settings.

Per the master agent, inspect shared SVG helpers and PDF adapters; do not put DOM SVG elements into @react-pdf/renderer. Preserve shared symbol geometry/transforms and do not change standalone SVG exports, occupancy, map serialization, or the 0.35 Y-level convention.

Verify deduplication with repeated multi-hex pieces, inclusion of start zones and glyphs, group order, empty maps, long labels, and pagination with a broad catalog. Render the PDF and regression-check reused SVG symbols. Run npm run build and report checks not run.
```

### B03 - Inventory Availability in Pen Mode Selector

Source: Big TODO #3. Depends on: nothing; T10 may later revise the shared accounting provider.

**Copy-Paste Prompt**

```text
Show inventory usage/availability beside buildable choices in the pen mode selector. Read .github/agents/hexoscape.agent.md, src/controls/PenModeControls.tsx, and the inventory dialog's existing usage/remaining-count derivation. Reuse that derivation or its owning selector rather than counting occupancy cells or duplicating accounting.

For concrete piece entries, show used/available counts and a textual exhausted or over-budget state using existing MUI styling. For family-level entries, use an existing family summary if one exists; otherwise put per-size counts in the existing size control rather than inventing an aggregate that implies all sizes are interchangeable. When no finite inventory constraint exists, show no artificial zero or finite limit. Preserve the existing selection/filtering rules; this change is informational, not new enforcement. Counts must update after add, remove, convert, undo, redo, and constraint changes.

The master agent makes boardPieces the instance/inventory source and boardHexes derived occupancy. Never count caps, clearance cells, or subterrain instances as additional inventory pieces. Do not mutate map state or Zundo history to display counts, and do not change R3F placement or the 0.35 Y-level scale.

Verify available, exactly exhausted, over-budget, and unconstrained states; compare displayed values with the inventory dialog. Check multi-hex pieces, keyboard selection, long labels, and narrow layouts. Run npm run build and report checks not run.
```

## Bucket 2: Needs Clarification

Twenty-eight items. Answer these questions before commissioning implementation. Missing physical/art assets are deliverables, not coding-model limitations.

### T01 - Group LoS Blocker Size Hotkeys

Source: TODO #1. Related: H03 is the duplicate request; T01 owns implementation.

- Which exact piece families belong together, and what is the approved key-to-variant table for each, especially trees or variants with identical footprints?
- Should unsupported number keys do nothing, and should size switching retain rotation or normalize it to the destination's valid rotations?
- Should the visible size selector expose the same groups, and should constrained/unavailable variants be skipped or remain selectable?

### T02 - Simplify Glyph Appearance for OHS

Source: TODO #2. Precedes: T08.

- Which outputs change: 3D top-down view, SVG, PDF, or all three; is this always on or only an OHS setting?
- Does "remove the white" mean transparent glyph background, removal of a white outline, or removal of the entire glyph symbol; which remaining elements/colors should a reference image show?
- Should height labels be hidden only for the glyph overlay, or also for the underlying terrain hex, including covered glyphs and multi-level maps?

### T06 - Correct Laur Ruin Type Representation

Source: TODO #6. Related: M04 and M05. The source already names three ruin IDs in rotation handling; audit actual catalog/count/model behavior rather than assuming only one type exists in data.

- What are the authoritative names, per-set counts, footprints, and distinct identities of Laur ruins 1/2/3?
- Until models 2/3 exist, should those IDs be hidden from new placement, shown with explicitly labeled placeholders, or remain selectable with their current representation?
- How should existing maps containing those IDs render and report inventory without silently replacing their identities?

### T08 - OHS View Preset

Source: TODO #8. Depends on: T02 and a foliage material/mesh feasibility check.

- What exact camera/projection and output does OHS target, and what leaf opacity should apply to which jungle pieces? Can leaf materials be isolated in the current assets?
- Is this a reversible preset that snapshots/restores prior table, glyph, foliage, and camera settings, or an independent mode with temporary overrides; what happens when users change a setting while it is active?
- Which settings must be included beyond the three examples, and should the preset persist across maps/reloads or affect exports?

### T10 - Account for Outcrop Bases in Inventory

Source: TODO #10. Precedes: B08 and the final accounting integration for B07.

- Are perforated shadow bases separate placed pieces, an implicit bundled requirement, or attachments that must not be charged again if explicitly present?
- When Battle for the Underdark and Caverns of Valhalla are both available, who chooses between one 3-hex base and three 1-hex bases, and can equivalent combinations substitute freely?
- What are the authoritative base IDs, footprints, set quantities, and support/playability rules; must old maps imply these bases automatically or retain legacy accounting?

### H02 - Expand Hotkey Actions

Source: Hotkeys #2. Depends on: T01's mapping decisions; coordinate with H01's configuration schema.

- Which exact actions/terrain variants are in the first release, and which available/default key combinations should they receive?
- For conversion, choose a direct shortcut, a two-step key sequence, or terrain cycling; how do cancel, timeout, mixed selections, and unavailable sizes behave?
- Should "available" mean supported by the current size, present in allowed sets, or still remaining in inventory; which contexts suppress shortcuts?

### H03 - Similar-Terrain Size Cycling

Source: Hotkeys #3. Duplicate of: T01. Do not create a second handler or implementation ticket.

- Does "cycling" add a next/previous-family-variant action, or is it only the same direct number-key selection requested in T01? Answer alongside T01's mapping table.

### P02 - Original VirtualScape Style Option

Source: PDF/SVG #2. Depends on: P01 and an explicit style-parity checklist.

- Which VirtualScape version and reference exports define the palette, outlines, symbols, labels, and sublevel styles, including new terrain without an original equivalent?
- Is the style option PDF-only or shared with SVG, and where should it be selected/persisted?
- Which still-missing SVG styles block completion, and can a clearly defined subset ship before all of them are ported?

### P03 - Scale-Friendly Classic SVG Shapes

Source: PDF/SVG #3.

- Provide an exported SVG plus the Illustrator operation that fails: whole-document scaling, individual-symbol scaling, stroke scaling, clipping, or text conversion?
- What should remain proportional versus fixed-width, and which exact shapes besides Marvel ruin and hive are affected?
- Must the fix preserve editable vectors and current PDF appearance, and which Illustrator/export versions are acceptance targets?

### B01 - Major Editor UI Overhaul

Source: Big TODO #1. Precedes: B02, B17, B18, and the final editor integration for B20.

- Rank the always-visible controls for desktop and mobile: pen mode, viewing level, conflicts, inventory, selection, and build controls; what may collapse at each size?
- What are the primary workflows and minimum supported viewport sizes, and should web and Tauri share the same layout?
- Can this ship as incremental rearrangements of existing MUI controls, and what approved wireframe or acceptance scenarios define the first release?

### B02 - Persistent Inventory Surface

Source: Big TODO #2. Depends on: B01; shares accounting with B03/T10.

- Choose a docked sidebar, resizable panel, or collapsible floating overlay, including its mobile behavior and default visibility.
- Should it show map usage, remaining constrained inventory, owned sets, or all three; which actions and filters belong there?
- Does it replace or complement the inventory dialog, and which panel dimensions/collapse state should persist?

### B04 - Conflict Visibility or Heat Map

Source: Big TODO #4.

- Is the goal a binary highlight of existing conflicted piece UIDs, or a graded per-hex overlap count? The current single-owner BoardHexes matrix cannot supply overlap multiplicity directly.
- Should the view show hidden/covered pieces and vertical-clearance conflicts, and how should users select or inspect a conflicted group?
- Is this display-only over current conflict results, or must it also correct inaccurate detection? Binary display may be Flash-ready; overlap analysis or detector changes require a high-reasoning handoff.

### B10 - Extend VirtualScape Export Compatibility

Source: Big TODO #10. Existing export owner: [src/data/writeVirtualscapeMapFile.ts](src/data/writeVirtualscapeMapFile.ts). Do not commission a second exporter.

- Which community-hack/version pairs must be supported, and can you provide authoritative piece-ID/origin/rotation mappings plus known-good binary examples?
- For unrepresentable pieces, should export block, omit with an explicit report, or offer an approved lossy substitution? Existing support and policy must be audited first.
- What concrete importer limitation justifies the requested refactor, and which legacy fixtures must remain byte/semantically compatible? Once specified, hand coordinate/binary changes to a high-reasoning model.

### B11 - Import Community Figure-as-Terrain Hacks

Source: Big TODO #11. Coordinate with: B10; owner: [src/data/readVirtualscapeMapFile.ts](src/data/readVirtualscapeMapFile.ts).

- Which exact figure/hack IDs map to which Hexoscape terrain IDs, for which VirtualScape variants, and can you supply fixtures with known origins and rotations?
- If a code can mean either a genuine figure or a terrain hack, what metadata or explicit import choice disambiguates it?
- How should unknown/ambiguous codes be reported, and must export reproduce the original hack or only preserve the intended map semantics? Coordinate/rotation changes should go to a high-reasoning model after these answers.

### B12 - Arena of the Planeswalkers Pieces

Source: Big TODO #12. Includes Shandalar water/sand boards and ruins A/B.

- What are each piece's exact hex footprint, thickness, origin, valid rotations, support rules, and clearance/interlock rules, backed by measurements or diagrams?
- Are approved 3D assets and SVG/PDF symbols available, with licensing and scale/origin requirements settled?
- How should set inventory and board playability work, especially for flat boards versus ordinary tiles, and must these pieces round-trip through VirtualScape? Route constraint/schema changes to a high-reasoning model after specification.

### B13 - Custom Colors or User-Defined Terrain

Source: Big TODO #13.

- Is the first release palette overrides for existing terrain, or genuinely new piece definitions/sizes? These have very different persistence and constraint costs.
- Are colors/settings personal preferences or part of shared map files, and should 3D cap/body, SVG, and PDF colors be independent or linked?
- If custom terrain/textures are required, what templates, IDs, asset import limits, sharing behavior, and old-map fallback rules are allowed? Palette-only work may be Flash-ready; custom catalog/schema work is not.

### B15 - Reusable Template Library

Source: Big TODO #15. Depends on: B14's versioned template format.

- Which Heroscapers bilateral-symmetry templates are approved, where are their authoritative sources, and what redistribution permission/attribution is required?
- Does "bilateral symmetry" mean static prebuilt patterns or runtime reflection of arbitrary selections? Reflection requires orientation/chirality rules, not just cube translation.
- Should the library be bundled/offline, user-imported, or remotely updated, and should unsupported pieces or inventory shortages prevent placement?

### B16 - Glow-in-the-Dark Terrain

Source: Big TODO #16.

- Should toxic tiles and shroudshrooms use emissive materials only, bloom, or actual scene illumination; which mesh regions should glow?
- Is this an independent toggle or linked to a lighting/night preset, and what intensity/color reference should define the appearance?
- Which quality modes/devices must support it, and may it add postprocessing or extra lights? Preserve existing shared-material/instancing behavior in the eventual prompt.

### B17 - Tutorial

Source: Big TODO #17. Depends on: B01.

- Who is the first tutorial for, and which short workflows must it teach: first map, selection/editing, inventory constraints, or exports?
- Should this be a guided in-editor tour, interactive sample map, or static documentation, and how can it be skipped/restarted without modifying a user's map?
- Must progress persist and work offline in Tauri, and who supplies/approves the instructional copy?

### B18 - FAQ and Help Page

Source: Big TODO #18. Depends on: B01 and stable feature destinations.

- Which questions and approved answers are required, and who maintains links, terminology, and release-specific help?
- Should help open in an in-app route, dialog, or external site, and must it be available offline in Tauri?
- Which buttons should open features directly, and how should those actions behave when a map has unsaved work or an existing dialog is active?

### B19 - Adjustable Lights

Source: Big TODO #19.

- Which light types and limits are supported, and is this editing a fixed rig or adding/removing arbitrary lights?
- Are positions/colors/intensities global preferences or per-map data; what are defaults, reset behavior, and any intended map/share persistence?
- How should TransformControls compete with camera/build inputs, where can lights move, and should changes be undoable? If transform interaction or scene ownership changes are required, use a high-reasoning model.

### B20 - Homepage and Navigation

Source: Big TODO #20. Preserve all five requested destinations: Maps Gallery, Create New Map -> Editor, Load Map -> Editor, About -> Info/Tutorial, Download Desktop App -> release downloads.

- Should the first gallery use bundled official JSON maps or require D01's online database, and what browsing metadata/filtering is required?
- How should an existing/unsaved map, shared-map URL, direct editor route, and Tauri launch bypass or coexist with the new homepage?
- What defines Create New versus Load failure/cancel behavior, and should About/download destinations reuse existing documentation and release links or become in-app pages?

### M01 - Road Cap Asset

Source: Blender TODO #1. Coordinate with: M03.

- Should the road cap use textures/normal maps or actual added geometry, and what physical reference defines its final appearance?
- What are the triangle/texture budgets, supported quality modes, licensing requirements, and delivery format, including UVs, material slots, and seams across rotated hexes?
- Who produces the Blender asset, and which reference map verifies alignment with the existing 0.35-unit level scale and cap offset?

### M02 - Wood Cap Asset

Source: Blender TODO #2. Coordinate with: M03.

- Should planks/grain be texture-driven or geometric, and how should their direction behave under terrain rotation and adjacent/multi-hex placement?
- What approved references, UV/material conventions, triangle/texture budgets, and low/high-quality fallbacks define the asset contract?
- Who supplies the asset, and how will its origin, cap thickness, and 0.35-unit level alignment be verified in the existing R3F instancing path?

### M03 - Textures for All Solid Land

Source: Blender TODO #3. Includes M01/M02 as coordinated asset work, not duplicate implementations.

- Which exact terrain IDs and quality modes are in scope, and can you provide screenshots of the geometry-induced artifacts to be eliminated?
- Should textures replace existing high-detail geometry or supplement it, and what atlas/resolution/material-sharing and GPU-memory budgets apply?
- Who provides approved/licensed textures and UVs, and which desktop/mobile reference scenes define visual parity and performance acceptance?

### M04 - Refine Laur Ruin 1 Model

Source: Blender TODO #4. Coordinate with: T06.

- Which proportions/details are incorrect, and what photos, measurements, or marked-up reference define the corrected model?
- Must the current footprint/origin/material names remain identical, or do measured corrections also require clearance-template changes?
- Who delivers the replacement GLB/Blender source, and what mesh budget and scale/alignment checks must pass before replacement?

### M05 - Create Laur Ruin 2 and 3 Models

Source: Blender TODO #5. Depends on: T06's authoritative identities; coordinate with M04.

- What measurements, footprints, rotations, attachment/interlock details, and photo references distinguish ruins 2 and 3?
- Who will create the GLBs and SVG/PDF symbols, with which origin, material, mesh-budget, and 0.35-unit scale conventions?
- Must data/template support be corrected alongside the assets, and what placeholder behavior is acceptable until both are complete?

### D01 - Shared Map Database and Accounts

Source: Database prose. Scope retained: sign-in, short share URLs, saved maps, map browsing/search, map groups, aggregate terrain, and inventory-based group selection.

- What is the first-release subset, and which ownership/privacy rules apply to public, unlisted, private, editable, and deleted maps and groups? Which sign-in providers are acceptable?
- Does "free for everyone" allow owner-funded hosting, and what enforceable monthly budget, storage/upload/rate limits, moderation, and recovery requirements should govern provider selection? The TODO's cost estimates are not verified capacity planning.
- Must web and Tauri support offline edits/sync, and how should existing compressed URLs, map schema versions, concurrent edits, and unauthenticated reads migrate? Approve these contracts before a high-reasoning architecture/security implementation.

## Bucket 3: Superior Model Required

Nine structurally demanding items. These are high-reasoning handoffs, not permission to guess unresolved game rules. Use the shared contract above and the master agent in every session.

### T07 - Ship Conflicts at Level Zero

Source: TODO #7. Gate: measured legal/illegal placements for ship pieces at level 0 and nearby levels.

**Why:** Footprint, support, vertical clearance, rotation, permissive ownership replacement, and conflict restoration interact. A local altitude condition can fix one placement while breaking replay or displaced pieces.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md and inspect addPiece/removePiece,
map-slice, ship templates, rotation transforms, and board-utils.
Obtain a fixture table: piece, rotation, origin, altitude, neighboring
pieces, physical fit, support, expected conflicts. Do not guess level-0 rules.
For each fixture:
  expand templates into surface/support/clearance/interlock roles;
  trace the exact predicate diverging from the measured expectation;
  correct that predicate/template, preserving legal exceptions;
  verify both insertion orders and all displacedUIDs;
  verify remove/replay/load/move/undo/redo restores every affected owner.
Keep signed cubes and 0.35 level scale; do not clamp placement to level 1,
use mesh bounds, or replace the single-owner matrix opportunistically.
Validate representative rotations, level 0/1, and adjacent non-ship cases.
```

### P04 - Ladder Stack Summaries

Source: PDF/SVG #4. Gate: fixtures defining connected stacks versus disconnected/offset ladders, including rotation and attachment semantics.

**Why:** Counting ladders per coordinate loses vertical connectivity. Summary layout must distinguish connected components while keeping SVG/PDF projections and orientation consistent.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md and existing ladder placement,
height/attachment metadata, projection helpers, and export overlay layers.
Derive ladders from boardPieces, not clearance-cell counts.
Map each instance to its actual attachment face and vertical span.
Build adjacency only when endpoints, orientation, and attachment rules
describe a continuous stack; coordinate equality alone is insufficient.
Compute connected components; count physical ladder instances per component.
Group components at the intended projected hex; order bottom-to-top with
a deterministic tie-break. Render one count, or X/Y/Z for disjoint stacks,
inside the shared 1-hex + ladder symbol. Never count cells as ladder pieces.
Reuse shared geometry; implement compatible SVG and PDF adapters.
Verify lone, contiguous, gapped, differently oriented, and multi-component
cases, including wide labels and export scaling. Preserve 0.35 elevation
semantics and leave occupancy/serialization untouched.
```

### B05 - Mouse Wheel Rotates Active Preview

Source: Big TODO #5. Gate: specify trackpad accumulation/sensitivity and whether an invalid/conflicted preview still captures scrolling.

**Why:** R3F hit state, DOM wheel delivery, camera controls, gesture behavior, and rotation state must share input ownership without stuck controls or simultaneous zoom and rotation.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md and trace preview validity,
canvas wheel listeners, camera controls, and existing rotation helpers.
Define one derived ownership state: preview rotation or normal camera input.
When an approved active preview owns the wheel:
  consume the event before camera zoom using the actual control API;
  normalize deltaMode and accumulate trackpad deltas to discrete steps;
  apply existing allowed rotations, not arbitrary angle arithmetic.
Otherwise preserve current zoom and page-scroll behavior.
Restore camera input on pointer leave, mode change, dialog/focus change,
preview loss, and unmount; avoid global handlers and competing listeners.
Do not place pieces or write map history for preview-only rotation.
Preserve signed grid transforms, instancing, and 0.35 Y-scale.
Verify both wheel directions, trackpad gestures, nonrotatable pieces,
rapid state changes, modal scroll, and no simultaneous zoom/rotation.
```

### B06 - Stack Fluid Tiles

Source: Big TODO #6. Gate: physical thickness/support measurements for combinations and stack limits; approved SVG/PDF notation and persistence policy.

**Why:** Integer-level placement, half-height geometry, occupancy keys, support tolerances, inventory instances, and file formats currently share assumptions. Fractional altitude alone would not solve co-located pieces or cumulative height error.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md and audit altitude/ID assumptions
in types, add/remove, templates, replay, JSON/URLs, and VirtualScape I/O.
Use measured thicknesses; do not assume two fluids equal one solid level.
Compare explicit stack/sublevel metadata against a versioned finer-grid
schema. Propose the smallest model that keeps instances and occupancy
unambiguous. Obtain approval before changing the integer-level contract.
Keep 0.35 world units per standard level; derive fractional offsets from
approved dimensions without redefining world scale or cube coordinates.
Define mixed-fluid ordering, support/contact tolerance, maximum stacking,
collision rules, cap placement, and unsupported export policy together.
Implement one authoritative expansion/replay path and migrate old maps.
Verify place/remove/move/undo, inventory counts, multi-hex support, conflict
restoration, JSON/share round-trips, and SVG/PDF stack notation against
physical fixtures. Treat this as an opt-in nonstandard building rule.
```

### B07 - Fit a Map to Personal Inventory

Source: Big TODO #7. Gate: approved legal substitutions, preserved gameplay properties, and optimization priorities; T10 resolved if outcrop bases participate.

**Why:** Inventory-constrained substitution is combinatorial and may preserve footprint while changing heights, playability, support, or obstacles. Greedy terrain replacement can produce an unbuildable map.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md. Define demand from boardPieces
and the shared inventory accounting, never from boardHexes counts.
Approve substitution equivalences and objective ordering first:
gameplay invariants, minimum changed pieces, appearance, and shortages.
Generate only catalog-valid candidates preserving the required semantics.
Solve globally with an established solver if compatible with deployment;
bound runtime, support cancellation, and report unsatisfied constraints.
Dry-run the candidate map through existing occupancy/conflict reconstruction.
Return a proposed change list and conversion guide before mutation.
Apply accepted changes as one undoable transaction; preserve unaffected
UIDs and serialize only authoritative map instances.
Check infeasible inventories, alternate solutions, multi-hex pieces,
support/clearance exceptions, cancellation, and deterministic output.
Keep 0.35 elevation and existing cube transforms; never claim physical
validity solely because the known-incomplete collision matrix accepts it.
```

### B08 - Calculate Required Terrain Sets

Source: Big TODO #8. Gate: define objective (fewest sets, price, owned sets, or alternatives), supported set catalog, and substitute-base accounting from T10.

**Why:** This is an integer multiset-cover problem with duplicate sets, overlapping contents, and potentially interchangeable base requirements, not a simple list of sets containing each terrain.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md, inventory/set definitions,
and existing usage derivation. Build physical demand from boardPieces;
exclude conceptual helpers unless the approved inventory model counts them.
Let demand[p] be required quantity and supply[p,s] the content of set s.
Solve for nonnegative integer counts x[s] with supply * x >= demand,
under the approved objective and ownership limits. Model interchangeable
base allocations explicitly; do not charge every alternative at once.
Return selected counts, surplus, ties/alternatives, and impossible demands.
Use bounded/cancellable computation and deterministic tie-breaking.
Validate with small exhaustive fixtures, duplicate sets, unavailable/new
pieces, and unconstrained inventories. This is read-only analysis: never
mutate boardPieces, derived boardHexes, undo history, or 3D coordinates.
Do not interpret a catalog cover as proof that the physical build fits.
```

### B09 - Combine Smaller Pieces Into a Larger Piece

Source: Big TODO #9. Gate: permitted terrain mixtures, inventory-overage policy, and selection behavior after replacement.

**Why:** Exact rotated footprint matching must also preserve surface elevation, thickness, support, overlays, and stable transactional state. Equal projected area is not enough.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md and existing selection, piece
templates, rotations, and map transaction APIs.
Restrict the first implementation to approved compatible land selections.
Expand selected actual footprints; reject overlaps, holes, differing
surface/placement semantics, incompatible thickness, and unsupported types.
Normalize signed cube footprints; compare the union against candidate
larger-piece templates under valid rotations/translations using helpers.
Offer only geometrically equivalent destination terrains/sizes.
On confirmation, dry-run removal and replacement, preserving neighboring
pieces and overlays and checking affected support/conflicts and inventory.
Commit atomically with a fresh replacement UID and one undo step;
undo restores every original instance/UID and selection consistently.
Verify rotated multi-hex unions, negative coordinates, near-matches,
elevation mismatches, conflicts, and save/load. Never replace caps as if
they were instances, or conflate surface L+1 with placement L.
```

### B14 - Copy/Paste and User Templates

Source: Big TODO #14. Precedes: B15. Gate: anchor selection, altitude normalization, conflict acceptance, and whether rotation is in the first release; reflection is not implied.

**Why:** A group transform must reconcile piece-specific origins/rotations, relative elevations, fresh identities, collision replay, atomic history, and a portable template schema.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md and existing selection, placement,
cube rotation helpers, persistence conventions, and transaction boundaries.
Capture selected boardPieces, not derived boardHexes/caps/clearance cells.
Represent a versioned template with approved anchor and relative cube
origins/altitudes; store catalog IDs and orientations, not live UIDs.
Validate imported/stored templates and reject or explicitly report
unsupported schema versions/piece IDs without partial placement.
Transform relative origins and orientations with existing helpers;
resolve piece-specific origin offsets before placement. Preserve signed
cubes and 0.35 world-level scale. Do not implement reflection by negating
coordinates without an approved chirality/orientation contract.
Preview the whole group, then place with fresh UIDs through the existing
constraint/replay engine using the approved conflict policy.
Commit one undoable transaction; no partial paste on failure/cancellation.
Persist named templates in existing local storage conventions and allow
the approved anchor editor without changing already placed instances.
Verify multi-level groups, obstacles, overlays, rotated multi-hex origins,
repeated pastes, conflict restoration, undo/redo, and save/load.
```

### S01 - Interactive 2D SVG Builder

Source: 2D SVG Builder prose. Scope retained: zoom/pan, selection, rotation, terrain conversion, then explicit parity with 3D. Gate: first-release parity checklist, level/occlusion rules, and hit-testing policy for stacked/overlapping pieces; "maybe even more" is not an acceptance criterion.

**Why:** An editor needs inverse projection/hit testing and interaction state, while the existing SVG output is export-focused and shared with PDF. A separate SVG mutation engine would drift from 3D constraints and history.

**High-Reasoning Handoff**

```text
Read .github/agents/hexoscape.agent.md, src/svg-map, src/pdf-svg-shared,
src/pdf-map, and existing selection/map commands.
Separate screen-only interaction from reusable export geometry.
Add a bounded pan/zoom transform and inverse screen-to-board projection
using current cube helpers; never treat cube r as world elevation.
Define visible-level and overlap hit priority. Resolve a clicked body,
cap, or overlay back to its owning BoardPiece UID; do not select cells
as independent inventory instances.
Use existing selection and store actions for rotation/conversion/placement;
share command semantics with 3D, not a second BoardHexes engine.
Phase delivery: pan/zoom -> select -> rotate/convert -> approved build parity.
Keep interaction handles/listeners out of exported SVG and PDF primitives.
Verify negative coordinates, zoomed hit targets, overlapping levels,
multi-hex origins, overlays, keyboard/touch behavior, undo/redo, view
switching, and unchanged SVG/PDF geometry/text/transforms. Preserve the
0.35 level scale when projecting or synchronizing with the 3D view.
```

## Completion and Replanning Rules

- T01/H03 are one implementation with two source references; do not pay for duplicate hotkey work. M01/M02/M03 share an asset/material contract but retain separate acceptance targets.
- B10 extends the existing exporter; B11 extends the existing importer. Confirm mappings and fixtures before considering shared refactoring, with Odd-R/cube and rotation round-trip checks.
- For unanswered items, record approved decisions next to their IDs and create a bounded prompt before moving them into execution. Asset-only production remains assigned to an asset author even if integration is Flash-ready.
- A task is done only when its behavior checks pass and unverified platform/visual/physical cases are explicitly recorded. Keep implementations separate from this planning document; do not silently broaden a Flash ticket into schema, physics, or collision-engine work.