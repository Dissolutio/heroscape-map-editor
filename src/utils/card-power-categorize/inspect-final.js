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
const tempFile = '/tmp/temp_cards_final.mjs';
fs.writeFileSync(tempFile, tempCode);
const { default: armyCardsRaw } = await import(tempFile);

// Extract final uncategorized powers with their text
const uncategorized = [
  'ACROBATIC', 'DEVOUR FROM BENEATH', 'ENGORGE', 'EXPENDABLE RABBLE',
  'GLIDE', 'HARD TARGETS', 'INTO THE BREACH', 'MASTER\'S ASSAULT',
  'NEGATIVE ELEMENT', 'SACRED BAND DEFY DEATH 15', 'SHAOLIN ASSAULT',
  'SLITHER', 'TRAMPLE STOMP', 'UTGAR\'S ORDERS'
];

console.log('Final 14 uncategorized powers:\n');

armyCardsRaw.forEach((card) => {
  for (let i = 1; i <= 4; i++) {
    const powerName = card[`power${i}Name`];
    const powerText = card[`power${i}Text`];

    if (powerName && uncategorized.includes(powerName)) {
      console.log(`\n${powerName}:`);
      console.log(`  ${powerText}`);
    }
  }
});

fs.unlinkSync(tempFile);
