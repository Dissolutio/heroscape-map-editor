Nov-05-2026
TLDR: Saved selections, one 3D | 2D | PDF switch, click empty ground to deselect, size hotkeys for trees and outcrops, a piece legend and ladder counts in the PDF, a textured Marro Hive, a Show Objective Markers switch, and fixes for wood, side textures and missing hex sides.

- **Saved selections**: Selection history is replaced by something more useful. Each action in the action log that touched pieces now has a link: click it to select those pieces again (Shift-click adds to your selection). You can also save the current selection with a name, and your saved selections sit above the action log. They are kept in your map file.
- **3D | 2D | PDF switch**: One control in the top bar switches between the three views, and shows which one you are in.
- **Size hotkeys for obstacles**: The number keys now pick the size of trees, outcrops and other obstacle families, the same way they already did for land.
- **PDF piece legend**: Build instructions can now include a legend of just the pieces used in your map, with each symbol and a few words. It is optional.
- **Wood caps follow the piece**: The planking on a wood cap now runs along the piece in all six rotations, like the real tile, and wood caps are never randomly rotated.
- **Side textures are no longer mirrored**: Last release turned them right way up; now they are not flipped left to right either, so your own height-map and diffuse images read correctly.
- **Action log**: The "seconds ago" labels are gone. Entries just fade away when you are idle, and hovering still shows the full history.
- **Rotate hotkeys**: Rotating a selected piece with Q or E no longer leaves a ghost piece behind.
- **Show Objective Markers**: A new switch in the View tab, next to Start Zones, hides objective markers in 3D. When hidden they can't be clicked, selected or dragged, and placing one shows a message instead of nothing. It is on every time you open the app, so you can't lose your markers by accident, and it never changes your map, share links, or the 2D and PDF views.
- **Objective marker numbers face you**: The number or letter on a marker now always turns to face the camera, so it reads right from any angle and in map pictures. The marker itself does not move.
- **Textured Marro Hive**: The Marro Hive has a new, lighter model with its real painted look: green webbing, cream ridges and ornament. Medium and High graphics show the texture, High adds a glossy shine, and Low keeps the flat color.
- **Click empty ground to deselect**: With the select pen, clicking an empty hex clears your selection. Shift-click and the placing pens work as before.
- **Ladder stack counts**: When ladders are stacked, the 2D and PDF build instructions show how many (for example "x3") next to the bottom ladder.
- **PDF colors for lower levels**: Pieces on levels below the one on the page now use flat colors that match the 2D map. The 2D map itself did not change.
- **Missing hex sides**: Some hex sides along the map edge could be missing and show the table through them. A side is now hidden only when a neighbor that is actually drawn covers it. If you still see one, tell us which hex.
- **Under the hood**: The old "High Quality render" path and its unused model files are gone; the graphics levels replace them. Your saved settings still load.
- **Zoom to Piece**: Removed an old fade effect that was not working, so Zoom to Piece only moves the camera.

Nov-02-2026
TLDR: Selection history, a quiet action log, q/e hotkey rotate, and a bunch of rendering fixes, including upside-down textures and a Windows 3D fix.

- **Action log**: Bottom-left of 3D view, the action log shows what you just did. Hover it to scroll back through the recent history. Toggle on/off in the View tab.
- **Undo and redo bring your selection back**: Undoing or redoing an action now selects the pieces it touched. Multi-select three pieces, move them, click somewhere else, then undo, and your three pieces are selected again.
- **Selection history**: Back and forward buttons and a list of recent selections in the selected-piece readout (and hotkeys) let you jump back to something you had selected a minute ago. It is not saved with your map.
- **Rotate hotkeys while you drag**: The rotate keys (Q and E by default) now rotate whatever you are dragging, or your selected pieces.
- **Use as Pen**: A new button in the selected-piece readout sets your pen to the selected piece.
- **Zoom to a selected Laur wall**: The zoom button for Laur addons was broken.
- **Side textures are the right way up**: The side textures were upside down...
- **Fluid caps under overhangs and ladders**: A fluid cap was not rendering when something was directly over it, eventhough it was visible.
- **Windows desktop app: 3D view recovery**: If the 3D view cannot start, the app now retries, and if that fails it shows a recovery panel with a "Copy diagnostics" button.
- **Old maps load all their pieces**: Some older or hand-edited maps stored numbers as text and lost pieces on load (59 pieces in one case). They load complete now.
- **Objective marker names in share links**: Names now travel in share links as long as the link stays a reasonable size.
- **PDF build instructions**: Glyphs are drawn at full size again.
- **Under the hood**: Edge pieces (battlements, road walls, rope ladders) now share a common edge system, which sets us up for better previews and placement, plus quieter developer warnings and more tests.

