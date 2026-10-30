import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import { MdCloudUpload } from 'react-icons/md'
import { useSnackbar } from 'notistack'
import 'react-image-crop/dist/ReactCrop.css'
import { canvasToMapPortrait } from '../utils/mapPortrait'
import useBoundStore, { saveMapPortraitWithoutUndo } from '../store/store'
import { useMuiMediaQuery } from './useMuiMediaQuery'
import {
  cropRectToNaturalPixels,
  fullImageCrop,
  getCropResultDimensionsText,
  type ImageSize,
} from './cropMapPortrait'
import { DIALOGS } from './dialogNames'

function renderCroppedPortrait(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  preserveAlpha: boolean,
) {
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create a crop canvas')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )
  return canvasToMapPortrait(canvas, crop.width, crop.height, preserveAlpha)
}

function imageSupportsAlpha(imageSrc: string) {
  return /^data:image\/(?:png|webp|gif|avif);/i.test(imageSrc)
}

export default function CropMapPortraitDialog() {
  const isOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.cropMapPortrait
  const portrait = useBoundStore(
    (state) => state.hexMap.mapPortraitBase64 ?? '',
  )
  const closeCropDialog = useBoundStore(
    (state) => state.closeCropMapPortraitDialog,
  )
  const { isLargeScreenWidth, isSmallScreenWidth } = useMuiMediaQuery()
  const { enqueueSnackbar } = useSnackbar()
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSrc, setImageSrc] = useState(portrait)
  const [crop, setCrop] = useState<Crop>(fullImageCrop())
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageSize, setImageSize] = useState<ImageSize>()
  const [previewSrc, setPreviewSrc] = useState('')
  const [resultDimensions, setResultDimensions] = useState('')
  const [preserveAlpha, setPreserveAlpha] = useState(
    imageSupportsAlpha(portrait),
  )

  useEffect(() => {
    if (!isOpen) return
    setImageSrc(portrait)
    setCrop(fullImageCrop())
    setCompletedCrop(undefined)
    setImageSize(undefined)
    setPreviewSrc('')
    setResultDimensions('')
    setPreserveAlpha(imageSupportsAlpha(portrait))
  }, [isOpen, portrait])

  useEffect(() => {
    if (!isOpen || !imageSize || !completedCrop || !imageRef.current) return
    const timeout = window.setTimeout(() => {
      try {
        const naturalCrop = cropRectToNaturalPixels(completedCrop, imageSize)
        const image = imageRef.current
        if (!image) return
        setPreviewSrc(renderCroppedPortrait(image, naturalCrop, preserveAlpha))
        setResultDimensions(
          getCropResultDimensionsText(naturalCrop.width, naturalCrop.height),
        )
      } catch (error) {
        console.error('Failed to preview map picture crop', error)
        setPreviewSrc('')
      }
    }, 100)
    return () => window.clearTimeout(timeout)
  }, [isOpen, completedCrop, imageSize, preserveAlpha])

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    setPreserveAlpha(imageSupportsAlpha(imageSrc))
    setImageSize({
      displayWidth: image.width,
      displayHeight: image.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    })
    setCrop(fullImageCrop())
    setCompletedCrop({
      unit: 'px',
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      setImageSrc(reader.result)
      setCrop(fullImageCrop())
      setCompletedCrop(undefined)
      setImageSize(undefined)
      setPreviewSrc('')
      setResultDimensions('')
      setPreserveAlpha(imageSupportsAlpha(reader.result))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (useFullPicture = false) => {
    const image = imageRef.current
    if (!image || !imageSize || (!useFullPicture && !completedCrop)) return
    try {
      let naturalCrop: {
        x: number
        y: number
        width: number
        height: number
      }
      if (useFullPicture) {
        naturalCrop = {
          x: 0,
          y: 0,
          width: image.naturalWidth,
          height: image.naturalHeight,
        }
      } else {
        if (!completedCrop) return
        naturalCrop = cropRectToNaturalPixels(completedCrop, imageSize)
      }
      saveMapPortraitWithoutUndo(
        renderCroppedPortrait(image, naturalCrop, preserveAlpha),
      )
      closeCropDialog()
    } catch (error) {
      console.error('Failed to save map picture crop', error)
      enqueueSnackbar({
        message: 'Could not save the map picture. Please try again.',
        variant: 'error',
      })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={closeCropDialog}
      fullScreen={!isLargeScreenWidth}
      fullWidth
      maxWidth="lg"
      aria-labelledby="crop-map-picture-title"
    >
      <DialogTitle id="crop-map-picture-title">Crop map picture</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: isSmallScreenWidth ? 'column' : 'row',
          gap: 2,
          minHeight: 0,
        }}
      >
        <Box
          component="section"
          aria-label="Original picture"
          sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        >
          <Box component="h2" sx={{ fontSize: '1rem', mt: 0 }}>
            Original
          </Box>
          {imageSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
              minWidth={1}
              minHeight={1}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Original map portrait with adjustable crop"
                onLoad={handleImageLoad}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: isSmallScreenWidth ? '38vh' : '55vh',
                  objectFit: 'contain',
                }}
              />
            </ReactCrop>
          ) : (
            <Box sx={{ py: 4 }}>No map picture available.</Box>
          )}
          <Button
            component="label"
            size="small"
            startIcon={<MdCloudUpload />}
            sx={{ mt: 1 }}
          >
            Upload a different picture
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleUpload}
            />
          </Button>
          <Button
            size="small"
            onClick={() => {
              setCrop(fullImageCrop())
              if (imageRef.current && imageSize) {
                setCompletedCrop({
                  unit: 'px',
                  x: 0,
                  y: 0,
                  width: imageRef.current.width,
                  height: imageRef.current.height,
                })
              }
            }}
            disabled={!imageSize}
          >
            Reset crop
          </Button>
        </Box>
        <Box
          component="section"
          aria-label="Crop result preview"
          sx={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            borderLeft: isSmallScreenWidth ? 0 : 1,
            borderColor: 'divider',
            pl: isSmallScreenWidth ? 0 : 2,
          }}
        >
          <Box component="h2" sx={{ fontSize: '1rem', mt: 0 }}>
            Result
          </Box>
          {previewSrc ? (
            <Box
              sx={{
                display: 'inline-block',
                p: preserveAlpha ? 1 : 0,
                backgroundColor: preserveAlpha ? '#fff' : 'transparent',
                backgroundImage: preserveAlpha
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                  : 'none',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              <img
                src={previewSrc}
                alt="Cropped result preview"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: isSmallScreenWidth ? '30vh' : '45vh',
                  objectFit: 'contain',
                  margin: '0 auto',
                }}
              />
            </Box>
          ) : (
            <Box sx={{ py: 4 }}>Preview unavailable</Box>
          )}
          <Box aria-live="polite">
            {resultDimensions ? `${resultDimensions} px` : ''}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeCropDialog}>Cancel</Button>
        <Button onClick={() => handleSave(true)} disabled={!imageSize}>
          Use full picture
        </Button>
        <Button
          onClick={() => handleSave()}
          disabled={!imageSize || !completedCrop || !previewSrc}
          autoFocus
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
