import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import useEvent from '../../hooks/useEvent'
import useBoundStore from '../../store/store'
import { EVENTS } from '../../utils/constants'

const TakeAPictureBox = () => {
  const { gl, scene, camera } = useThree()
  const { subscribe, unsubscribe } = useEvent()
  const hexMap = useBoundStore((s) => s.hexMap)
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)

  useEffect(() => {
    const handleDownloadPng = () => {
      gl.render(scene, camera)
      const screenshot = gl.domElement.toDataURL()
      const link = document.createElement('a')
      link.download = `${hexMap.name}.png`
      link.href = screenshot
      // document.body.appendChild(link)
      link.click()
      // document.body.removeChild(link)
      toggleIsTakingPicture(false)
    }
    const handleDownloadJpg = () => {
      gl.render(scene, camera)
      const screenshot = gl.domElement.toDataURL()
      const link = document.createElement('a')
      link.download = `${hexMap.name}.jpg`
      link.href = screenshot
      // document.body.appendChild(link)
      link.click()
      // document.body.removeChild(link)
      toggleIsTakingPicture(false)
    }
    subscribe(EVENTS.savePng, handleDownloadPng)
    subscribe(EVENTS.saveJpg, handleDownloadJpg)

    return () => {
      unsubscribe(EVENTS.savePng, handleDownloadPng)
      unsubscribe(EVENTS.saveJpg, handleDownloadJpg)
    }
  }, [
    camera,
    gl,
    scene,
    toggleIsTakingPicture,
    subscribe,
    unsubscribe,
    hexMap.name,
  ])

  return <Box args={[0, 0, 0]} />
}

export default TakeAPictureBox
