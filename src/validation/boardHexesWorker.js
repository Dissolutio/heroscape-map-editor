// because we specify {type: 'module} in worker options, we can import from our project!
// import { coolFn } from './someDir/coolFn'
self.onmessage = (event) => {
  const workerArgs = event?.data
  console.log("🚀 ~ workerArgs:", workerArgs)
  const result = workerArgs
  // const result = coolFn?.(workerArgs) ?? workerArgs // if you don't have a coolFn, borrow mine
  self.postMessage(result)
}