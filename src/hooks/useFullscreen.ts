import { getCurrentWindow } from '@tauri-apps/api/window'
import { useSnackbar } from 'notistack'
import { useCallback, useEffect, useState } from 'react'
import { isDesktop } from '../platform'

/**
 * Fullscreen state and toggle for the header button.
 *
 * Desktop app: fullscreens the native window through Tauri. The page-level
 * Fullscreen API (requestFullscreen) crashes the desktop app's WebView, so it
 * is never called there.
 * Web: the browser's Fullscreen API, as before.
 */
export function useFullscreen() {
  const { enqueueSnackbar } = useSnackbar()
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (isDesktop) {
      const appWindow = getCurrentWindow()
      const refresh = () =>
        appWindow
          .isFullscreen()
          .then(setIsFullscreen)
          .catch(() => undefined)
      refresh()
      // fullscreen can also change from the OS (keyboard shortcut, window manager)
      const unlisten = appWindow.onResized(refresh)
      return () => {
        unlisten.then((stop) => stop()).catch(() => undefined)
      }
    }
    const handleChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleChange)
    handleChange()
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (isDesktop) {
        const appWindow = getCurrentWindow()
        const next = !(await appWindow.isFullscreen())
        await appWindow.setFullscreen(next)
        setIsFullscreen(next)
        return
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else {
        enqueueSnackbar({
          message: 'Fullscreen mode not available',
          variant: 'error',
        })
      }
    } catch (error) {
      enqueueSnackbar({
        message: `Could not change fullscreen: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'error',
      })
    }
  }, [enqueueSnackbar])

  return { isFullscreen, toggleFullscreen }
}
