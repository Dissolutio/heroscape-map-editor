// Dev-only page (/model-compare): each fortress piece's classic model next to
// its Virtualscape model, over the hexes it stands on, plus the Virtualscape
// banner, which is not a piece yet. Not routed in production builds.
import { Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { Vector3 } from 'three'
import { useDisposableGLTF } from '../world/models/useDisposableGLTF'
import { HexTerrain } from '../types'
import { HEXGRID_HEX_HEIGHT } from '../utils/constants'
import { hexTerrainColor } from '../world/maphex/hexColors'
import {
  type CastleShape,
  CLASSIC_ARCH_TOP,
  getFortressModelUrl,
  VS_FORTRESS_BANNER_URL,
  vsArchScaleY,
  vsBaseTransformY,
  vsCastleNodeName,
  vsWallScaleY,
} from '../world/models/fortressModels'
import { basicModelMaterial } from '../world/models/materials'
import {
  useVsNodes,
  VsModel,
  vsNodeParts,
  vsWalkableTop,
} from '../world/models/VsFortressMeshes'

// ?look=source draws the Virtualscape models in their own colours and
// textures instead of the app's piece colours.
const isSourceLook =
  new URLSearchParams(window.location.search).get('look') === 'source'

const PIECES = [
  'base-corner',
  'base-straight',
  'base-end',
  'wall-corner',
  'wall-straight',
  'wall-end',
  'arch',
  'arch-no-door',
  'ladder',
  'battlement',
  'banner',
] as const
type Piece = (typeof PIECES)[number]

// A wall standing on land: 9 levels plus the classic 0.99 adjustment.
const WALL_SCALE_Y = 9.99
const APOTHEM = Math.sqrt(3) / 2

function hexOutline(cx: number) {
  const points: [number, number, number][] = []
  for (let i = 0; i <= 6; i += 1) {
    const angle = (Math.PI / 3) * i + Math.PI / 6
    points.push([cx + Math.cos(angle), 0.001, Math.sin(angle)])
  }
  return points
}

function Hexes({ count, x }: { count: number; x: number }) {
  return (
    <group position={[x, 0, 0]}>
      {[0, 2 * APOTHEM, 4 * APOTHEM].slice(0, count).map((cx) => (
        <Line key={cx} points={hexOutline(cx)} color="#d33" lineWidth={2} />
      ))}
    </group>
  )
}

const shapeOf = (piece: Piece): CastleShape =>
  piece.endsWith('end')
    ? 'End'
    : piece.endsWith('straight')
      ? 'Straight'
      : 'Corner'

function ClassicModel({ piece }: { piece: Piece }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const walls = useDisposableGLTF('/adjustable-castle-walls.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const arch = useDisposableGLTF('/castle-arch-handmade.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const ladder = useDisposableGLTF('/handmade-ladder.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const battlement = useDisposableGLTF('/handmade-battlement.glb') as any
  const mat = (color: string) => basicModelMaterial(color, true)
  if (piece.startsWith('base') || piece.startsWith('wall')) {
    const isWall = piece.startsWith('wall')
    const shape = shapeOf(piece)
    const color =
      hexTerrainColor[isWall ? HexTerrain.castleWall : HexTerrain.castleBase]
    const scaleY = isWall ? WALL_SCALE_Y : 1
    const capY = (scaleY - 1) * HEXGRID_HEX_HEIGHT
    return (
      <group>
        <mesh
          geometry={walls.nodes[`CastleWall${shape}Body`].geometry}
          scale={[1, scaleY, 1]}
          material={mat(color)}
        />
        <mesh
          geometry={walls.nodes.WallCap.geometry}
          position={[0, capY, 0]}
          material={mat(color)}
        />
        <mesh
          geometry={walls.nodes[`CastleWall${shape}Cap`].geometry}
          position={[0, capY, 0]}
          material={mat(color)}
        />
      </group>
    )
  }
  if (piece.startsWith('arch')) {
    const color = hexTerrainColor[HexTerrain.castleWall]
    return (
      <group>
        {piece === 'arch' && (
          <mesh
            geometry={arch.nodes.ArchDoor.geometry}
            material={mat(hexTerrainColor.castleDoor)}
          />
        )}
        {[
          'CastleArchBody',
          'CastleArchCapNear',
          'CastleArchCapMiddle',
          'CastleArchCapFar',
        ].map((name) => (
          <mesh
            key={name}
            geometry={arch.nodes[name].geometry}
            material={mat(color)}
          />
        ))}
      </group>
    )
  }
  if (piece === 'ladder') {
    return (
      <mesh
        position={[APOTHEM, 0, 0]}
        geometry={ladder.nodes.Ladder.geometry}
        material={mat(hexTerrainColor[HexTerrain.ladder])}
      />
    )
  }
  if (piece === 'battlement') {
    return (
      <mesh
        position={[APOTHEM, 0, 0]}
        geometry={battlement.nodes.Battlement.geometry}
        material={mat(hexTerrainColor[HexTerrain.battlement])}
      />
    )
  }
  return null
}

function VsArchCompare({ withDoor }: { withDoor: boolean }) {
  const archUrl = getFortressModelUrl('fortressArch', 'vs')
  const nodes = useVsNodes(archUrl)
  const top = vsWalkableTop(
    vsNodeParts(nodes, 'VsFortressArch')[0]?.node,
    CLASSIC_ARCH_TOP,
  )
  return (
    <group scale={[1, vsArchScaleY(top), 1]}>
      <VsModel
        url={archUrl}
        name="VsFortressArch"
        color={hexTerrainColor[HexTerrain.castleWall]}
        isHighlighted={false}
        pid="compare"
        sourceMaterials={isSourceLook}
      />
      {withDoor && (
        <VsModel
          url={getFortressModelUrl('fortressDoor', 'vs')}
          name="VsFortressDoor"
          color={hexTerrainColor.castleDoor}
          isHighlighted={false}
          pid="compare"
          sourceMaterials={isSourceLook}
        />
      )}
    </group>
  )
}

function VirtualscapeModel({ piece }: { piece: Piece }) {
  if (piece.startsWith('base')) {
    return (
      <VsModel
        url={getFortressModelUrl('castleBase', 'vs')}
        name={vsCastleNodeName('Base', shapeOf(piece))}
        fitY={(top) => {
          const { scale, offset } = vsBaseTransformY(top)
          return { scaleY: scale, offsetY: offset }
        }}
        color={hexTerrainColor[HexTerrain.castleBase]}
        isHighlighted={false}
        pid="compare"
        sourceMaterials={isSourceLook}
      />
    )
  }
  if (piece.startsWith('wall')) {
    return (
      <VsModel
        url={getFortressModelUrl('castleWall', 'vs')}
        name={vsCastleNodeName('Wall', shapeOf(piece))}
        fitY={(top) => ({ scaleY: vsWallScaleY(WALL_SCALE_Y, top) })}
        color={hexTerrainColor[HexTerrain.castleWall]}
        isHighlighted={false}
        pid="compare"
        sourceMaterials={isSourceLook}
      />
    )
  }
  if (piece.startsWith('arch')) {
    return <VsArchCompare withDoor={piece === 'arch'} />
  }
  if (piece === 'ladder' || piece === 'battlement') {
    const isLadder = piece === 'ladder'
    return (
      <group position={[APOTHEM, 0, 0]}>
        <VsModel
          url={getFortressModelUrl(
            isLadder ? 'fortressLadder' : 'fortressBattlement',
            'vs',
          )}
          name={isLadder ? 'VsFortressLadder' : 'VsFortressBattlement'}
          color={
            hexTerrainColor[
              isLadder ? HexTerrain.ladder : HexTerrain.battlement
            ]
          }
          isHighlighted={false}
          pid="compare"
          sourceMaterials={isSourceLook}
        />
      </group>
    )
  }
  return (
    <VsModel
      url={VS_FORTRESS_BANNER_URL}
      name="VsFortressBanner"
      color="#cccccc"
      isHighlighted={false}
      pid="compare"
      sourceMaterials
    />
  )
}

const initialPiece = (): Piece => {
  const value = new URLSearchParams(window.location.search).get('piece')
  return PIECES.find((piece) => piece === value) ?? 'wall-straight'
}

export default function ModelComparePage() {
  const [piece, setPiece] = useState<Piece>(initialPiece)
  const hexCount = piece.startsWith('arch') ? 3 : 1
  const gap = hexCount === 3 ? 7 : 3
  const isTall =
    piece.startsWith('wall') || piece.startsWith('arch') || piece === 'banner'
  const target = new Vector3(
    gap / 2 + (hexCount - 1) * APOTHEM,
    isTall ? 1.8 : 0.4,
    0,
  )
  const distance = hexCount === 3 ? 11 : isTall ? 8 : 5
  const isBanner = piece === 'banner'
  // ?view=top looks straight down, to check footprints and facing.
  const isTopView =
    new URLSearchParams(window.location.search).get('view') === 'top'
  const cameraPosition: [number, number, number] = isTopView
    ? [target.x, 30, 0.001]
    : [
        target.x + distance * 0.55,
        target.y + distance * 0.45,
        target.z + distance * 0.85,
      ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#20242a' }}>
      <div
        style={{
          position: 'absolute',
          zIndex: 1,
          left: 8,
          top: 8,
          color: 'white',
          fontFamily: 'sans-serif',
          fontSize: 14,
        }}
      >
        <select
          data-testid="model-compare-piece"
          value={piece}
          onChange={(event) => {
            const next = event.target.value as Piece
            setPiece(next)
            const url = new URL(window.location.href)
            url.searchParams.set('piece', next)
            window.history.replaceState(null, '', url)
          }}
        >
          {PIECES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>{' '}
        {isBanner
          ? 'Virtualscape banner (not a piece yet)'
          : 'left: Classic, right: Virtualscape'}
      </div>
      <Canvas
        key={piece}
        orthographic={isTopView}
        camera={
          isTopView
            ? {
                position: [target.x, 30, 0.001],
                zoom: hexCount === 3 ? 70 : 110,
              }
            : { position: cameraPosition, fov: 40 }
        }
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#20242a']} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 7]} intensity={2} />
        <directionalLight position={[-6, 4, -5]} intensity={0.6} />
        <Suspense fallback={null}>
          {isBanner ? (
            <group position={[gap / 2, 0, 0]}>
              <Hexes count={1} x={0} />
              <VirtualscapeModel piece={piece} />
            </group>
          ) : (
            <>
              <Hexes count={hexCount} x={0} />
              <ClassicModel piece={piece} />
              <group position={[gap, 0, 0]}>
                <Hexes count={hexCount} x={0} />
                <VirtualscapeModel piece={piece} />
              </group>
            </>
          )}
        </Suspense>
        <OrbitControls target={target} makeDefault />
      </Canvas>
    </div>
  )
}
