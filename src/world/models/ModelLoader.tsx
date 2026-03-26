import { Html, useProgress } from '@react-three/drei'
import React from 'react'

export default function ModelLoader() {
  const { progress } = useProgress()

  // local state that will be updated once per second so the UI refreshes at a consistent interval
  const [displayProgress, setDisplayProgress] = React.useState<number>(
    Math.round(progress),
  )

  // keep a ref to the latest progress so the interval callback can read it without needing to recreate the interval
  const progressRef = React.useRef<number>(progress)
  React.useEffect(() => {
    progressRef.current = progress
  }, [progress])

  React.useEffect(() => {
    const id = setInterval(() => {
      // round for display and update state if changed
      const latest = Math.round(progressRef.current)
      setDisplayProgress((prev) => (prev === latest ? prev : latest))
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <Html center style={{ pointerEvents: 'none' }}>
      {displayProgress}% model load
    </Html>
  )
}
