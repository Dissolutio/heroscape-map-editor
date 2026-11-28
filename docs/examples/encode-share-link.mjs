import { pathToFileURL } from 'node:url'
import JSONCrush from 'jsoncrush'

const hexMap = {
  id: 'share-link-example',
  name: 'Share Link Example',
  author: 'Example',
  version: 1,
  shape: 'rectangle',
  length: 20,
  width: 20,
  mapPortraitBase64: '',
  mapNotes: '',
}

const pieceStrings = ['0~8~8~0~g7', '1~8~8~0~tr10', '1~9~8~0~z1']
const payload = [hexMap, ...pieceStrings]
const data = encodeURIComponent(JSONCrush.crush(JSON.stringify(payload)))

export const shareUrl = `https://hexoscape.com/hs?m=${data}`

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(shareUrl)
}
