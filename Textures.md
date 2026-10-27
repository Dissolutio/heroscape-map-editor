We must point a terrain to the correct internal layout of ORM maps.
Water/ToxicWater/WellspringWater/Ice all use shared roughness map for sparkles

```ts
const fluidOrmAtlas = useTexture('/atlases/orm_atlas.png')
fluidOrmAtlas.colorSpace = THREE.NoColorSpace // Correct linear data rendering

// 7 FLUID LAND
// 4 follow the Water template
// 3 unique: Lava, SwampWater, Shadow

// 14 SOLID LAND
// 11 follow the Sand template
// 2 follow the Road template
// 1 unique: Wood

// All 21 terrains receive:
const allTerrainProperties = {
  color: '#ffffff',
  metallic: 0, // black square
  sideMetallic: 0, // black rectangle
}

// FLUIDS:
// 4 follow the Water template
const sharedWaterProperties = {
  height: heightAtlas.water, // gray square
  normalMap: normalAtlas.water, // purple square 
  aoMap: ormAtlas.water, // white square
  roughnessMap: ormAtlas.water, // textured sparkle water

  sideHeight: sidesHeightAtlas.water,
  sideNormal: sidesNormalAtlas.water,
  sideAo: sidesOrmAtlas.water,
  sideRoughness: sidesOrmAtlas.water,
}
const waterMaterial = getSharedMaterial({
  map: capsAtlas.water,
  sideMap: sidesAtlas.water,
})
const wellspringWaterMaterial = getSharedMaterial({
  map: capsAtlas.wellspringWater,
  sideMap: sidesAtlas.wellspringWater,
})
const toxicWaterMaterial = getSharedMaterial({
  map: capsAtlas.toxicWater,
  sideMap: sidesAtlas.toxicWater,
})
const iceMaterial = getSharedMaterial({
  map: capsAtlas.ice,
  sideMap: sidesAtlas.ice,
})
  // 1 follow the SwampWater template:
  // Terrains: [SwampWater]
const swampWaterMaterial = getSharedMaterial({
  map: capsAtlas.swampWater,
  height: heightAtlas.water, // gray square
  normal: normalAtlas.water, // purple square 
  ao: ormAtlas.water, // white square
  roughness: ormAtlas.sand, // textured large-sparkle lava
  // side
  sideMap: sidesAtlas.swampWater,
  sideHeight: sidesHeightAtlas.water,
  sideNormal: sidesNormalAtlas.water,
  sideAo: sidesOrmAtlas.water,
  sideRoughness: sidesOrmAtlas.sand, // gray rectangle
})
  // 1 follow the Lava template:
  // Terrains: [Lava]
const lavaMaterial = getSharedMaterial({
  map: capsAtlas.ice,
  height: heightAtlas.water, // gray square
  normalMap: texturedFluidNormal, // purple square 
  aoMap: ormAtlas.water, // white square
  roughnessMap: ormAtlas.lava, // textured large-sparkle lava
  // side
  sideMap: sidesAtlas.lava,
  sideHeight: sidesHeightAtlas.water,
  sideNormal: sidesNormalAtlas.water,
  sideAo: sidesOrmAtlas.water,
  sideRoughness: sidesOrmAtlas.water,
})


  // 1 follow the Shadow template:
  // Terrains: [Shadow]
const shadowCapMaterial = getSharedMaterial({
  height: none, // flat fluid tiles
  map: #000, // No image, just darkness to swallow light
  normalMap: smoothFluidNormal,
  aoMap: fluidOrmAtlas,   // Points to the Smooth Fluid ORM frame
  roughnessMap: fluidOrmAtlas,
  metalnessMap: fluidOrmAtlas,
})

// SOLIDS

// 11 follow the Sand template:
// Terrains: [Ancient, Asphalt, Concrete, Dungeon, Grass, LavaField, Rock, Sand, Snow, Swamp, ToxicLand]
const sharedSolidRegular = {
  height: heightAtlas.sand,
  normalMap: normalAtlas.sand,
  aoMap: ormAtlas.sand,
  roughnessMap: ormAtlas.sand, // gray square
}
const grassMaterial = getSharedMaterial({
  map: capsAtlas.grass,
  sideMap: sidesAtlas.GroundSide,
})
const rockMaterial = getSharedMaterial({
  map: capsAtlas.rock,
  sideMap: sidesAtlas.GroundSide,
})
const sandMaterial = getSharedMaterial({
  map: capsAtlas.sand,
  sideMap: sidesAtlas.GroundSide,
})
const ancientMaterial = getSharedMaterial({
  map: capsAtlas.sand,
  sideMap: sidesAtlas.GroundSide,
})
// 2 follow the Road template:
// Terrains: [Road, WallWalk]
const sharedSolidRoad = {
  height: heightAtlas.road,
  normalMap: normalAtlas.road,
  aoMap: ormAtlas.road,
  roughnessMap: ormAtlas.road,
  metalnessMap: ormAtlas.road,
}


// 1 follow the Wood template:
// Terrains: [Wood]
const woodMaterial = getSharedMaterial({
  map: capsAtlas.Wood, // Wood diffuse image: when rendering high-quality (and using the associated roughness map), use capsAtlas.WoodDark
  height: heightAtlas.sand,
  normal: normalAtlas.sand,
  ao: ormAtlas.sand,
  roughness: ormAtlas.wood,
  // side
  sideMap: sidesAtlas.Wood,
})
