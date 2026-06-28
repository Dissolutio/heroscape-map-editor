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
const tempFile = '/tmp/temp_cards_inspect.mjs';
fs.writeFileSync(tempFile, tempCode);
const { default: armyCardsRaw } = await import(tempFile);

// Extract sample uncategorized powers with their text
const uncategorizedSamples = [
  'ACROBATIC', 'ANKLE SHANK', 'BASH', 'CLING', 'GLIDE',
  'COMBAT LEADER', 'CLEAR SHOT', 'CRUSHING BLOW',
  'DISHONORABLE ATTACK', 'DOUBLE ATTACK', 'FINISHING BLOW',
  'GRIT', 'HARD TARGETS', 'HEAVY SUPPORT COMMAND BEACON',
  'INITIATIVE ADVANTAGE', 'LUMBERING BULLY', 'MUDDY WATERS',
  'PRIORITY TARGETING', 'REACH', 'RUNNING LEAP'
];

console.log('Sample of uncategorized powers and their text:\n');

armyCardsRaw.forEach((card) => {
  for (let i = 1; i <= 4; i++) {
    const powerName = card[`power${i}Name`];
    const powerText = card[`power${i}Text`];

    if (powerName && uncategorizedSamples.includes(powerName)) {
      console.log(`\n${powerName}:`);
      console.log(`  ${powerText.substring(0, 200)}...`);
    }
  }
});

fs.unlinkSync(tempFile);
