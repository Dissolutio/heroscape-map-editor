import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'
import useEvent from '../../hooks/useEvent'
import useBoundStore, { saveMapPortraitWithoutUndo } from '../../store/store'
import { EVENTS } from '../../utils/constants'
import { canvasToMapPortrait } from '../../utils/mapPortrait'

const TakeAPictureBox = () => {
  const { gl, scene, camera } = useThree()
  const { subscribe, unsubscribe } = useEvent()
  const { enqueueSnackbar } = useSnackbar()
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const openCropMapPortraitDialog = useBoundStore(
    (s) => s.openCropMapPortraitDialog,
  )

  useEffect(() => {
    const handleTakeMapPicture = () => {
      let shouldOpenCropDialog = false
      try {
        gl.render(scene, camera)
        const screenshot = canvasToMapPortrait(
          gl.domElement,
          gl.domElement.width,
          gl.domElement.height,
        )
        saveMapPortraitWithoutUndo(screenshot)
        shouldOpenCropDialog = true
        enqueueSnackbar({
          message: 'Map picture taken',
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
        if (shouldOpenCropDialog) openCropMapPortraitDialog()
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
    openCropMapPortraitDialog,
    enqueueSnackbar,
  ])

  return <Box args={[0, 0, 0]} />
}

export default TakeAPictureBox
