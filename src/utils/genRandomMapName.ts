// GENERATE RANDOM MAP NAME
export function genRandomMapName() {
  const randomDeityName = norseDeityNames[Math.floor(Math.random() * norseDeityNames.length)];
  const deityThing = deityThings[Math.floor(Math.random() * deityThings.length)];
  return `${deityThing} of ${randomDeityName}`;
}

const coldThings = [
  "Revenge",
  "Last Gasp",
  "Fjord",
  "Glacier",
  "Tundra",
  "Arctic Hideout",
  "Frost",
]
const cityThings = [
  "Canals",
  "Port",
  "Prison",
  "Ruins",
  "Hospital",
  "Fort",
  "Castle",
  "Tower",
]
const wateryThings = [
  "Isles",
  "Beaches",
  "Cove",
  "Grotto",
  "Seas",
  "Shipwreck",
]
const grassyThings = [
  "Plains",
  "Fields",
  "Woods",
  "Forest",
  "Hunting Grounds"
]
const sandyThings = [
  "Desert",
  "Mesa",
  "Canyon",
  "Gorge",
  "Plateau"
]
const rockyThings = [
  "Cliffs",
  "Mountains",
  "Tomb",
  "Halls",
  "Cave",
  "Inselberg"
]
const deityThings = [
  ...rockyThings,
  ...sandyThings,
  ...grassyThings,
  ...wateryThings,
  ...cityThings,
  ...coldThings,
  "Smite",
  "Fall",
  "Origin",
  "Scourge",
  "Flight",
  "Raid",
  "Forge",
  "Feast",
  "Ambush",
  "Siege",
];
const norseDeityNames = [
  "Aasgard",
  "Aegir",
  "Aesir",
  "Alfheim",
  "Alfheimr",
  "Amleth",
  "Amlethus",
  "Amlóða",
  "Amlóði",
  "Amma",
  "Andhrimnir",
  "Andvari",
  "Angerbda",
  "Angrboda",
  "Asabru",
  "Asbru",
  "Asgaard",
  "Asgard",
  "Asgård",
  "Asgardr",
  "Ask",
  "Askr",
  "Astrild",
  "Audhumbla",
  "Audhumla",
  "Audhumla",
  "Auðumbla",
  "Auðumla",
  "Aurgelmir",
  "Aurvandil",
  "Aurvandill",
  "Authumla",
  "Álfheimr",
  "Ásgarðr",
  "Åsgard",
  "Ægir",
  "Æsgard",
  "Æsir",
  "Balder",
  "Baldr",
  "Baldur",
  "Besla",
  "Bestla",
  "Beyla",
  "Bifrost",
  "Bilfrost",
  "Billow Maidens",
  "Biort",
  "Bjort",
  "Blid",
  "Blith",
  "Bor",
  "Borr",
  "Brage",
  "Bragi",
  "Brono",
  "Brunhild",
  "Brunhilde",
  "Brunhilt",
  "Brunnhilde",
  "Brynhild",
  "Brynhildr",
  "Bur",
  "Buri",
  "Búri",
  "Byggvir",
  "Bylgia",
  "Bylgja",
  "Dísir",
  "Disir",
  "Donar",
  "Drofn",
  "Dröfn",
  "Eir",
  "Elder Mother",
  "Elder Woman",
  "Elli",
  "Embla",
  "Fafnir",
  "Fenric",
  "Fenrir",
  "Fenris",
  "Fenrisulfr",
  "Fjorgyn",
  "Forseti",
  "Frey",
  "Freya",
  "Freyja",
  "Freyr",
  "Fricco",
  "Frigg",
  "Frigga",
  "Frost Giants",
  "Fulla",
  "Gangleri",
  "Garm",
  "Gefion",
  "Gefiun",
  "Gefjon",
  "Gefjun",
  "Geirölul",
  "Geironul",
  "Geirönul",
  "Geirrod",
  "Geirrönul",
  "Geirskogul",
  "Geirskögul",
  "Geirskokul",
  "Gerd",
  "Gerda",
  "Gerdhr",
  "Gersemi",
  "Gerth",
  "Gertrude",
  "Gerutha",
  "Ginnungagap",
  "Gjalp",
  "Gladsheim",
  "Gladsheimr",
  "Glut",
  "Godheim",
  "Goðheimar",
  "Goðheimr",
  "Göll",
  "Goll",
  "Gondul",
  "Gotterdammerung",
  "Greip",
  "Grid",
  "Groa",
  "Guðr",
  "Guinn",
  "Gullintani",
  "Gullveig",
  "Gullweig",
  "Gunlod",
  "Gunn",
  "Gunnlod",
  "Gunnlöd",
  "Gunnlöð",
  "Gunnr",
  "Guthorm",
  "Guttorm",
  "Guttormr",
  "Hamlet",
  "Hár",
  "Har",
  "Hardgreip",
  "Hardgrep",
  "Harðgreip",
  "Harðgreipr",
  "Harr",
  "Harthgrepa",
  "Hati",
  "Hávamál",
  "Havamal",
  "Heid",
  "Heidrun",
  "Heiðr",
  "Heimdall",
  "Heimdallr",
  "Hel",
  "Hela",
  "Helgardh",
  "Helheim",
  "Helheimr",
  "Hell",
  "Herfjoturr",
  "Hermod",
  "Hermóðr",
  "Hermoth",
  "Hild",
  "Hilde",
  "Hildr",
  "Hildur",
  "Hladgunnr",
  "Hlaðguðr",
  "Hlin",
  "Hlodyn",
  "Hlökk",
  "Hlokk",
  "Hnoss",
  "Hnossa",
  "Höd",
  "Hod",
  "Hoder",
  "Hodur",
  "Höðr",
  "Hoenir",
  "Hohnir",
  "Honir",
  "Hraesvelg",
  "Hræsvelg",
  "Hreidmar",
  "Hrim",
  "Hrimnir",
  "Hrist",
  "Hrungnir",
  "Hrym",
  "Hulder",
  "Huldra",
  "Hyldemoer",
  "Hyldequinde",
  "Hymir",
  "Hyndla",
  "Hyrokkin",
  "Hyrrokkin",
  "Ice Giants",
  "Idun",
  "Iduna",
  "Idunn",
  "Jafenhar",
  "Jaffnhar",
  "Jafnhar",
  "Jafnhár",
  "Jafnhárr",
  "Jafnharr",
  "Jarnsaaxa",
  "Járnsaxa",
  "Jarnsaxa",
  "Jord",
  "Jörð",
  "Jörð",
  "Jörmungand",
  "Jormungand",
  "Jormungandr",
  "Jörmungandr",
  "Jörth",
  "Jotnar",
  "Jotunheim",
  "Jötunheimr",
  "Jötunn",
  "Kara",
  "Kvasir",
  "Laufey",
  "Lif",
  "Líf",
  "Lífthrasir",
  "Lifthrasir",
  "Liv",
  "Lofn",
  "Loke",
  "Loki",
  "Loki-Laufeyjarson",
  "Lokkju",
  "Lopter",
  "Lopti",
  "Magni",
  "Manheimr",
  "Mani",
  "Mannheim",
  "Midgard",
  "Miðgarðr",
  "Mimir",
  "Mist",
  "Mjollner",
  "Mjollnir",
  "Mjolnir",
  "Modgud",
  "Modi",
  "Módi",
  "Móði",
  "Mokerkialfi",
  "Mokkerkalfe",
  "Mokkurkaflir",
  "Mokkurkalfi",
  "Mökkurkálfi",
  "Mothi",
  "Muspelheim",
  "Muspelheimr",
  "Muspell",
  "Muspellheim",
  "Muspellsheimr",
  "Mysterious Three",
  "Nanna",
  "Narfi",
  "Nari",
  "Narvi",
  "Nehalennia",
  "Nibelungs",
  "Nidavellir",
  "Nidhogg",
  "Nídhögg",
  "Nidhoggr",
  "Nidhøg",
  "Niðavellir",
  "Níðhöggr",
  "Niflheim",
  "Niflheimr",
  "Niflhel",
  "Nine Worlds",
  "Nithhogg",
  "Niu-Heimar",
  "Níu-Heimar",
  "Njoerd",
  "Njor",
  "Njord",
  "Njörðr",
  "Njoror",
  "Njorth",
  "Nor",
  "Nörfi",
  "Norns",
  "Nörr",
  "Nott",
  "Ód",
  "Óðr",
  "Od",
  "Odin",
  "Odinn",
  "Odr",
  "Odur",
  "Oller",
  "Othinn",
  "Otr",
  // "Otter (2)",
  "Poetic-Edda",
  "Radgrid",
  "Radgridr",
  "Rádgrídr",
  "Ráðgríðr",
  "Ragnarök",
  "Ragnarok",
  "Ragnarøkr",
  "Ragnorak",
  "Rainbow-Bridge",
  "Ran",
  "Ratatosk",
  "Ratatoskr",
  "Regin",
  "Rig",
  "Rind",
  "Rindr",
  "Rota",
  "Róta",
  "Ruta",
  "Sága",
  "Saga",
  "Såga",
  "Sibilja",
  "Síbilja",
  "Siegfried",
  "Sif",
  "Sigurd",
  "Sigyn",
  "Sjofn",
  "Skadi",
  "Skaði",
  "Skeggiöld",
  "Skeggjöld",
  "Skeggöld",
  "Skirnir",
  "Skogul",
  "Skoll",
  "Skuld",
  "Sleipner",
  "Sleipnir",
  "Snotra",
  "Sokkvabekk",
  "Sökkvabekk",
  "Sökkvabekkr",
  "Sol",
  "Sól",
  "Søkkvabekk",
  "Surt",
  "Surtr",
  "Suttung",
  "Suttungr",
  "Svartalfheim",
  "Svartálfheimr",
  "Svartalfheimr",
  "Swan Maidens",
  "Syn",
  "Thialfi",
  "Thiassi",
  "Thjalfi",
  "Thor",
  "Thridi",
  "Thrud",
  "Thrudheim",
  "Thunor",
  "Týr",
  "Tyr",
  "Ull",
  "Uller",
  "Ullr",
  "Ullur",
  "Urd",
  "Urðr",
  "Urth",
  "Vafthrudnir",
  "Vafthruthnir",
  "Vafþrúðnir",
  "Vaganhope",
  "Vagnhofde",
  "Vagnhofde",
  "Vagnhofdi",
  "Vagnhofᵭi",
  "Vak",
  "Valder",
  "Valhalla",
  "Vali",
  // "Vali (2)",
  "Valkyries",
  "Valkyrja",
  "Valtam",
  "Vanaheim",
  "Vanaheimr",
  "Vanir",
  "Ve",
  "Verdandi",
  "Vidar",
  "Víðarr",
  "Vili",
  "Ville",
  "Vithar",
  "Völsung",
  "Volsung",
  "Vǫlsungr",
  "Vuldr",
  "Wagnhoftus",
  "Walkyries",
  "Wave Maidens",
  "Yggdrasil",
  "Yggdrasill",
  "Ymir",
  "Yngvi",
  "Yngvi-Freyr",
  "Þórr",
  "Þriðji",
  "Þunor"
]