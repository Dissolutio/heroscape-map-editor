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
// }

export const powerGlyphs: HexoscapeGlyphs = {
  // TEMPORARY GLYPHS
  healing: {
    // Haukeland
    id: 'haukeland',
    name: 'Quillivon (Sudden Movement)',
    shortName: 'Sudden Movement',
    glyphLetter: 'Q',
    type: 'temporary',
    effect: 'Move 3 figures',
    description:
      'Choose up to 3 of your figures other than the one on this Glyph. You may move each of the chosen figures up to 5 spaces.',
  },
  suddenMovement: {
    // Quillivon
    id: 'quillivon',
    name: 'Quillivon (Sudden Movement)',
    shortName: 'Sudden Movement',
    glyphLetter: 'Q',
    type: 'temporary',
    effect: 'Move 3 figures',
    description: 'Choose up to 3 of your figures other than the one on this Glyph. You may move each of the chosen figures up to 5 spaces.',
  },
  removal: {
    // Felaron
    id: 'felaron',
    name: 'Felaron',
    shortName: 'Removal',
    glyphLetter: 'F',
    type: 'temporary',
    effect: 'Remove a glyph',
    description: 'Remove any other Glyph from the battlefield.',
  },
  // CLASSIC TEMPORARY
  objective: {
    // Brandar
    id: 'objective',
    name: 'Brandar',
    shortName: 'Objective',
    glyphLetter: 'B',
    type: 'power',
    effect: 'Artifact',
    description: 'The rules of this Glyph vary, depending on the Scenario.',
  },
  summoner: {
    // Erland
    id: 'summoner',
    name: 'Erland',
    shortName: 'Summoner',
    glyphLetter: 'E',
    type: 'temporary',
    effect: 'Summon figure',
    description: `When a figure lands on this Glyph, choose any one figure (yours, a teammate's or an opponent's) and to place on an adjacent space.`,
  },
  healer: {
    // Kelda
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
    // Mitonsoul
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
    // Sturla
    id: 'revive',
    name: 'Sturla',
    shortName: 'Revive',
    glyphLetter: 'S',
    type: 'temporary',
    effect: 'Revive',
    description:
      'When a figure lands on this Glyph, both players must roll the 20 sided die for all of their previously destroyed figures. If a 19 or 20 is rolled, than that figure is placed on any starting zone.',
  },
  negation: {
    // Nilrend (Negation): When one of your figures stops here, you may choose any opponent's Unique Army Card. Roll the 20-sided die. If you roll a 1 - 4, nothing happens. If you roll a 5 - 20, place the Gold Negation Marker on the chosen figure's Army Card. All of that figure's special powers are negated for the rest of the game. // Nilrend
    id: 'negation',
    name: 'Nilrend',
    shortName: 'Negation',
    glyphLetter: 'N',
    type: 'temporary',
    effect: 'Negation',
    description: `When one of your figures stops here, you may choose any opponent's Unique Army Card. Roll the 20-sided die. If you roll a 1 - 4, nothing happens. If you roll a 5 - 20, place the Gold Negation Marker on the chosen figure's Army Card. All of that figure's special powers are negated for the rest of the game.`,
  },
  xenithraxVines: {
    // Oreld
    id: 'xenithraxVines',
    name: 'Xenithrax Vines',
    shortName: 'Vines',
    glyphLetter: 'XV',
    type: 'temporary',
    effect: 'Xenithrax Vines',
    description:
      'If a Huge figure moves onto this Glyph, this Glyph is immediately removed from the battlefield and that figure may continue its movement. Figures standing on this Glyph roll 1 fewer attack die and 2 fewer defense dice. When a figure on this Glyph moves off of the Glyph, roll one attack die. If you roll a skull, that figure takes one wound. Remove this Glyph from the battlefield after a figure moves off of it, or at the end of the round if a figure is standing on it.',
  },
  interceptOrder: {
    // Oreld
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
    // Astrid
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
    // Gerda
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
    // Valda
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
    // Ivor
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
    // Dagmar
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
    // Jalgard
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
    // Lodin
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
    // Rannveig
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
    // Crevcor
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
    // Thorian
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
    // Proftaka
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
    // Ulaniva
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
    // Wannok
    id: 'wound',
    name: 'Wannok',
    shortName: 'Wound',
    glyphLetter: 'W',
    type: 'power',
    effect: 'Wound',
    description:
      'At the end of every round, roll the 20-sided die. If you roll a 1, the figure on the Glyph receives one wound. If you roll a 2 or higher, you may choose an opponent who must give one wound to any figure he or she controls on the battlefield.',
  },
  disengage: {
    // Yadulkia
    id: 'disengage',
    name: 'Yadulkia',
    shortName: 'Yadulkia',
    glyphLetter: 'Y',
    type: 'power',
    effect: 'Disengage',
    description: 'Your figures are never attacked when leaving an engagement.',
  },
}

