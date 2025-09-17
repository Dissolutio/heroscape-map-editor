import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import useEvent from '../../hooks/useEvent'
import useBoundStore from '../../store/store'
import { EVENTS } from '../../utils/constants'
import { useSnackbar } from 'notistack'

const TakeAPictureBox = () => {
  const { gl, scene, camera } = useThree()
  const { subscribe, unsubscribe } = useEvent()
  const { enqueueSnackbar } = useSnackbar()
  const hexMap = useBoundStore((s) => s.hexMap)
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const addMapPortraitBase64 = useBoundStore((s) => s.addMapPortraitBase64)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <fns could be memoized, unimportant>
  useEffect(() => {
    const handleTakeMapPicture = () => {
      try {
        gl.render(scene, camera)
        const screenshot = gl.domElement.toDataURL()
        addMapPortraitBase64(screenshot)
        toggleIsTakingPicture(false)
        enqueueSnackbar({
          message:
            'Map portrait saved! Crop it in Edit tab, or download from File tab',
          variant: 'success',
        })
      } catch (error) {
        enqueueSnackbar({
          message:
            'Sorry, map portrait failed! Maybe you can upload one in File tab',
          variant: 'error',
        })
        console.error(error)
      }
    }

    subscribe(EVENTS.savePng, handleTakeMapPicture)
    subscribe(EVENTS.saveJpg, handleTakeMapPicture)

    return () => {
      unsubscribe(EVENTS.savePng, handleTakeMapPicture)
      unsubscribe(EVENTS.saveJpg, handleTakeMapPicture)
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
