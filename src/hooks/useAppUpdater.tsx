import { Button } from '@mui/material'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { closeSnackbar, useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { isDesktop } from '../platform'

// Checks GitHub releases (via tauri.conf.json updater endpoint) for a newer signed build
const useAppUpdater = () => {
  const { enqueueSnackbar } = useSnackbar()
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(isDesktop)
  const [isUpdatePromptOpen, setIsUpdatePromptOpen] = useState(false)

  // USE EFFECT: check for an update once on app load, desktop only
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on-load
  useEffect(() => {
    if (!isDesktop) {
      return
    }
    check()
      .then((update) => {
        if (!update) {
          setIsCheckingUpdate(false)
          return
        }
        setIsUpdatePromptOpen(true)
        const installUpdate = async () => {
          closeSnackbar(snackbarId)
          setIsUpdatePromptOpen(false)
          enqueueSnackbar({
            message: `Downloading update v${update.version}...`,
            variant: 'info',
          })
          try {
            await update.downloadAndInstall()
            await relaunch()
            // biome-ignore lint/suspicious/noExplicitAny: <error could be anything>
          } catch (error: any) {
            enqueueSnackbar({
              message: `Failed to install update: ${error?.message ?? error}`,
              variant: 'error',
              autoHideDuration: 5000,
            })
          }
        }
        const action = () => (
          <>
            <Button color="info" variant="contained" onClick={installUpdate}>
              Update &amp; Restart
            </Button>
            <Button
              color="warning"
              variant="contained"
              onClick={() => {
                closeSnackbar(snackbarId)
                setIsUpdatePromptOpen(false)
              }}
            >
              Later
            </Button>
          </>
        )
        const snackbarId = enqueueSnackbar({
          message: `Update available: v${update.version}`,
          variant: 'info',
          action,
          autoHideDuration: null,
        })
        setIsCheckingUpdate(false)
      })
      // biome-ignore lint/suspicious/noExplicitAny: <error could be anything>
      .catch((error: any) => {
        // Offline users or an unreachable GitHub should not see an alarming error
        console.error('🚀 ~ useAppUpdater ~ error:', error)
        setIsCheckingUpdate(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isCheckingUpdate, isUpdatePromptOpen }
}

export default useAppUpdater
