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

import type { HexoscapeGlyph } from "../types"

export const powerGlyphs: HexoscapeGlyph[] = [
  // TEMPORARY GLYPHS
  {
    // Haukeland
    id: 'haukeland',
    name: 'Haukeland (Healing)',
    shortName: 'Healing',
    glyphLetter: 'H',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Heal 3 wounds',
    description:
      'When one of your figures stops here, you may remove up to 3 Wound Markers from across any of your Army Cards.',
  },
  {
    // Quillivon
    id: 'quillivon',
    name: 'Quillivon (Sudden Movement)',
    shortName: 'Sudden Movement',
    glyphLetter: 'Q',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Move 3 figures',
    description:
      'Choose up to 3 of your figures other than the one on this Glyph. You may move each of the chosen figures up to 5 spaces.',
  },
  {
    // Felaron
    id: 'felaron',
    name: 'Felaron',
    shortName: 'Removal',
    glyphLetter: 'F',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Remove a glyph',
    description: 'Remove any other Glyph from the battlefield.',
  },
  // CLASSIC TEMPORARY
  {
    // Brandar
    id: 'objective',
    name: 'Brandar',
    shortName: 'Objective',
    glyphLetter: 'B',
    type: 'objective',
    duration: 'objective',
    shortDescription: 'Objective',
    description: 'The rules of this Glyph vary, depending on the Scenario.',
  },
  {
    // Erland
    id: 'summoner',
    name: 'Erland',
    shortName: 'Summoner',
    glyphLetter: 'E',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Summon figure',
    description: `When a figure lands on this Glyph, choose any one figure (yours, a teammate's or an opponent's) and to place on an adjacent space.`,
  },
  {
    // Kelda
    id: 'healer',
    name: 'Kelda',
    shortName: 'Healer',
    glyphLetter: 'K',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Hero heal all wounds, squad discard',
    description:
      'When a Hero you control lands on this Glyph, remove all wound markers from it. If a Squad figure lands here, nothing happens.',
  },
  {
    // Mitonsoul
    id: 'curse',
    name: 'Mitonsoul',
    shortName: 'Curse',
    glyphLetter: 'M',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Every figure d20, 1=destroy',
    description: `For each figure on the battlefield (yours and your
opponents’), roll the 20-sided die. If you roll a 1,
the figure is destroyed. If you roll 2 through 20,
the figure is safe.`,
  },
  {
    // Sturla
    id: 'revive',
    name: 'Sturla',
    shortName: 'Revive',
    glyphLetter: 'S',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Every defeated figure d20, 19/20=revive in start zone',
    description:
      'When a figure lands on this Glyph, both players must roll the 20 sided die for all of their previously destroyed figures. If a 19 or 20 is rolled, than that figure is placed on any starting zone.',
  },
  {
    // Nilrend (Negation): When one of your figures stops here, you may choose any opponent's Unique Army Card. Roll the 20-sided die. If you roll a 1 - 4, nothing happens. If you roll a 5 - 20, place the Gold Negation Marker on the chosen figure's Army Card. All of that figure's special powers are negated for the rest of the game. // Nilrend
    id: 'negation',
    name: 'Nilrend',
    shortName: 'Negation',
    glyphLetter: 'N',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Negation',
    description: `When one of your figures stops here, you may choose any opponent's Unique Army Card. Roll the 20-sided die. If you roll a 1 - 4, nothing happens. If you roll a 5 - 20, place the Gold Negation Marker on the chosen figure's Army Card. All of that figure's special powers are negated for the rest of the game.`,
  },
  {
    // Oreld
    id: 'xenithraxVines',
    name: 'Xenithrax Vines',
    shortName: 'Vines',
    glyphLetter: 'XV',
    shortDescription: 'Xenithrax Vines',
    type: 'power',
    duration: 'temporary',
    description:
      'If a Huge figure moves onto this Glyph, this Glyph is immediately removed from the battlefield and that figure may continue its movement. Figures standing on this Glyph roll 1 fewer attack die and 2 fewer defense dice. When a figure on this Glyph moves off of the Glyph, roll one attack die. If you roll a skull, that figure takes one wound. Remove this Glyph from the battlefield after a figure moves off of it, or at the end of the round if a figure is standing on it.',
  },
  {
    // Oreld
    id: 'interceptOrder',
    name: 'Oreld',
    shortName: 'Intercept Order',
    glyphLetter: 'O',
    type: 'power',
    duration: 'temporary',
    shortDescription: 'Intercept Order',
    description: `When one of your figures stops here, roll the 20-sided die. If you roll a 1 - 9, nothing happens. If your roll a 10 - 20, you may remove one random unrevealed Order Marker from an opponent's Army Card.`,
  },
  // PERMANENT GLYPHS
  {
    // Astrid
    id: 'attack',
    name: 'Astrid',
    shortName: 'Attack +1',
    glyphLetter: 'A',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Attack +1',
    description:
      'Add one die to your attack roll when any figure in your army uses a Normal Attack',
  },
  {
    // Gerda
    id: 'defense',
    name: 'Gerda',
    shortName: 'Defense +1',
    glyphLetter: 'G',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Defense +1',
    description:
      'Add one die to your Defense Roll when any figure in your army is attacked.',
  },
  {
    // Valda
    id: 'move',
    name: 'Valda',
    shortName: 'Move +2',
    glyphLetter: 'V',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Move +2',
    description:
      'Add 2 to the Move Number stated on every Army Card in your army.',
  },
  {
    // Ivor
    id: 'range',
    name: 'Ivor',
    shortName: 'Range +4',
    glyphLetter: 'I',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Range +4',
    description:
      'Add 4 to the Range limit of every Army Card in your army which already had a Range of 4 or more.',
  },
  {
    // Dagmar
    id: 'initiative',
    name: 'Dagmar',
    shortName: 'Initiative +8',
    glyphLetter: 'D',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Initiative +8',
    description:
      'Add 8 to your Initiative Roll at the beginning of the next Round.',
  },
  {
    // Jalgard
    id: 'defense2',
    name: 'Jalgard',
    shortName: 'Defense +2',
    glyphLetter: 'J',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Defense +2',
    description:
      'Add two dice to your Defense Roll when any figure in your army is attacked.',
  },
  {
    // Lodin
    id: 'lucky1',
    name: 'Lodin',
    shortName: 'Lucky 20-Sider',
    glyphLetter: 'L',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Lucky 20-Sider',
    description:
      'Whenever you roll the 20 sided die, you may add one to your die roll.',
  },
  {
    // Rannveig
    id: 'wind',
    name: 'Rannveig',
    shortName: 'Wind',
    glyphLetter: 'R',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Wind',
    description:
      "When a figure is on this Glyph, no figure may use the 'Flying' power. This includes figures in your own army was well as figures on the other player's team.",
  },
  {
    // Crevcor
    id: 'commonAttack',
    name: 'Crevcor',
    shortName: 'Common Attack +1',
    glyphLetter: 'C',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Common Attack +1',
    description:
      'All Common Figures in your army may add one additional attack die when attacking normally.',
  },
  {
    // Thorian
    id: 'thorian',
    name: 'Thorian',
    shortName: 'Thorian',
    glyphLetter: 'T',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Common Attack +1',
    description:
      "All opponents' figures must be adjacent to your figures to attack your figures with a normal attack.",
  },
  {
    // Proftaka
    id: 'pitTrap',
    name: 'Proftaka',
    shortName: 'Pit Trap',
    glyphLetter: 'P',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Trapped Figure',
    description:
      'Your figure is trapped. The trapped figure cannot move from this space. The figure can move off the Proftaka only if a friendly figure occupies an adjacent space.',
  },
  {
    // Ulaniva
    id: 'uniqueAttack',
    name: 'Ulaniva',
    shortName: 'Unique Attack +1',
    glyphLetter: 'U',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Unique Attack +1',
    description:
      'All Unique Figures in your army may add one extra attack die when attacking normally.',
  },
  {
    // Wannok
    id: 'wound',
    name: 'Wannok',
    shortName: 'Wound',
    glyphLetter: 'W',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Wound',
    description:
      'At the end of every round, roll the 20-sided die. If you roll a 1, the figure on the Glyph receives one wound. If you roll a 2 or higher, you may choose an opponent who must give one wound to any figure he or she controls on the battlefield.',
  },
  {
    // Yadulkia
    id: 'disengage',
    name: 'Yadulkia',
    shortName: 'Yadulkia',
    glyphLetter: 'Y',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Disengage',
    description: 'Your figures are never attacked when leaving an engagement.',
  },
  {
    // Zipline
    id: 'zipline',
    name: 'Zipline',
    shortName: 'Zipline',
    glyphLetter: 'ZIP',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Tactical Move',
    description:
      'Once per turn, when a Small or Medium figure ends its movement on a Zipline Glyph while moving normally, you may choose another Zipline Glyph within 6 spaces of that Zipline Glyph. Place that figure on a space within 1 of and on the same level as that Glyph. A figure that is engaged when it starts to zipline will take any leaving engagement attacks. Figures may move over a Zipline Glyph without stopping.',
  },
]

