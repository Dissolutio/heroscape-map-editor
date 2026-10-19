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

Sep-08-2026 PM
- **StartZone bugs: conflicting with ruins**: StartZones will no longer conflict with other pieces they are placed next to, like ruins and fortified wall. Also, clicking a hex with a StartZone will no longer place a duplicate.
- **PDF: Bugfix: small map level on last page**: If you had a page with less than 3 map levels on it, they would print too small
- Some changes to make the SVG export images more friendly with other software

Sep-08-2026
- **PDF/SVG tile letters**: Many full-height and half-height tiles now have a letter on their tile as an abbreviation for their terrain, to help visually distinguish them in another way. This matches contemporary maps such as the 2026 GenCon map build instructions.
- **Bugfix for roadwall**: The roadwall has had a strange bug where it displays in the center of the hex and does not visually "fit" right

09-04-2026 PM
- **PDF formats full text**: Both formats now display map notes, required sets
- **Bugfix for convert liquid=>solid**: Display was going wonky when you converted fluid terrain to solid terrain. (half-height to full-height)
- **PDF/SVG Level Logos**: Toggle on/off, now the level logo from official publications can be on your build instructions. Also, 2D/SVG exports of map levels will have the level logo in the export for you to use in your own editing software

09-04-2026
- **PDF Tile Borders: Black & Blue**: When PDF Color Borders is disabled, which is the default, then full-height tiles will have black borders, and half-height tiles will have blue borders. This will differentiate Asphalt from Shadow easily, and hopefully not overload the colors present too much.
- **Marvel Ruin Bug**: Hex heights should now display properly underneath a marvel ruin (with wall, 2 hex heights were missing, with wall destroyed, 4 hex heights were missing)
- **Ancient terrain color**: updated in 3D render
- **PDF Laur Wall/Pillars**: updated to mirror the 2D view/contemporary styles
- **PDF Grid Lines toggle**: show grid lines under sublevel, or over sublevels

09-02-2026
- Feature: Middle-click a placed piece to select it as the current pen mode (with hotkey shift+z to do it with a left-click)
- Feature: Share URL for build instructions - regular URL and Markdown link buttons (you can link directly to your map's build instructions, but the map image & map notes you may have on your computer will NOT transfer)
- Improvement: More legible personal piece inventory editing - clearer layout
- Improvement: Hotkey text shown on relevant camera buttons, with tooltip on hover
- Bug: Fixed camera zoom issue on newly created maps

08-30-2026 AM
- Bug:color: Share-URL button broke when trying to share a map with a picture 
- Feature: PDF Layout Format option (1 page coversheet) available in View tab
- An option that applies to all views: Enable/Disable legacy start zones. This just means opting between circles and Virtualscape based colors, or hexagons and contemporary colors
- Color changes: 3D display color of wellspring water, 3D lights now all use white light, PDF Heroscape logo is now black, laur short wall was getting wrong sublevel color in SVG
- View tab: Only the options for current view are shown (3D, 2D, or PDF)