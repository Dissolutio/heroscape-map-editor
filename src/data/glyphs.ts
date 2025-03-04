type HexoscapeGlyphs = {
  [key: string]: {
    id: string
    name: string
    shortName: string
    glyphLetter: string
    type: string // power, temporary, ( someday?: permanent, treasure, objective)
    effect: string
    description: string
  }
}

/* 
AOA GLYPHS
Permanent
// Brandar
// Dagmar init +8

Glyph of Rannveig (Wind): All figures with the Flying Special Power lose this power and cannot Fly while a figure is standing on the Glyph of Rannveig.

Glyph of Xenithrax Vines (Vines): If a Huge figure moves onto this Glyph, this Glyph is immediately removed from the battlefield and that figure may continue its movement. Figures standing on this Glyph roll 1 fewer attack die and 2 fewer defense dice. When a figure on this Glyph moves off of the Glyph, roll one attack die. If you roll a skull, that figure takes one wound. Remove this Glyph from the battlefield after a figure moves off of it, or at the end of the round if a figure is standing on it.

Glyph of Yadulkia (Disengage): Your figures are never attacked when leaving an engagement.

Temporary
Glyph of Felaron (Glyph Removal) Remove any other Glyph from the battlefield.
Glyph of Haukeland (Healing) When one of your figures stops here, you may remove up to 3 Wound Markers from across any of your Army Cards.
Glyph of Mitonsoul (Massive Curse): When a figure lands on this Glyph, all players must roll the 20 sided die for all their own figures. If a 1 is rolled, than that figure is destroyed. On a 2 or higher, that figure is safe.
Glyph of Quillivon (Sudden Movement): Choose up to 3 of your figures other than the one on this Glyph. You may move each of the chosen figures up to 5 spaces.
*/