export const marvelGlyphs: HexoscapeGlyph[] = [
  {
    id: 'objectOfPower',
    name: 'Object of Power',
    shortName: 'Object of Power',
    glyphLetter: 'OP',
    type: 'objective',
    duration: 'objective',
    shortDescription: 'Objective',
    description: 'The rules for this Glyph vary, depending on the Scenario.',
  },
  {
    id: 'mysteriousItem',
    name: 'Mysterious Item',
    shortName: 'Mysterious Item',
    glyphLetter: 'MI',
    type: 'objective',
    duration: 'objective',
    shortDescription: 'Objective',
    description: 'The rules for this Glyph vary, depending on the Scenario.',
  },
]

export const treasureGlyphs: HexoscapeGlyph[] = [
  // Permanent Treasure Glyphs
  {
    id: 'heroicRune',
    name: 'Heroic Rune',
    shortName: 'Attack +1',
    glyphLetter: 'HR',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Attack +1',
    description:
      'This figure adds 1 additional attack die when making a normal attack.',
  },
  {
    id: 'talismanOfDefense',
    name: 'Talisman of Defense',
    shortName: 'Defense +1',
    glyphLetter: 'TD',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Defense +1',
    description: 'This figure adds 1 additional defense die when defending.',
  },
  {
    id: 'brandarsChest',
    name: "Brandar's Chest",
    shortName: 'Artifact',
    glyphLetter: 'BC',
    type: 'objective',
    duration: 'objective',
    shortDescription: 'Artifact',
    description:
      'The rules for this Treasure Glyph vary, depending on the Game Scenario.',
  },
  {
    id: 'holySymbolOfPelor',
    name: 'Holy Symbol of Pelor',
    shortName: 'Attack +2 vs. Undead',
    glyphLetter: 'HP',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Attack +2 vs. Undead',
    description:
      'This figure adds 2 additional attack dice against Undead figures.',
  },
  {
    id: 'broochOfShielding',
    name: 'Brooch of Shielding',
    shortName: 'Disengage',
    glyphLetter: 'BS',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Disengage',
    description: 'This figure is never attacked when leaving an engagement.',
  },
  {
    id: 'oceanstriderAmulet',
    name: 'Oceanstrider Amulet',
    shortName: 'Waterwalking',
    glyphLetter: 'OA',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Waterwalking',
    description:
      'This figure does not have to stop its movement when entering water spaces.',
  },
  {
    id: 'giantHunterStone',
    name: 'Giant Hunter Stone',
    shortName: '+1 vs Large/Huge',
    glyphLetter: 'GS',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: '+1 vs Large or Huge Figures',
    description:
      'This figure rolls an additional die when attacking or defending against large or huge figures.',
  },
  {
    id: 'nanotoxinCoating',
    name: 'Nanotoxin Coating',
    shortName: 'Nanotoxin Coating',
    glyphLetter: 'NC',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Extra wound',
    description:
      'After you inflict 1 or more wounds with a normal attack against an adjacent figure, you may flip this Glyph symbol-side up to add 1 additional wound. At the end of the round, flip this Glyph power-side up. When this Glyph is picked up, flip it symbol-side up.',
  },
  {
    id: 'naniteShielding',
    name: 'Nanite Shielding',
    shortName: 'Nanite Shielding',
    glyphLetter: 'NS',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Shield 1',
    description:
      'Before rolling defense dice, you may flip this Glyph symbol-side up to add 1 automatic shield to your roll. At the end of the round, flip this Glyph power-side up. Only Small or Medium figures can use this ability. When this Glyph is picked up, flip it symbol-side up.',
  },
  {
    id: 'jumpPack',
    name: 'Jump Pack',
    shortName: 'Jump Pack',
    glyphLetter: 'JP',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Temporary flying',
    description:
      'Before you start to move, you may flip this Glyph symbol-side up to gain the Flying Special Power for the rest of the movement. At the end of the round, flip this Glyph power-side up. Only Small or Medium figures can use this ability. When this Glyph is picked up, flip it symbol-side up.',
  },
  // Temporary Treasure Glyphs
  {
    id: 'potionOfHealing',
    name: 'Potion of Healing',
    shortName: 'Heal 3 Wounds',
    glyphLetter: 'PH',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Heal 3 Wounds',
    description:
      'This figure may drink this potion after revealing an Order Marker on its Army Card. Remove up to 3 Wound Markers from that figure’s Army Card.',
  },
  {
    id: 'whetstoneOfVenom',
    name: 'Whetstone of Venom',
    shortName: 'Poison',
    glyphLetter: 'WV',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Poison',
    description:
      "This figure may use this whetstone before rolling attack dice for a Normal Attack against an adjacent figure. If that attack inflicts at least one wound, you may add two additional Wound Markers to the defending figure's Army Card.",
  },
  {
    id: 'ringOfProtection',
    name: 'Ring of Protection',
    shortName: 'Defense +3',
    glyphLetter: 'RP',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Defense +3, use once after attack dice',
    description:
      'This figure may choose to use this ring after an attacking figure has rolled attack dice and before rolling defense dice.',
  },
  {
    id: 'elixirOfSpeed',
    name: 'Elixir of Speed',
    shortName: 'Move +4',
    glyphLetter: 'ES',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Move +4 this turn',
    description:
      'This figure may add 4 spaces to its move value this turn only.',
  },
  {
    id: 'bracersOfTeleportation',
    name: 'Bracers of Teleportation',
    shortName: 'Teleport',
    glyphLetter: 'BT',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Teleport',
    description:
      'This figure may use these bracers before moving. Instead of moving normally, you may place this figure on any same-level space(s) within 10 spaces of its current location. If this figure is engaged when it starts to teleport, it will not take any leaving engagement attacks.',
  },
  {
    id: 'cloakOfInvisibility',
    name: 'Cloak of Invisibility',
    shortName: 'Invisibility',
    glyphLetter: 'CI',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Invisibility',
    description:
      'This figure may use this cloak at any point during its turn. This figure has no visible Hit Zones until the end of the current round or until it attacks with a normal or special attack, whichever comes first. This figure will never take any leaving engagement attacks while invisible.',
  },
  {
    id: 'beltOfGiantStrength',
    name: 'Belt of Giant Strength',
    shortName: 'Attack +2',
    glyphLetter: 'BG',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Attack +2',
    description:
      'This figure may use this belt before rolling attack dice for a Normal Attack against an adjacent figure. This figure adds two additional dice when attacking with a normal Attack this turn.',
  },
  {
    id: 'scarabOfInvulnerability',
    name: 'Scarab of Invulnerability',
    shortName: 'Ignore Wounds',
    glyphLetter: 'SI',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Ignore Wounds',
    description:
      'This figure may use this Scarab whenever it receives one or more wounds. Roll the 20 sided die. If you roll a 1-15, ignore one of the wounds just received. If you roll a 16 or higher, ignore all wounds just received.',
  },

  // Ancient Artifact Treasure Glyphs
  {
    id: 'boltOfTheWitherwood',
    name: 'Bolt of the Witherwood',
    shortName: 'Witherwood',
    glyphLetter: 'BW',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Ancient Artifact',
    description:
      "After moving and before attacking with this figure, you may choose any opponent's figure within 5 clear sight spaces. Roll the 20-sided die. If you roll a 1-15, nothing happens. If you roll a 16 or higher, the chosen figure is destroyed. You may attempt to use this power only once per game.",
  },
  {
    id: 'revenantsTome',
    name: "Revenant's Tome",
    shortName: 'Unnatural Revival',
    glyphLetter: 'RT',
    type: 'treasure',
    duration: 'temporary',
    shortDescription: 'Unnatural Revival',
    description:
      'This figure may use this tome after revealing an Order Marker on its Army Card. Before taking that turn with this figure, place one previously destroyed Unique figure from your army onto any empty space(s) within five clear sight spaces of this figure. Immediately make a Normal Attack with the placed figure, then immediately destroy that placed figure. While the placed figure is on the board, consider all of its special powers to be negated. The placed figure is considered to have a life of 1, and is not affected by any special power on any Army Card while on the board.',
  },
]