Oct-30-2026
TLDR: Textures! Tune your 3D graphics. Add named objective markers, better map pictures.

- **Graphics levels**: Low=low-poly & flat colors, fastest performance. Medium adds terrain texture images. High adds full PBR textures (real-looking relief, sheen and shadowed crevices), plus lights and shadows. Pick one in the View tab.
- **3D Look panel**: Tune the lighting, brightness, shine, background and table color, and watch the 3D view change live while it stays open. Hover any control an explanation of what it does. Reset puts everything back, and you can copy your settings to share them. Handy for map pictures.
- **Field of view**: A new slider in the 3D Look panel sets how wide the perspective camera sees: low is zoomed-in and flat, high is wide-angle and dramatic. It is saved with your other look settings, and map pictures use it too.
- **Transparent map pictures**: Saved as a PNG you can drop straight onto your own artwork. The crop dialog shows a checkerboard behind it so you can see the transparency.
- **Picture-only High**: Keep working on a lighter level, and have High used just for the moment you take a map picture.
- **Objective markers**: Place numbered or lettered markers (1 or 2 hexes, black or white) on the map, with an optional name (type a unit name and pick from suggestions). Click one to select it from any pen mode, then edit it in the selected-piece readout, drag it around. After you place a numbered marker the next one is numbered for you (the next free number for that color, and undo and redo keep it in step); tick "Pin number" to keep the same number. Two-hex markers are a sturdier shape with centered text in 3D. Markers show up in the 2D and PDF build instructions, filling their hexes like land tiles, with a legend. They are saved with your map file but don't ride along in share links, yet.
- **Laur ruins on pillars**: A Laur ruin (or wall) on a pillar no longer reports a false conflict with the land the pillar stands on.
- **Ancient Shroudshroom marker**: The 2D and PDF build instructions draw a thick gray line from the center of the origin hex toward its outer corner, stopping at the border, so you can tell which way this three-hex obstacle blocks movement. The line denotes the side that least obstructs adjacent hexes.
- **Crop right after you take a picture**: Taking a map picture now opens a cropping dialog right away, with a live preview of the result. It still opens from Edit Map.
- **Sharper map pictures**: Map pictures were coming out grainy. They now keep up to 1920 pixels at much higher quality. If your browser runs out of room to store the full-size one, a smaller copy is kept for the map and the full one still goes into your downloads and PDF.
- **Full terrain set names**: Required Terrain in the PDF build instructions, tooltips and set summaries now say "Swamps of Valhalla" instead of abbreviations. The sets list is gone from the app-header so your map name has room.
- **Treasure glyph color**: In 2D and PDF build instructions, treasure glyphs now have their own gold color. Power glyphs keep their orange. Virtualscape or Classic color scheme still pending, but still on the agenda.
- **Glyph options for OHS-style maps**: New switches in the SVG and PDF export options make glyph fills see-through, and hide the heights under glyphs, while keeping the glyph symbol and outline visible. We can refine this for best OHS maps.
- **Pieces Grid and Map Inventory**: Your search and filters survive zooming to a piece and reopening the grid. Click an available piece in the Map Inventory to start placing it. You can't shrink the map past pieces that are still on it, and a notification explains why.
- **Under the hood**: More tests, and a cleaner foundation for adding new terrain.

