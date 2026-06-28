import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read and parse the armyCardsDotOrg.ts file
const filePath = path.join(__dirname, 'src/data/armyCardsDotOrg.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract the array from the file
const arrayStart = content.indexOf('const armyCardsRaw = [');
const arrayContent = content.substring(arrayStart + 'const armyCardsRaw = '.length);

// Parse the array by evaluating it in a safe way
const tempCode = `export default ${arrayContent}`;
const tempFile = '/tmp/temp_cards.mjs';
fs.writeFileSync(tempFile, tempCode);
const { default: armyCardsRaw } = await import(tempFile);

// Function to categorize power by its trigger timing
function categorizePower(powerName, powerText) {
  if (!powerName || !powerText) return null;

  const text = powerText.toLowerCase();
  const name = powerName.toLowerCase();

  // Check each category in order of specificity

  // 1. Special Attack - explicitly named special attacks with specific mechanics
  if (
    (text.includes('special attack') && (text.includes('range') || text.includes('lob') || text.includes('attack'))) ||
    text.includes('before attacking normally') ||
    text.includes('instead of attacking') ||
    text.includes('before rolling') && text.includes('attack')
  ) {
    return 'Special Attack / Before Attack Action';
  }

  // 2. When Rolling/During Combat Rolls
  if (
    (text.includes('when rolling') && (text.includes('attack') || text.includes('defense'))) ||
    (text.includes('adds') && text.includes('attack') && text.includes('dice')) ||
    (text.includes('add') && text.includes('defense') && text.includes('dice') && !text.includes('melee defense')) ||
    (text.includes('subtract') && text.includes('defense') && text.includes('dice'))
  ) {
    return 'Roll Modifier / During Combat';
  }

  // 3. Melee/Adjacent Combat Specific
  if (
    (name.includes('melee') && (text.includes('adjacent') || text.includes('add') || text.includes('subtract'))) ||
    (text.includes('when rolling') && text.includes('adjacent')) ||
    (text.includes('adjacent') && (text.includes('add') || text.includes('subtract'))) ||
    (name.includes('enhancement') && text.includes('melee'))
  ) {
    return 'Melee/Adjacent Combat Modifier';
  }

  // 4. When Defending
  if (
    (text.includes('when rolling defense') || text.includes('defending against')) ||
    (text.includes('subtract') && text.includes('defense dice'))
  ) {
    return 'Defense Reaction';
  }

  // 5. Passive Auras/Constant Effects
  if (
    (text.includes('figures of') && text.includes('add')) ||
    (text.includes('occupying') && (text.includes('add') || text.includes('gain'))) ||
    (text.includes('add') && text.includes('attack') && text.includes('occupying')) ||
    (text.includes('aura') || name.includes('aura')) ||
    (text.includes('any') && text.includes('figures') && text.includes('add') && !text.includes('when')) ||
    (text.includes('passive') || (text.includes('figures in') && text.includes('add') && !text.includes('when')))
  ) {
    return 'Passive Aura / Occupancy Effect';
  }

  // 6. Movement-Related Powers - if they moved, if they didn't move
  if (
    text.includes('does not move') ||
    (text.includes('if') && text.includes('moved') && (text.includes('add') || text.includes('bonus'))) ||
    (text.includes('if they') && text.includes('move')) ||
    (text.includes('moved at least') && text.includes('this turn'))
  ) {
    return 'Movement-Conditional Bonus';
  }

  // 7. Special Movement Abilities
  if (
    text.includes('can move') ||
    text.includes('may move') ||
    text.includes('flying') ||
    text.includes('climb') ||
    text.includes('teleport') ||
    text.includes('move through') ||
    text.includes('special movement') ||
    text.includes('burrow') ||
    name.includes('flight') ||
    name.includes('flying') ||
    name.includes('climb') ||
    name.includes('leap')
  ) {
    return 'Special Movement Ability';
  }

  // 8. When Attacked/Taking Damage
  if (
    (text.includes('when') && text.includes('attacked')) ||
    text.includes('when targeted') ||
    text.includes('when rolling attack') ||
    text.includes('when attacked by')
  ) {
    return 'When Attacked Reaction';
  }

  // 9. Death/Elimination Triggers
  if (
    text.includes('when a figure is killed') ||
    text.includes('when a figure dies') ||
    text.includes('when a member is eliminated') ||
    (text.includes('when one of') && text.includes('killed'))
  ) {
    return 'Death/Elimination Trigger';
  }

  // 10. Once Per Turn / Action Usage
  if (
    text.includes('once per turn') ||
    (text.includes('one') && text.includes('turn') && !text.includes('this turn')) ||
    text.includes('may use') ||
    text.includes('can use') ||
    text.includes('use an action') ||
    (text.includes('choose') && text.includes('attack')) ||
    text.includes('before taking a turn') ||
    text.includes('instead of attacking') ||
    text.includes('one of the')
  ) {
    return 'Once Per Turn / Limited Action';
  }

  // 11. Bonding/Connection Effects
  if (
    name.includes('bonding') ||
    (text.includes('with a') && text.includes('bonus')) ||
    text.includes('connected to') ||
    text.includes('linked')
  ) {
    return 'Bonding / Connection Effect';
  }

  // 12. Prevention/Restriction
  if (
    text.includes('cannot') ||
    text.includes('may not') ||
    text.includes('prevent') ||
    text.includes('is immune') ||
    text.includes('does not') ||
    text.includes('no clear line')
  ) {
    return 'Prevention / Restriction';
  }

  // 13. Damage/Healing
  if (
    (text.includes('restore') && text.includes('life')) ||
    text.includes('heal') ||
    text.includes('regenerat') ||
    (text.includes('life') && (text.includes('gain') || text.includes('add')))
  ) {
    return 'Healing / Life Restoration';
  }

  // 14. Summon/Create
  if (
    text.includes('summon') ||
    text.includes('create') ||
    text.includes('spawn') ||
    name.includes('summon')
  ) {
    return 'Summon / Create Effect';
  }

  // 15. Weapon/Item Effects - bonus to attack/defense from equipment
  if (
    (text.includes('+') && (text.includes('attack') || text.includes('defense'))) ||
    name.includes('attack') && !text.includes('attack') && !text.includes('attack dice') ||
    (text.includes('bonus') && (text.includes('attack') || text.includes('defense')))
  ) {
    return 'Weapon/Item Bonus';
  }

  // 16. Ability/Skill Based - general abilities that modify gameplay
  if (
    text.includes('expertise') ||
    text.includes('skill') ||
    text.includes('proficiency') ||
    name.includes('expert')
  ) {
    return 'Skill / Expertise';
  }

  // 17. Leadership/Inspiration Effects
  if (
    name.includes('leadership') ||
    name.includes('supremacy') ||
    name.includes('dispatch') ||
    (text.includes('ally') || text.includes('allies')) && !text.includes('when') ||
    text.includes('inspiration') ||
    (text.includes('command') && !text.includes('order marker'))
  ) {
    return 'Leadership / Inspiration';
  }

  // 18. Weapon/Item/Equipment Effects
  if (
    name.includes('rifle') ||
    name.includes('pistol') ||
    name.includes('cannon') ||
    name.includes('gun') ||
    name.includes('sword') ||
    name.includes('spear') ||
    name.includes('axe') ||
    name.includes('blade') ||
    name.includes('bow') ||
    name.includes('lance') ||
    name.includes('weapon') ||
    (name.includes('armor') && !name.includes('aura')) ||
    name.includes('amulet') ||
    (name.includes('shield') && !text.includes('when')) ||
    name.includes('helm') ||
    name.includes('robe') ||
    (text.includes('+') && (text.includes('attack') || text.includes('defense')))
  ) {
    return 'Weapon/Item/Equipment';
  }

  // 19. Attribute/Stat Effects
  if (
    name.includes('strength') ||
    (name.includes('defense') && !text.includes('when')) ||
    name.includes('agility') ||
    name.includes('vigor') ||
    (name.includes('armor') && name.includes('defense')) ||
    name.includes('spirit') && text.includes('add')
  ) {
    return 'Attribute Bonus / Stat Modifier';
  }

  // 20. Battle Frenzy / Rage / Berserker
  if (
    name.includes('frenzy') ||
    name.includes('berserker') ||
    name.includes('rage') ||
    name.includes('enraged') ||
    name.includes('fury') ||
    text.includes('frenzy') ||
    text.includes('berserk')
  ) {
    return 'Battle Frenzy / Rage Effect';
  }

  // 21. Defense Bonus / Protection
  if (
    (name.includes('defense') && name.includes('bonus')) ||
    (name.includes('defensive') && !text.includes('when')) ||
    (text.includes('defense') && text.includes('bonus')) ||
    name.includes('protection') ||
    (name.includes('shield') && text.includes('defense'))
  ) {
    return 'Defense Bonus / Protection';
  }

  // 22. Presence/Intimidation/Fear Effects
  if (
    name.includes('presence') ||
    name.includes('dreadful') ||
    name.includes('frightening') ||
    name.includes('intimidate') ||
    name.includes('fear') ||
    text.includes('frightening') ||
    text.includes('dreadful')
  ) {
    return 'Presence / Intimidation';
  }

  // 23. Thematic/Special Powers
  if (
    name.includes('curse') ||
    name.includes('blessing') ||
    name.includes('shadow') ||
    name.includes('corruption') ||
    name.includes('void')
  ) {
    return 'Thematic / Special Powers';
  }

  // 24. Size/Physical Attributes
  if (
    name.includes('scale') ||
    name.includes('levitat') ||
    name.includes('shrink') ||
    name.includes('giant') ||
    name.includes('tiny')
  ) {
    return 'Physical Transformation';
  }

  // 25. Attack Enhancement/Bonus
  if (
    (name.includes('enhancement') && text.includes('attack')) ||
    (name.includes('enhancement') && !text.includes('defense') && !text.includes('melee')) ||
    name.includes('smash') ||
    name.includes('strike') ||
    (name.includes('claw') || name.includes('gore') || name.includes('bite')) ||
    name.includes('charge')
  ) {
    return 'Attack Enhancement / Offensive Ability';
  }

  // 26. Additional Attack / Extra Turn
  if (
    text.includes('may attack one additional time') ||
    text.includes('attack one additional time') ||
    text.includes('one additional normal attack') ||
    text.includes('may attack an additional time') ||
    text.includes('make one additional') && text.includes('attack')
  ) {
    return 'Additional Attack / Extra Action';
  }

  // 27. Initiative/Order Related
  if (
    text.includes('initiative') ||
    name.includes('initiative') ||
    text.includes('order marker') ||
    text.includes('add to your initiative')
  ) {
    return 'Initiative / Order Marker Effect';
  }

  // 28. Combat Reactions to specific conditions
  if (
    text.includes('when attacking') && !text.includes('when attacking a') && !text.includes('adjacent') ||
    text.includes('after attacking') ||
    text.includes('before attacking') ||
    text.includes('after moving and before attacking')
  ) {
    return 'Combat Action Trigger';
  }

  // 29. Conditional Attack Modifier
  if (
    text.includes('if') && (text.includes('did not move') || text.includes('attacking') || text.includes('engaged')) ||
    text.includes('add') && text.includes('dice') && text.includes('attack') ||
    (text.includes('additional') && (text.includes('attack') || text.includes('defense')))
  ) {
    return 'Conditional Combat Modifier';
  }

  // 30. Movement/Engagement related
  if (
    text.includes('engaged') ||
    text.includes('adjacent figure') ||
    text.includes('within') && (text.includes('space') || text.includes('hex'))
  ) {
    return 'Engagement / Positioning';
  }

  // 31. Special wound/damage effect
  if (
    text.includes('inflict') && text.includes('wound') ||
    text.includes('wound marker') ||
    text.includes('excess shield')
  ) {
    return 'Wound / Damage Effect';
  }

  // 32. Group/Squad/Swarm Effects
  if (
    name.includes('horde') ||
    name.includes('wild') && name.includes('pack') ||
    name.includes('swarm') ||
    text.includes('swarm') ||
    text.includes('one falls') ||
    name.includes('hunting party')
  ) {
    return 'Group / Swarm Effect';
  }

  // 33. Elemental/Environmental Effects
  if (
    name.includes('ice') ||
    name.includes('lava') ||
    name.includes('water') ||
    name.includes('snow') ||
    name.includes('fire') ||
    name.includes('frost') ||
    name.includes('poison') ||
    text.includes('elemental') ||
    (text.includes('resistant') || text.includes('weakness'))
  ) {
    return 'Elemental / Environmental';
  }

  // 34. Resurrection/Death Avoidance
  if (
    text.includes('defy death') ||
    text.includes('rebirth') ||
    text.includes('resurrect') ||
    text.includes('rise again')
  ) {
    return 'Resurrection / Death Avoidance';
  }

  // 35. Evasion/Dodge Effects
  if (
    name.includes('dodge') ||
    name.includes('disengag') ||
    name.includes('tactical retreat') ||
    name.includes('evasion')
  ) {
    return 'Evasion / Dodge';
  }

  // 36. Consumption/Growth/Life Steal
  if (
    text.includes('drain') && text.includes('life') ||
    text.includes('devour') ||
    text.includes('engorge') ||
    text.includes('consume')
  ) {
    return 'Consumption / Life Drain';
  }

  // 37. Dark Magic/Necromancy
  if (
    name.includes('dark') ||
    name.includes('necro') ||
    name.includes('pact') ||
    text.includes('necromancy')
  ) {
    return 'Dark Magic / Necromancy';
  }

  // 38. Plant/Nature Powers
  if (
    name.includes('tree') ||
    name.includes('forest') ||
    name.includes('branch') ||
    name.includes('trunk') ||
    name.includes('flora')
  ) {
    return 'Plant / Nature Power';
  }

  // 39. Tech/Mechanical Effects
  if (
    name.includes('circuit') ||
    name.includes('robot') ||
    name.includes('tech') ||
    name.includes('redundant') ||
    text.includes('mechanical')
  ) {
    return 'Tech / Mechanical';
  }

  // 40. Morale/Social Effects
  if (
    name.includes('influence') ||
    name.includes('discipline') ||
    name.includes('coward') ||
    name.includes('morale') ||
    text.includes('coward')
  ) {
    return 'Morale / Social Effect';
  }

  // 41. Crowd Control / Area Damage
  if (
    text.includes('adjacent figure') && (text.includes('wound') || text.includes('damage')) ||
    name.includes('whirlwind') ||
    name.includes('cloud') ||
    name.includes('sweep')
  ) {
    return 'Area / Crowd Control';
  }

  // 42. Movement Enhancement
  if (
    name.includes('run ') ||
    name.includes('run down') ||
    name.includes('movement') ||
    name.includes('speed') ||
    (text.includes('move') && (text.includes('additional') || text.includes('extra')))
  ) {
    return 'Movement Enhancement';
  }

  // 43. Natural Weapon/Bite/Claw attacks
  if (
    name.includes('mandible') ||
    name.includes('fang') ||
    name.includes('sting') ||
    name.includes('talon')
  ) {
    return 'Natural Weapon';
  }

  // 44. Defense Passive (shield, armor effects)
  if (
    name.includes('shield') ||
    (name.includes('protection') && text.includes('defense')) ||
    (name.includes('aura') && text.includes('defense'))
  ) {
    return 'Defense Aura / Shield Effect';
  }

  // 45. Stat Effects (Eternal, Eternal Strength, etc.)
  if (
    name.includes('eternal') ||
    text.includes('stat') ||
    text.includes('permanent') ||
    text.includes('always')
  ) {
    return 'Permanent Stat Effect';
  }

  // 46. Stealth/Camouflage
  if (
    name.includes('camouflage') ||
    name.includes('stealth') ||
    name.includes('hide') ||
    name.includes('lurk') ||
    name.includes('shadow') && !text.includes('attack')
  ) {
    return 'Stealth / Camouflage';
  }

  // 47. Transformation/Shapeshifting
  if (
    name.includes('lycan') ||
    name.includes('transform') ||
    name.includes('morph')
  ) {
    return 'Transformation / Shapeshifting';
  }

  // 48. Possession/Control
  if (
    name.includes('mine!') ||
    text.includes('possess')
  ) {
    return 'Possession / Control';
  }

  // 49. Utility/Miscellaneous
  if (
    name.includes('disarm') ||
    name.includes('trap') ||
    name.includes('utility')
  ) {
    return 'Utility Power';
  }

  // 50. Squad/Group Benefits
  if (
    text.includes('rabble') ||
    text.includes('squad') ||
    text.includes('expendable')
  ) {
    return 'Squad Mechanic';
  }

  // 51. Sacrifice/Self-Harm mechanic
  if (
    text.includes('destroy') && text.includes('ignore') && text.includes('wound') ||
    text.includes('may destroy') && text.includes('adjacent')
  ) {
    return 'Sacrifice Mechanic';
  }

  // 52. Water/Terrain Movement  
  if (
    (text.includes('does not have to stop') && text.includes('water')) ||
    (text.includes('water') && text.includes('movement'))
  ) {
    return 'Water/Terrain Movement';
  }

  // 53. Defense Penalty/Immunity
  if (
    text.includes('never roll defense dice') ||
    text.includes('never have height advantage')
  ) {
    return 'Defense Penalty / Condition';
  }

  // 54. Multi-target Attack
  if (
    text.includes('may attack any or all') && text.includes('adjacent') ||
    text.includes('attack any or all figures')
  ) {
    return 'Multi-target Attack';
  }

  // 55. Shield blocking/Damage reduction
  if (
    text.includes('shield will block all') ||
    text.includes('one shield')
  ) {
    return 'Shield Blocking Mechanic';
  }

  // 56. Falling/Terrain Damage immunity
  if (
    text.includes('never rolls for falling') ||
    text.includes('falling damage')
  ) {
    return 'Falling Damage Immunity';
  }

  // 57. Movement attack (movement with damage)
  if (
    text.includes('while moving') && text.includes('wound') ||
    text.includes('while moving') && text.includes('adjacent')
  ) {
    return 'Movement Attack';
  }

  // 58. Conditional Turn/Action control
  if (
    text.includes('instead of taking a turn') ||
    text.includes('you may take a turn with')
  ) {
    return 'Special Turn Control';
  }

  // 59. Underground emergence attack
  if (
    text.includes('underground') && text.includes('destroy') ||
    text.includes('before using') && text.includes('destroy')
  ) {
    return 'Underground Emergence Attack';
  }

  // 60. Special Risk/Reward mechanic
  if (
    (text.includes('add') && text.includes('if you do') && text.includes('destroy')) ||
    (text.includes('roll the 20-sided die') && text.includes('if you roll'))
  ) {
    return 'Risk / Reward Mechanic';
  }

  // 61. Limited use per game
  if (
    text.includes('once per game')
  ) {
    return 'Limited Use Per Game';
  }

  return 'Other/Uncategorized';
}

// Extract and categorize all powers
const powers = {};
const powersByName = {};
const powerTexts = {};

armyCardsRaw.forEach((card) => {
  for (let i = 1; i <= 4; i++) {
    const powerName = card[`power${i}Name`];
    const powerText = card[`power${i}Text`];

    if (powerName && powerText) {
      const category = categorizePower(powerName, powerText);
      if (category) {
        if (!powers[category]) {
          powers[category] = [];
        }
        powers[category].push(powerName);
        powersByName[powerName] = category;
        powerTexts[powerName] = powerText;
      }
    }
  }
});

// Sort categories and remove duplicates
const sortedCategories = Object.keys(powers).sort();
const finalPowers = {};

sortedCategories.forEach((category) => {
  finalPowers[category] = [...new Set(powers[category])].sort();
});

// Generate markdown with details/summary tags
let markdown = '# Heroscape Card Powers by Trigger Category\n\n';

sortedCategories.forEach((category) => {
  const anchorId = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  markdown += `## ${category}\n\n`;
  finalPowers[category].forEach((powerName) => {
    const text = powerTexts[powerName] || '';
    // Escape HTML in the text
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    markdown += `<details>\n  <summary>${powerName}</summary>\n  ${escapedText}\n</details>\n`;
  });
  markdown += `\n[↑ Back to top](#heroscape-card-powers-by-trigger-category)\n\n`;
});

// Also add some stats
markdown += '\n---\n\n## Statistics\n\n';
let totalPowers = 0;
sortedCategories.forEach((category) => {
  const count = finalPowers[category].length;
  totalPowers += count;
  markdown += `- ${category}: ${count} powers\n`;
});
markdown += `\n**Total Unique Powers: ${totalPowers}**\n`;

// Write to file
const outputPath = path.join(__dirname, 'POWER_CATEGORIES.md');
fs.writeFileSync(outputPath, markdown);
console.log(`✓ Power categories written to ${outputPath}`);
console.log(`✓ Total categories: ${sortedCategories.length}`);
console.log(`✓ Total unique powers: ${totalPowers}`);

// Clean up
fs.unlinkSync('/tmp/temp_cards.mjs');