export const powerGlyphs: HexoscapeGlyphs = {
  // TEMPORARY GLYPHS
  // Glyph of St
  //  Glyph of Felaron (Glyph Removal): Remove any other Glyph from the battlefield.
  //  Glyph of Yadulkia (Disengage): Your figures are never attacked when leaving an engagement.
  // Glyph of Xenithrax Vines (Vines): If a Huge figure moves onto this Glyph, this Glyph is immediately removed from the battlefield and that figure may continue its movement. Figures standing on this Glyph roll 1 fewer attack die and 2 fewer defense dice. When a figure on this Glyph moves off of the Glyph, roll one attack die. If you roll a skull, that figure takes one wound. Remove this Glyph from the battlefield after a figure moves off of it, or at the end of the round if a figure is standing on it.
  // Glyph of Haukeland (Healing): When one of your figures stops here, you may remove up to 3 Wound Markers from across any of your Army Cards.
  healing: {
    id: 'haukeland',
    name: 'Quillivon (Sudden Movement)',
    shortName: 'Sudden Movement',
    glyphLetter: 'Q',
    type: 'temporary',
    effect: 'Move 3 figures',
    description: `Choose up to 3 of your figures other than the one on this Glyph. You may move each of the chosen figures up to 5 spaces.`,
  },
  suddenMovement: {
    id: 'quillivon',
    name: 'Quillivon (Sudden Movement)',
    shortName: 'Sudden Movement',
    glyphLetter: 'Q',
    type: 'temporary',
    effect: 'Move 3 figures',
    description: `Choose up to 3 of your figures other than the one on this Glyph. You may move each of the chosen figures up to 5 spaces.`,
  },
  removal: {
    id: 'felaron',
    name: 'Felaron',
    shortName: 'Removal',
    glyphLetter: 'F',
    type: 'temporary',
    effect: 'Remove a glyph',
    description: `Remove any other Glyph from the battlefield.`,
  },
  // CLASSIC TEMPORARY
  objective: {
    id: 'objective',
    name: 'Brandar',
    shortName: 'Objective',
    glyphLetter: 'B',
    type: 'power',
    effect: 'Artifact',
    description: 'The rules of this Glyph vary, depending on the Scenario.',
  },
  summoner: {
    id: 'summoner',
    name: 'Erland',
    shortName: 'Summoner',
    glyphLetter: 'E',
    type: 'temporary',
    effect: 'Summon figure',
    description: `When a figure lands on this Glyph, choose any one figure (yours, a teammate's or an opponent's) and to place on an adjacent space.`,
  },
  healer: {
    id: 'healer',
    name: 'Kelda',
    shortName: 'Healer',
    glyphLetter: 'K',
    type: 'temporary',
    effect: 'Heal hero',
    description:
      'When a Hero you control lands on this Glyph, remove all wound markers from it. If a Squad figure lands here, nothing happens.',
  },
  curse: {
    id: 'curse',
    name: 'Mitonsoul',
    shortName: 'Curse',
    glyphLetter: 'M',
    type: 'temporary',
    effect: 'Massive Curse',
    description: `For each figure on the battlefield (yours and your
opponents’), roll the 20-sided die. If you roll a 1,
the figure is destroyed. If you roll 2 through 20,
the figure is safe.`,
  },
  revive: {
    id: 'revive',
    name: 'Sturla',
    shortName: 'Revive',
    glyphLetter: 'S',
    type: 'temporary',
    effect: 'Revive',
    description: `When a figure lands on this Glyph, both players must roll the 20 sided die for all of their previously destroyed figures. If a 19 or 20 is rolled, than that figure is placed on any starting zone.`,
  },
  negation: {
    // Nilrend (Negation): When one of your figures stops here, you may choose any opponent's Unique Army Card. Roll the 20-sided die. If you roll a 1 - 4, nothing happens. If you roll a 5 - 20, place the Gold Negation Marker on the chosen figure's Army Card. All of that figure's special powers are negated for the rest of the game.
    id: 'negation',
    name: 'Nilrend',
    shortName: 'Negation',
    glyphLetter: 'N',
    type: 'temporary',
    effect: 'Negation',
    description: `When one of your figures stops here, you may choose any opponent's Unique Army Card. Roll the 20-sided die. If you roll a 1 - 4, nothing happens. If you roll a 5 - 20, place the Gold Negation Marker on the chosen figure's Army Card. All of that figure's special powers are negated for the rest of the game.`,
  },
  interceptOrder: {
    id: 'interceptOrder',
    name: 'Oreld',
    shortName: 'Intercept Order',
    glyphLetter: 'O',
    type: 'temporary',
    effect: 'Intercept Order',
    description: `When one of your figures stops here, roll the 20-sided die. If you roll a 1 - 9, nothing happens. If your roll a 10 - 20, you may remove one random unrevealed Order Marker from an opponent's Army Card.`,
  },
  // PERMANENT GLYPHS
  attack: {
    id: 'attack',
    name: 'Astrid',
    shortName: 'Attack +1',
    glyphLetter: 'A',
    type: 'power',
    effect: 'Attack +1',
    description:
      'Add one die to your attack roll when any figure in your army uses a Normal Attack',
  },
  defense: {
    id: 'defense',
    name: 'Gerda',
    shortName: 'Defense +1',
    glyphLetter: 'G',
    type: 'power',
    effect: 'Defense +1',
    description:
      'Add one die to your Defense Roll when any figure in your army is attacked.',
  },
  move: {
    id: 'move',
    name: 'Valda',
    shortName: 'Move +2',
    glyphLetter: 'V',
    type: 'power',
    effect: 'Move +2',
    description:
      'Add 2 to the Move Number stated on every Army Card in your army.',
  },
  range: {
    id: 'range',
    name: 'Ivor',
    shortName: 'Range +4',
    glyphLetter: 'I',
    type: 'power',
    effect: 'Range +4',
    description:
      'Add 4 to the Range limit of every Army Card in your army which already had a Range of 4 or more.',
  },
  initiative: {
    id: 'initiative',
    name: 'Dagmar',
    shortName: 'Initiative +8',
    glyphLetter: 'D',
    type: 'power',
    effect: 'Initiative +8',
    description:
      'Add 8 to your Initiative Roll at the beginning of the next Round.',
  },
  defense2: {
    id: 'defense2',
    name: 'Jalgard',
    shortName: 'Defense +2',
    glyphLetter: 'J',
    type: 'power',
    effect: 'Defense +2',
    description:
      'Add two dice to your Defense Roll when any figure in your army is attacked.',
  },
  lucky1: {
    id: 'lucky1',
    name: 'Lodin',
    shortName: 'Lucky 20-Sider',
    glyphLetter: 'L',
    type: 'power',
    effect: 'Lucky 20-Sider',
    description:
      'Whenever you roll the 20 sided die, you may add one to your die roll.',
  },
  wind: {
    id: 'wind',
    name: 'Rannveig',
    shortName: 'Wind',
    glyphLetter: 'R',
    type: 'power',
    effect: 'Wind',
    description:
      "When a figure is on this Glyph, no figure may use the 'Flying' power. This includes figures in your own army was well as figures on the other player's team.",
  },
  commonAttack: {
    id: 'commonAttack',
    name: 'Crevcor',
    shortName: 'Common Attack +1',
    glyphLetter: 'C',
    type: 'power',
    effect: 'Common Attack +1',
    description:
      'All Common Figures in your army may add one additional attack die when attacking normally.',
  },
  thorian: {
    id: 'thorian',
    name: 'Thorian',
    shortName: 'Thorian',
    glyphLetter: 'T',
    type: 'power',
    effect: 'Common Attack +1',
    description:
      "All opponents' figures must be adjacent to your figures to attack your figures with a normal attack.",
  },
  pitTrap: {
    id: 'pitTrap',
    name: 'Proftaka',
    shortName: 'Pit Trap',
    glyphLetter: 'P',
    type: 'power',
    effect: 'Trapped Figure',
    description:
      'Your figure is trapped. The trapped figure cannot move from this space. The figure can move off the Proftaka only if a friendly figure occupies an adjacent space.',
  },
  uniqueAttack: {
    id: 'uniqueAttack',
    name: 'Ulaniva',
    shortName: 'Unique Attack +1',
    glyphLetter: 'U',
    type: 'power',
    effect: 'Unique Attack +1',
    description:
      'All Unique Figures in your army may add one extra attack die when attacking normally.',
  },
  wound: {
    id: 'wound',
    name: 'Wannok',
    shortName: 'Wound',
    glyphLetter: 'W',
    type: 'power',
    effect: 'Wound',
    description:
      'At the end of every round, roll the 20-sided die. If you roll a 1, the figure on the Glyph receives one wound. If you roll a 2 or higher, you may choose an opponent who must give one wound to any figure he or she controls on the battlefield.',
  },
}

