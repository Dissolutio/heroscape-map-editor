// because we specify {type: 'module} in worker options, we can import from our project!
// import { coolFn } from './someDir/coolFn'

self.onmessage = (event: MessageEvent) => {
  const boardPieces = event?.data
  console.log("🚀 ~ boardPieces:", boardPieces)
  const result = {}
  self.postMessage(result)
}