export const marvelGlyphs: HexoscapeGlyphs = {
  objectOfPower: {
    id: 'objectOfPower',
    name: 'Object of Power',
    shortName: 'Object of Power',
    glyphLetter: 'OP',
    type: 'power',
    effect: 'Artifact',
    description: 'The rules for this Glyph vary, depending on the Scenario.',
  },
  mysteriousItem: {
    id: 'mysteriousItem',
    name: 'Mysterious Item',
    shortName: 'Mysterious Item',
    glyphLetter: 'MI',
    type: 'power',
    effect: 'Artifact',
    description: 'The rules for this Glyph vary, depending on the Scenario.',
  },
}

export const treasureGlyphs: HexoscapeGlyphs = {
  // Permanent Treasure Glyphs
  heroicRune: {
    id: 'heroicRune',
    name: 'Heroic Rune',
    shortName: 'Attack +1',
    glyphLetter: 'HR',
    type: 'treasure',
    effect: 'Attack +1',
    description:
      'This figure adds 1 additional attack die when making a normal attack.',
  },
  talismanOfDefense: {
    id: 'talismanOfDefense',
    name: 'Talisman of Defense',
    shortName: 'Defense +1',
    glyphLetter: 'TD',
    type: 'treasure',
    effect: 'Defense +1',
    description: 'This figure adds 1 additional defense die when defending.',
  },
  brandarsChest: {
    id: 'brandarsChest',
    name: "Brandar's Chest",
    shortName: 'Artifact',
    glyphLetter: 'BC',
    type: 'treasure',
    effect: 'Artifact',
    description:
      'The rules for this Treasure Glyph vary, depending on the Game Scenario.',
  },
  holySymbolOfPelor: {
    id: 'holySymbolOfPelor',
    name: 'Holy Symbol of Pelor',
    shortName: 'Attack +2 vs. Undead',
    glyphLetter: 'HP',
    type: 'treasure',
    effect: 'Attack +2 vs. Undead',
    description:
      'This figure adds 2 additional attack dice against Undead figures.',
  },
  broochOfShielding: {
    id: 'broochOfShielding',
    name: 'Brooch of Shielding',
    shortName: 'Disengage',
    glyphLetter: 'BS',
    type: 'treasure',
    effect: 'Disengage',
    description: 'This figure is never attacked when leaving an engagement.',
  },
  oceanstriderAmulet: {
    id: 'oceanstriderAmulet',
    name: 'Oceanstrider Amulet',
    shortName: 'Waterwalking',
    glyphLetter: 'OA',
    type: 'treasure',
    effect: 'Waterwalking',
    description:
      'This figure does not have to stop its movement when entering water spaces.',
  },
  giantHunterStone: {
    id: 'giantHunterStone',
    name: 'Giant Hunter Stone',
    shortName: '+1 vs Large/Huge',
    glyphLetter: 'GS',
    type: 'treasure',
    effect: '+1 vs Large or Huge Figures',
    description:
      'This figure rolls an additional die when attacking or defending against large or huge figures.',
  },

  // Temporary Treasure Glyphs
  potionOfHealing: {
    id: 'potionOfHealing',
    name: 'Potion of Healing',
    shortName: 'Heal 3 Wounds',
    glyphLetter: 'PH',
    type: 'treasure',
    effect: 'Heal 3 Wounds',
    description:
      'This figure may drink this potion after revealing an Order Marker on its Army Card. Remove up to 3 Wound Markers from that figure’s Army Card.',
  },
  whetstoneOfVenom: {
    id: 'whetstoneOfVenom',
    name: 'Whetstone of Venom',
    shortName: 'Poison',
    glyphLetter: 'WV',
    type: 'treasure',
    effect: 'Poison',
    description:
      "This figure may use this whetstone before rolling attack dice for a Normal Attack against an adjacent figure. If that attack inflicts at least one wound, you may add two additional Wound Markers to the defending figure's Army Card.",
  },
  ringOfProtection: {
    id: 'ringOfProtection',
    name: 'Ring of Protection',
    shortName: 'Defense +3',
    glyphLetter: 'RP',
    type: 'treasure',
    effect: 'Defense +3',
    description:
      'This figure may choose to use this ring after an attacking figure has rolled attack dice and before rolling defense dice.',
  },
  elixirOfSpeed: {
    id: 'elixirOfSpeed',
    name: 'Elixir of Speed',
    shortName: 'Move +4',
    glyphLetter: 'ES',
    type: 'treasure',
    effect: 'Move +4',
    description:
      'This figure may add 4 spaces to its move value this turn only.',
  },
  bracersOfTeleportation: {
    id: 'bracersOfTeleportation',
    name: 'Bracers of Teleportation',
    shortName: 'Teleport',
    glyphLetter: 'BT',
    type: 'treasure',
    effect: 'Teleport',
    description:
      'This figure may use these bracers before moving. Instead of moving normally, you may place this figure on any same-level space(s) within 10 spaces of its current location. If this figure is engaged when it starts to teleport, it will not take any leaving engagement attacks.',
  },
  cloakOfInvisibility: {
    id: 'cloakOfInvisibility',
    name: 'Cloak of Invisibility',
    shortName: 'Invisibility',
    glyphLetter: 'CI',
    type: 'treasure',
    effect: 'Invisibility',
    description:
      'This figure may use this cloak at any point during its turn. This figure has no visible Hit Zones until the end of the current round or until it attacks with a normal or special attack, whichever comes first. This figure will never take any leaving engagement attacks while invisible.',
  },
  beltOfGiantStrength: {
    id: 'beltOfGiantStrength',
    name: 'Belt of Giant Strength',
    shortName: 'Attack +2',
    glyphLetter: 'BG',
    type: 'treasure',
    effect: 'Attack +2',
    description:
      'This figure may use this belt before rolling attack dice for a Normal Attack against an adjacent figure. This figure adds two additional dice when attacking with a normal Attack this turn.',
  },
  scarabOfInvulnerability: {
    id: 'scarabOfInvulnerability',
    name: 'Scarab of Invulnerability',
    shortName: 'Ignore Wounds',
    glyphLetter: 'SI',
    type: 'treasure',
    effect: 'Ignore Wounds',
    description:
      'This figure may use this Scarab whenever it receives one or more wounds. Roll the 20 sided die. If you roll a 1-15, ignore one of the wounds just received. If you roll a 16 or higher, ignore all wounds just received.',
  },

  // Ancient Artifact Treasure Glyphs
  boltOfTheWitherwood: {
    id: 'boltOfTheWitherwood',
    name: 'Bolt of the Witherwood',
    shortName: 'Witherwood',
    glyphLetter: 'BW',
    type: 'treasure',
    effect: 'Ancient Artifact',
    description:
      "After moving and before attacking with this figure, you may choose any opponent's figure within 5 clear sight spaces. Roll the 20-sided die. If you roll a 1-15, nothing happens. If you roll a 16 or higher, the chosen figure is destroyed. You may attempt to use this power only once per game.",
  },
  revenantsTome: {
    id: 'revenantsTome',
    name: "Revenant's Tome",
    shortName: 'Unnatural Revival',
    glyphLetter: 'RT',
    type: 'treasure',
    effect: 'Unnatural Revival',
    description:
      'This figure may use this tome after revealing an Order Marker on its Army Card. Before taking that turn with this figure, place one previously destroyed Unique figure from your army onto any empty space(s) within five clear sight spaces of this figure. Immediately make a Normal Attack with the placed figure, then immediately destroy that placed figure. While the placed figure is on the board, consider all of its special powers to be negated. The placed figure is considered to have a life of 1, and is not affected by any special power on any Army Card while on the board.',
  },
}

