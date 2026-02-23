FONT NOTES:
So, a little more digging on the font issue. It is possible to convert the texts to paths dynamically, meaning the app can do it on export. However, the only way I've found to do this currently is to use a ubiquitous font such as: Arial, Times New Roman, and Courier New,  as these fonts exist on most machines by default.

The other option is to use an external app, like Inkscape or Illustrator, to convert the custom font to paths, and use these paths in the app. The downside here is that every set of characters (i.e. "H", "10", "7") would need to be converted individually, and anytime we added a new character set (like a new glyph), we would need to perform this conversion and add the new paths to the app. Which could be a little cumbersome but not overly so.

I have tested the text-to-path conversion from the app, and it unfortunately outputs the characters in Arial font. Here is an example export that you can test in Illustrator to see, at the very least, if using paths

REMAINING TASKS (estimated at 1 hour each):
~~- Publish the export-map-level-to-SVG function~~
~~- Sub-level colors (less saturated)~~
~~- Scale border thickness~~
~~- Snowflake (snow/ice tiles)~~
~~- Road decor (road tiles)~~
~~- Toxic land / water~~
~~- Laur walls/addons~~
~~- Font scaling (evergreens, rock/lava outcrops, jungle, laur wall arch)~~
~~- Road walls~~
- Glyphs
- Startzones
- Objective/meta markers
- Put start zones, glyphs, markers on a separate level

Old terrain to be updated:
- Hive (just do text "Hive" to keep it simple & scaleable on svg export)
Ruins 2
Ruins 3
Ruins Marvel

Battlement
Ladder
Castle Corner / End / Straight / Arch