/*
MARVEL
Marvel had two unique yellow Glyphs of its own, which were infamous for not doing anything specific.
Object of Power/Mysterious Item (Artifact): The rules for these Glyphs change for each scenario.
*/

/*
TREASURE GLYPHS
The third master set Battle for the Underdark, as well as the three waves that followed it, introduced its own Glyphs,
these special brown Glyph are called Treasure Glyphs.
These Glyphs work similar to the normal Power Glyphs, but they are mobile and can be moved throughout the battlefield as a figure carries it.
Note that this Wiki refers to the first type of Glyphs as "Power Glyphs" for the sake of clarity.
In rulebooks and other official sources, however, they may simply be referred to as "Glyphs".
There are three types of treasure glyphs: Permanent Treasure Glyphs, Temporary Treasure Glyphs, and Ancient Artifact Treasure Glyphs.

TREASURE GLYPH RULES
Only Unique Heroes can use Treasure Glyphs and a Hero can carry any number of Treasure Glyphs.
Treasure Glyphs do not stop movement like normal Glyphs.
Figures can run right over them, and figures that can’t use them can stand on them to attempt to stop Unique Heroes from getting to them.
When you attempt to pick up or activate a symbol-side up Treasure Glyph, you must roll for the scenario specific trap (see below) that the Treasure is bound by.
Treasure Glyphs will normally only affect the figure that is carrying it (the figure whose Army Card the Treasure Glyph is on).
Treasure Glyph Trap Rules
When a figure tries to pick up or activate a symbol-side up Treasure Glyph, before revealing it,
you must roll a 20 sided die. (Note, you never roll for a trap on a power-side up Treasure Glyph)
On a 1-5, you set off the trap! Leave the treasure Glyph symbol-side up.
The scenario-specific trap takes effect. The trap can be anything you can imagine, as long as you set it up before the game.
On 6 or higher, you don’t set off the trap, and the figure reveals the Treasure Glyph and places it on his corresponding Army Card.
That figure now controls the Glyph.
Figures cannot freely exchange Treasure Glyphs.
While this may seem counter-intuitive, this was done in an attempt to balance the mobile Glyphs and
keep one figure from flying out, grabbing all the treasure, and getting back to their big Hero and beefing them up.
But there are ways for figures to get rid of treasure Glyphs and allow other figures to pick them up, it just takes an extra turn.
Dropping Treasure Glyphs
At any point during a figure's movement, you may place a Treasure Glyph power-side up on a space the figure occupies. That figure may now continue its movement.
Note: You cannot drop a Treasure Glyph onto a space that already has another Glyph on it.
Losing Treasure Glyphs
If a figure carrying a Treasure Glyph is destroyed, the Glyph is placed power-side up onto a space the figure last occupied.
If the space already has a Glyph on it, the Treasure Glyph(s) the figure was carrying is destroyed.
Treasure Glyphs bring a new level of complexity to the strategy of Glyph grabbing and setting up your Order Markers in Heroscape games.

PERMANENT TREASURE GLYPHS
Permanent Treasure Glyphs will give the figure certain abilities as long as it is carried.
Heroic Rune (Attack +1): This figure adds 1 additional attack die when making a normal attack.
Talisman of Defense (Defense +1): This figure adds 1 additional defense die when defending.
Brandar’s Chest (Artifact): The rules for this Treasure Glyph vary, depending on the Game Scenario.
Holy Symbol of Pelor (Attack +2 vs. Undead): This figure adds 2 additional attack dice against Undead figures.
Brooch of Shielding (Disengage): This figure is never attacked when leaving an engagement.
Oceanstrider Amulet (Waterwalking): This figure does not have to stop its movement when entering water spaces.
Giant Hunter Stone (+1 vs Large or Huge Figures): This figure rolls an additional die when attacking or defending against large or huge figures.

TEMPORARY TREASURE GLYPHS
Temporary Treasure Glyphs are normally powerful one-use increases or abilities that must be used at a certain time.
Potion of Healing (Heal 3 Wounds): This figure may drink this potion after revealing an Order Marker on its Army Card. Remove up to 3 Wound Markers from that figure’s Army Card.
Whetstone of Venom (Poison): This figure may use this whetstone before rolling attack dice for a Normal Attack against an adjacent figure. If that attack inflicts at least one wound, you may add two(2) additional Wound Markers to the defending figure's Army Card.
Ring of Protection (Defense +3): This figure may choose to use this ring after an attacking figure has rolled attack dice and before rolling defense dice.
Elixir of Speed (Move +4): This figure may add 4 spaces to it's move value this turn only.
Bracers of Teleportation (Teleport): This figure may use these bracers before moving. Instead of moving normally, you may place this figure on any same-level space(s) within 10 spaces of its current location. If this figure is engaged when it starts to teleport, it will not take any leaving engagement attacks.
Cloak of Invisibility (Invisibility): This figure may use this cloak at any point during its turn. This figure has no visible Hit Zones until the end of the current round or until it attacks with a normal or special attack, whichever comes first. This figure will never take any leaving engagement attacks while invisible.
Belt of Giant Strength (Attack +2): This figure may use this belt before rolling attack dice for a Normal Attack against an adjacent figure. This figure adds two(2) additional dice when attacking with a normal Attack this turn.
Scarab of Invulnerability (Ignore Wounds): This figure may use this Scarab whenever it receives one or more wounds. Roll the 20 sided die. If you roll a 1-15, ignore one of the wounds just received. If you roll a 16 or higher, ignore all wounds just received.

ANCIENT ARTIFACT TREASURE GLYPHS
Ancient Artifacts are powerful and rare Treasure Glyphs. Ancient Artifact Treasure Glyphs follow all rules for Treasure Glyphs with the following exception: an Army may control more than one Ancient Artifact Treasure Glyph, but an Army can never control more than one copy of each Ancient Artifact Treasure Glyph. If at any point an Army would control more than one copy, all extra copies must be dropped or destroyed.
Bolt of the Witherwood (Ancient Artifact): After moving and before attacking with this figure, you may choose any opponent's figure within 5 clear sight spaces. Roll the 20-sided die. If you roll a 1-15, nothing happens. If you roll a 16 or higher, the chosen figure is destroyed. You may attempt to use this power only once per game.
Revenant's Tome (Unnatural Revival): This figure may use this tome after revealing an Order Marker on its Army Card. Before taking that turn with this figure, place one previously destroyed Unique figure from your army onto any empty space(s) within five(5) clear sight spaces of this figure. Immediately make a Normal Attack with the placed figure, then immediately destroy that placed figure. While the placed figure is on the board, consider all of its special powers to be negated. The placed figure is considered to have a life of 1, and is not affected by any special power on any Army Card while on the board.

*/
// const vsGlyphLetterToName = {
//   '?': 'unknown',  // 14063
//   A: 'astrid', // 14065
//   G: 'gerda',  // 14071
//   I: 'ivor', // 14073
//   V: 'valda', // 14086
//   D: 'dragmar', // 14068
//   B: 'brandar', // 14066
//   K: 'kelda', // 14075
//   E: 'erland', // 14069
//   M: 'mitonsoul', // 14077
//   L: 'lodin', // 14076
//   S: 'sturla', // 14083
//   R: 'rannveig', // 14082
//   J: 'jalgard', // 14074
//   W: 'wannok', // 14087
//   P: 'proftaka', // 14080
//   O: 'oreld', // 14079
//   N: 'nilrend', // 14078
//   C: 'crevcor', // 14067
//   T: 'thorian', // 14084
//   U: 'ulaniva', // 14085
// }+