Oct-27-2026
TLDR: Generic pieces. Buried piece markers. Asphalt isn't black on black. New release terrain kits, some new terrain. Better stackable Laur pieces. Drag and drop all multi-selected piece types. Spin the scroll wheel while dragging, to spin piece. Choose your pivot for rotations.

The goal with the latest changes, before textures come in and maybe cause bugs, is to make map-building FASTER. More to come after we polish the looks a little bit.

- **Generic terrain pieces**: Add Generic solid and fluid hexes in the sizes you need, without requiring inventory counts or terrain-set records. Choose separate cap and side colors for solid and fluid Generic terrain in the View tab; these colors are saved with your settings and used in 3D, 2D, and PDF views.
- **Buried-tile marks in build instructions**: Optional marks identify land tiles whose tops or sides will be covered. Turn them on separately for PDF and 2D/SVG exports; PDF marks use superscripts and have improved spacing.
- **Laur add-on placement feedback**: Laur wall add-ons, when you are placing them, try hovering around the hex you want to place in. The algo should be smart about where the piece is going to go.
- **Laur add-on footprints and stacking**: More color feedback to advise you as you build.
- **What's New dialog**: See release notes for updates since your last visit.
- **Safari stale-file recovery**: Safari was breaking sometimes when Hexoscape updated, that should stop.
- **Drag more pieces**: Laur pillars and wall add-ons, battlements, road walls, rope ladders, start zones and ladders can now be dragged, alone or several selected together. Dragging a ladder moves it and every ladder stacked above it.
- **Rotate a selection around a pivot hex**: With one or more pieces selected, the rotate buttons turn them together, 60 degrees at a time, around a cyan hex marker. Click a different hex of the last selected piece to move the pivot. If it cannot fit, it won't rotate.
- **Rotate while you drag**: Scroll the mouse wheel while dragging to rotate the piece or group around the part you are holding. Ladders rotate to face the side of the hex your pointer is on.
- **Hide start zones in 3D**: A new switch in the View tab hides start zones in the 3D view, handy for photos. They come back on every visit, so nobody loses their zones by accident.
- **Maps grow to fit on load**: If a loaded map has pieces hanging past its edge, the map grows to fit and tells you. Pieces absurdly far away are left out with a warning instead of freezing the app.
- **Stackable Laur pen modes**: The stackable pillar, short wall and long wall each have their own pen mode. Placing a regular pillar or wall on a stack switches to the stackable version for you.
- **Laur symbols in exports**: Stackable walls, ruins 2 and 3 and the stackable pillar now show up in 2D and PDF build instructions. Ruins 2 and 3 (the Ruinds at Laur's Edge variants) still need 3D models, but we're getting closer to a full distinction. Note: The original Laur ruins variant from AoA can physically stack, the 2 new ones from RALE physically cannot.
- **Asphalt border in PDF**: With colored outlines turned off, Asphalt gets a readable gray border instead of black on black.
- **View tab tidy-up**: Long explanations moved into tooltips, and the camera options only show in the 3D view.
- **New map dialog**: Create New Map now asks for the author and notes, like Edit Map Details, with an optional "Remember my name for new maps"
- **New terrain: Toxic Wastelands of Valhalla, Tournament Organizer Terrain Kit 2, Organized Play Expeditions Kits Promo**: Pick them in your terrain constraints. New pieces: the 3-hex Toxic tile and Toxic Rock Outcrops (1 and 3).
- **Under the hood**: Tests, security, and tidiness.

Oct-18-2026
TLDR: Click and drag *most* pieces, including multi-selected pieces. Better piece previews. Saved user settings.

- **Desktop App: fullscreen no longer crashes**: Clicking "Enter fullscreen" in the desktop app crashed it. Now it makes the app window fullscreen, and "Exit fullscreen" brings it back.
- **Auto zoom to the map, every time**: This was happening sometimes, now it should always work
- **Drag a piece to move it**: Drag and drop a piece once it is selected. (Works on most pieces: not laur wall stuff, ladders, battlements, roadwalls)
- **Drag several pieces together**: You can drag your multi-selected pieces. (Unless one is unsupported)
- **Preview before you place**: Hovering with the pen shows a green / orange / red footprint for where a piece would go
- **Placement rules match the real pieces**: Only a castle wall bottom or wall walk connects to the top of a castle wall; battlements, road walls and rope ladders can't go on a castle wall; a castle arch must be placed on land; triangle and square Laur pillars can't stack on each other; Laur wall add-ons need a pillar and can't go on a castle wall. Placing a piece so it hangs off the edge of the map is blocked with a message instead of half-working.
- **Ships**: Placing a ship bow near the map edge no longer crashes. The section on the bow/wall that wasn't highlighting correctly, does now.
- **Lingering preview pollution**: The ghost preview could tint the real pieces' colors. Fixed.
- **Map autosaves**: Our localStorage strategy looked like it was written by a Nagrub and threw errors like it was Jotun. It's way smarter now.
- **Remembers your settings**: Your settings, your pen mode and size, and light positions are remembered between visits (this replaces the earlier note that light positions weren't saved after reloading). New **Reset settings** and **Reset lights** buttons put them back.
- **Skipped pieces are reported when you load a map**: Maps with pieces this version doesn't know (for example from a newer version, or a Virtualscape file with unmapped codes) now load without them and show one warning listing what was skipped, instead of crashing or silently dropping them.
- **Crash reports**: The crash report dialog is now a simple anonymous feedback form. It used to ask for your name and email, which was a weird default.
- **Under the hood**: Dependency security fixes (build tools and the desktop updater's TLS library), a much larger automated test suite, and browser tests that run on every pull request.

Oct-17-2026
- **Altitude Smart Placement**: When you go to place a multi-hex piece, if it can't fit on that level, the app will check all the levels above it to see if it fits there.
- **Light controls and remembered positions**: With lights and shadows enabled, use the new **Show Light Controls** toggle in the View tab to hide the repositioning handles without changing the lighting. Moved lights keep their positions when lighting is turned off and back on during the current session; positions are not saved in map files or restored after reloading the app.
- **Stack fluid tiles on fluid tiles**: Water (and other fluid/half-height tiles) can now be placed on top of another fluid tile, and it rises half a level instead of a full level. Solid tiles can be placed on top of these half-level stacks. The level slider, hotkeys and SVG export include the half levels, and when every selected piece is a stacked fluid tile you get buttons to move it up or down half a level. Glyphs and start zones still go on a whole level above the map.
- **Convert start zone pieces**: Select start zone pieces, you can convert them to other start zone colors/players
- **Fluid tiles no longer see-through in 3D**: The transparency looked wrong with fluid stacked on fluid, so fluid tiles are now solid colors
- **Focus a piece: no more fade**: The focus button now just moves the camera to frame the piece, without fading out everything else

Sep-27-2026
- **Hotkeys 1-5 map to sizes 1,2,3,7,24, 6-7 map to other sizes**: Many terrains have 5 "standard" sizes: 1,2,3,7, & 24-hexes. Now, when you have a solid or fluid (AKA full-height or half-height) terrain selected as your pen mode, the hotkeys numbered 1-5 will map to those 5 standards sizes. So pressing "5" will always select the 24-hexer for a terrain, or do nothing if there is no 24-hexer for that terrain Some terrains have a special size, like the marvel concrete 6-hex piece, or the ice/glacier 4-hex and 6-hex, or the castle wall-walk 7-hex and 9-hex. These special sizes will map to hotkeys 6-7 for all terrains.
- **Desktop App now auto-updates**: When you start the app, it will check if there is a new version, and safely upgrade/restart if you confirm. I have only tested this on linux, not windows or mac.
- **New way to load map: paste in URL**: The desktop app did not have a way to load URL-shared maps, now you just paste the URL into a text box and you can load the map. This feature is also on the website.

Sep-23-2026
- **3D Asphalt color**: Now with less blue
- **3D Legacy StartZone**: They were displaying at a right angle, fixed 
- **PDF format condensed cover sheet**: As requested, new format puts the inventory right on the cover sheet, allowing a 5 level map to be printed double-sided onto 1 sheet of paper. 
- **PDF/SVG StartZone render on own level**: It wasn't displaying properly, now it is
- **PDF level logo alignment**: The StartZone/Glyph level was not aligning, should be better 
- **Tile Letters on 2-hexers**: Now the letter will always display on the left-most hex 

Sep-12-2026
- **3D StartZone previews**: See a preview now before you place a start zone
- **Desktop App**: The app, when published to the web, will also be published as 3 desktop app downloads for Mac/Windows/Linux, and install instructions
- **Hex Height Text: Toxic Water**: White text for hex height was not visible on toxic water, switched to black
- **Fix Memory Leaks/Instancing Subterrains**: Code changes were made to further minimize RAM usage, improve graphics performance, improve ray casting speed

Sep-08-2026
- **StartZone bugs: conflicting with ruins**: StartZones will no longer conflict with other pieces they are placed next to, like ruins and fortified wall. Also, clicking a hex with a StartZone will no longer place a duplicate.
- **PDF: Bugfix: small map level on last page**: If you had a page with less than 3 map levels on it, they would print too small
- Some changes to make the SVG export images more friendly with other software

- **PDF/SVG tile letters**: Many full-height and half-height tiles now have a letter on their tile as an abbreviation for their terrain, to help visually distinguish them in another way. This matches contemporary maps such as the 2026 GenCon map build instructions.
- **Bugfix for roadwall**: The roadwall has had a strange bug where it displays in the center of the hex and does not visually "fit" right

Sep-04-2026
- **PDF formats full text**: Both formats now display map notes, required sets
- **Bugfix for convert liquid=>solid**: Display was going wonky when you converted fluid terrain to solid terrain. (half-height to full-height)
- **PDF/SVG Level Logos**: Toggle on/off, now the level logo from official publications can be on your build instructions. Also, 2D/SVG exports of map levels will have the level logo in the export for you to use in your own editing software

- **PDF Tile Borders: Black & Blue**: When PDF Color Borders is disabled, which is the default, then full-height tiles will have black borders, and half-height tiles will have blue borders. This will differentiate Asphalt from Shadow easily, and hopefully not overload the colors present too much.
- **Marvel Ruin Bug**: Hex heights should now display properly underneath a marvel ruin (with wall, 2 hex heights were missing, with wall destroyed, 4 hex heights were missing)
- **Ancient terrain color**: updated in 3D render
- **PDF Laur Wall/Pillars**: updated to mirror the 2D view/contemporary styles
- **PDF Grid Lines toggle**: show grid lines under sublevel, or over sublevels

Sep-02-2026
- Feature: Middle-click a placed piece to select it as the current pen mode (with hotkey shift+z to do it with a left-click)
- Feature: Share URL for build instructions - regular URL and Markdown link buttons (you can link directly to your map's build instructions, but the map image & map notes you may have on your computer will NOT transfer)
- Improvement: More legible personal piece inventory editing - clearer layout
- Improvement: Hotkey text shown on relevant camera buttons, with tooltip on hover
- Bug: Fixed camera zoom issue on newly created maps

Aug-30-2026
- Bug:color: Share-URL button broke when trying to share a map with a picture 
- Feature: PDF Layout Format option (1 page coversheet) available in View tab
- An option that applies to all views: Enable/Disable legacy start zones. This just means opting between circles and Virtualscape based colors, or hexagons and contemporary colors
- Color changes: 3D display color of wellspring water, 3D lights now all use white light, PDF Heroscape logo is now black, laur short wall was getting wrong sublevel color in SVG
- View tab: Only the options for current view are shown (3D, 2D, or PDF)