export const vcGlyphs: HexoscapeGlyphs = {
  frosa: {
    id: 'frosa',
    name: 'Frosa',
    shortName: 'Freeze',
    glyphLetter: 'F',
    type: 'power',
    effect: 'Freeze',
    description:
      'All water spaces are considered normal ice spaces while standing on the Glyph of Frosa. Figures do not have to stop their movement on normal ice spaces.',
  },
  holdir: {
    id: 'holdir',
    name: 'Holdir',
    shortName: 'Heroic Attack',
    glyphLetter: 'H',
    type: 'power',
    effect: 'Heroic Attack',
    description:
      'Once during each turn, a Hero you control may add one extra attack die when attacking normally.',
  },
  lorjaIvor: {
    id: 'lorjaIvor',
    name: 'Lorja Ivor',
    shortName: 'Range +1',
    glyphLetter: 'LI',
    type: 'power',
    effect: 'Range +1',
    description:
      'For each figure you control with a Range number of 4 or more, add 1 to the Range number.',
  },
  xipta: {
    id: 'xipta',
    name: 'Xipta',
    shortName: 'Exchange Orders',
    glyphLetter: 'X',
    type: 'power',
    effect: 'Exchange Orders',
    description:
      'After placing Order Markers and before rolling initiative, roll the 20‑sided die. If you roll an 11 or higher, choose an opponent who must, one at a time, remove two different Order Markers from Army Cards that opponent controls, and then may place them again. Each Order Marker must be placed on a different card (or cards if your opponent has more than one common card for that figure) than it was removed from, or else it cannot be placed again this round.',
  },
  zawit: {
    id: 'zawit',
    name: 'Zawit',
    shortName: 'Teleport',
    glyphLetter: 'Z',
    type: 'power',
    effect: 'Teleport',
    description:
      'At the end of the round, you may place the figure on this glyph on any empty space(s) on the battlefield not adjacent to any other figures. If the teleported figure is engaged, it will not take any leaving engagement attacks.',
  },
  gemOfLavaResistance: {
    id: 'gemOfLavaResistance',
    name: 'Gem of Lava Resistance',
    shortName: 'Lava Resistant',
    glyphLetter: 'LR',
    type: 'treasure',
    effect: 'Lava Resistant',
    description:
      'This figure gains the Lava Resistant special power. This figure never rolls for molten lava damage or lava field damage and does not have to stop in molten lava spaces.',
  },
  searingAmulet: {
    id: 'searingAmulet',
    name: 'Searing Amulet',
    shortName: 'Searing Intensity',
    glyphLetter: 'SI',
    type: 'treasure',
    effect: 'Searing Intensity',
    description:
      'After moving and before attacking, you must roll the 20-sided die once for each figure adjacent to this figure. If you roll a 14 or higher, that figure receives 1 wound. Figures with the Lava Resistant special power are not affected by the Glyph of Searing Amulet.',
  },
}
