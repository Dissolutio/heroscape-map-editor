function removeNonDigits(str) {
  return str.replace(/\D/g, '');
}
function removeDigits(str) {
  return str.replace(/[0-9]/g, '');
}
// title
const name = (document.querySelectorAll('.wp-block-media-text__content')[0]).querySelectorAll('strong')[0].textContent
const singleName = name
const genWorldPoints = document.querySelectorAll('.wp-block-media-text__content')[0]
  .querySelectorAll('p')[1].textContent.split('–')
const general = genWorldPoints[0].trim()
const homeworld = genWorldPoints[1].trim()
const points = removeNonDigits(genWorldPoints[1].trim())
const col1Nodes = document.querySelectorAll('.wp-block-column-is-layout-flow')[0]
  .querySelector('p').childNodes
// species, type, personality, trait, height
const species = col1Nodes[0].data.toLowerCase()
const type = col1Nodes[2].data.toLowerCase()
const personality = col1Nodes[4].data.toLowerCase()
const cardClass = col1Nodes[6].data.toLowerCase()
const height = removeNonDigits(col1Nodes[8].data.toLowerCase())
const heightClass = removeDigits(col1Nodes[8].data.toLowerCase()).trim()

const col2Nodes = document.querySelectorAll('.wp-block-column-is-layout-flow')[1]
  .querySelector('p').childNodes
// Life, Move, Range, Attack, Defense
const life = removeNonDigits(col2Nodes[0].data.toLowerCase())
const move = removeNonDigits(col2Nodes[2].data.toLowerCase())
const range = removeNonDigits(col2Nodes[4].data.toLowerCase())
const attack = removeNonDigits(col2Nodes[6].data.toLowerCase())
const defense = removeNonDigits(col2Nodes[8].data.toLowerCase())

const armyCardID = "hsVc1000_CHANGE"
const image = ""
const portraitPattern = ""

const card = {
  name,
  singleName,
  armyCardID,
  image,
  portraitPattern,
  general,
  species,
  type,
  cardClass,
  personality,
  height,
  heightClass,
  life,
  move,
  range,
  attack,
  defense,
}
console.log('card', card)
