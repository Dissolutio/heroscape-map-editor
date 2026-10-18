import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'
import useEvent from '../../hooks/useEvent'
import useBoundStore from '../../store/store'
import { EVENTS } from '../../utils/constants'
import { canvasToMapPortrait } from '../../utils/mapPortrait'

const TakeAPictureBox = () => {
  const { gl, scene, camera } = useThree()
  const { subscribe, unsubscribe } = useEvent()
  const { enqueueSnackbar } = useSnackbar()
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const addMapPortraitBase64 = useBoundStore((s) => s.addMapPortraitBase64)

  useEffect(() => {
    const handleTakeMapPicture = () => {
      try {
        gl.render(scene, camera)
        const screenshot = canvasToMapPortrait(
          gl.domElement,
          gl.domElement.width,
          gl.domElement.height,
        )
        addMapPortraitBase64(screenshot)
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
      } finally {
        toggleIsTakingPicture(false)
      }
    }

    subscribe(EVENTS.savePng, handleTakeMapPicture)

    return () => {
      unsubscribe(EVENTS.savePng, handleTakeMapPicture)
    }
  }, [
    camera,
    gl,
    scene,
    toggleIsTakingPicture,
    subscribe,
    unsubscribe,
    addMapPortraitBase64,
    enqueueSnackbar,
  ])

  return <Box args={[0, 0, 0]} />
}

export default TakeAPictureBox
