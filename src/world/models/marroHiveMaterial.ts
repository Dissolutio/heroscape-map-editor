import type { GraphicsTier } from '../../local-storage/settings'
import type { TextureLoadStatus } from '../textures/terrainTextureArrays'
import { shouldUseTieredModelTexture } from './texturedModelMaterial'

export function shouldUseMarroHiveTexture(
  tier: GraphicsTier,
  textureLoadStatus: TextureLoadStatus,
  hasBaseColorMap: boolean,
) {
  return shouldUseTieredModelTexture(tier, textureLoadStatus, hasBaseColorMap)
}
