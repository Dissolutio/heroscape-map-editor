import type { GraphicsTier } from '../../local-storage/settings'
import type { TextureLoadStatus } from '../textures/terrainTextureArrays'

export function shouldUseMarroHiveTexture(
  tier: GraphicsTier,
  textureLoadStatus: TextureLoadStatus,
  hasBaseColorMap: boolean,
) {
  return tier !== 'low' && textureLoadStatus === 'ready' && hasBaseColorMap
}