export const c3vGlyphs: HexoscapeGlyph[] = [
  {
    id: 'frosa',
    name: 'Frosa',
    shortName: 'Freeze',
    glyphLetter: 'F',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Water => ice',
    description:
      'All water spaces are considered normal ice spaces while standing on the Glyph of Frosa. Figures do not have to stop their movement on normal ice spaces.',
  },
  {
    id: 'holdir',
    name: 'Holdir',
    shortName: 'Heroic Attack',
    glyphLetter: 'H',
    type: 'power',
    duration: 'permanent',
    shortDescription: '+1 normal attack for a Hero, 1x/turn',
    description:
      'Once during each turn, a Hero you control may add one extra attack die when attacking normally.',
  },
  {
    id: 'lorjaIvor',
    name: 'Lorja Ivor',
    shortName: 'Range +1',
    glyphLetter: 'LI',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Range +1',
    description:
      'For each figure you control with a Range number of 4 or more, add 1 to the Range number.',
  },
  {
    id: 'xipta',
    name: 'Xipta',
    shortName: 'Exchange Orders',
    glyphLetter: 'X',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Exchange Orders',
    description:
      'After placing Order Markers and before rolling initiative, roll the 20‑sided die. If you roll an 11 or higher, choose an opponent who must, one at a time, remove two different Order Markers from Army Cards that opponent controls, and then may place them again. Each Order Marker must be placed on a different card (or cards if your opponent has more than one common card for that figure) than it was removed from, or else it cannot be placed again this round.',
  },
  {
    id: 'yngvild',
    name: 'Yngvild',
    shortName: 'Disengage',
    glyphLetter: 'Y',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Disengage',
    description:
      'At the end of the round, you may place the figure on this glyph on any empty space(s) on the battlefield not adjacent to any other figures. If the teleported figure is engaged, it will not take any leaving engagement attacks.',
  },
  {
    id: 'zawit',
    name: 'Zawit',
    shortName: 'Teleport',
    glyphLetter: 'Z',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Teleport',
    description:
      'At the end of the round, you may place the figure on this glyph on any empty space(s) on the battlefield not adjacent to any other figures. If the teleported figure is engaged, it will not take any leaving engagement attacks.',
  },
  {
    id: 'gemOfLavaResistance',
    name: 'Gem of Lava Resistance',
    shortName: 'Lava Resistant',
    glyphLetter: 'LR',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Lava Resistant',
    description:
      'This figure gains the Lava Resistant special power. This figure never rolls for molten lava damage or lava field damage and does not have to stop in molten lava spaces.',
  },
  {
    id: 'searingAmulet',
    name: 'Searing Amulet',
    shortName: 'Searing Intensity',
    glyphLetter: 'SI',
    type: 'treasure',
    duration: 'permanent',
    shortDescription: 'Searing Intensity',
    description:
      'After moving and before attacking, you must roll the 20-sided die once for each figure adjacent to this figure. If you roll a 14 or higher, that figure receives 1 wound. Figures with the Lava Resistant special power are not affected by the Glyph of Searing Amulet.',
  },
]
export const c3vPlaytestGlyphs: HexoscapeGlyph[] = [
  {
    id: 'lorjaValda',
    name: 'Lorja Valda',
    shortName: 'Move +1',
    glyphLetter: 'LV',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Move +1',
    description:
      'Add 1 to the Move Number for figures in your Army. (Do not use this power when moving off the Glyph).',
  },
  {
    id: 'quathiel',
    name: 'Quathiel',
    shortName: 'Move Order Marker',
    glyphLetter: 'QU',
    type: 'power',
    duration: 'permanent',
    shortDescription: '+1 normal attack for a Hero, 1x/turn',
    description:
      'Once during each turn, a Hero you control may add one extra attack die when attacking normally.',
  },
]
export const customGlyphs: HexoscapeGlyph[] = [
  {
    id: 'kasfa',
    name: 'Kasfa',
    shortName: 'Phantom Walk',
    glyphLetter: 'KA',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Phantom Walk',
    description:
      'Figures you control are never attacked when leaving an engagement and can move through all figures.',
  },
  {
    id: 'manigLodin',
    name: 'Manig Lodin',
    shortName: 'D20 +2',
    glyphLetter: 'ML',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'D20 +2',
    description:
      'Whenever you roll the 20 sided die, you may add two to your die roll.',
  },
  {
    id: 'dualigLodin',
    name: 'Dualig Lodin',
    shortName: 'D20 +/-1',
    glyphLetter: 'DL',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'D20 +/- 1',
    description:
      'When any player rolls a 20-sided die, you may choose to add 1 to the result or subtract 1 from the result.',
  },
  {
    id: 'nifl',
    name: 'Nifl',
    shortName: 'Heavy Fog',
    glyphLetter: 'NIFL',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Limit range 3',
    description:
      'Clear Sight & Line of Sight for all figures is reduced to 3 spaces.',
  },
  {
    id: 'solaAstrid',
    name: 'Sola Astrid',
    shortName: 'Attack +1',
    glyphLetter: 'SA',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Attack +1 1x/turn',
    description:
      'Once per numbered Order Marker, you may add one die to your attack roll when any figure in your army uses a Normal Attack.',
  },
  {
    id: 'solaGerda',
    name: 'Sola Gerda',
    shortName: 'Defense +1',
    glyphLetter: 'SG',
    type: 'power',
    duration: 'permanent',
    shortDescription: 'Defense +1 1x/turn',
    description:
      'Once per numbered Order Marker, before rolling defense dice, you may choose to roll 1 additional defense die.',
  },
]

// OHS
/*
Bracers of Teleportation
Brooch of Shielding
Dagmar
Gem of Lava Resistance
Giant Hunter Stone
Heroic Rune
Holdir
Kelda
Lodin
Lorja Ivor
Scarab of Invulnerability
Searing Amulet
Ulaniva
Valda
Wannok
Yngvild
Zawit
 */

// ScapeCon
/*
Dagmar
Manig Lodin [GameBear]
Sola Astrid [GameBear]
Valda
Wannok
Yngvild
*/

// HexiCon
/* 
Dagmar
Gem of Lava Resistance
Heroic Rune
Manig Lodin [GameBear]
Nifl [MegaSilver]
Searing Amulet
Sola Astrid [GameBear]
Talisman of Defense
Valda
Wannok
Yngvild
Zawit
 */
