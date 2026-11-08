import useBoundStore from '../store/store'
import {
  buildHotkeyConfig,
  defaultHotkeyConfig,
  HOTKEY_ACTIONS,
  getActionHotkeys,
} from '../data/hotkeys'

export { defaultHotkeyConfig, HOTKEY_ACTIONS, getActionHotkeys }

export const useHotkeyConfig = () => {
  const overrides = useBoundStore((state) => state.hotkeyOverrides)
  const hotkeyConfig = buildHotkeyConfig(overrides)
  const hotkeyLookup = Object.fromEntries(
    Object.entries(hotkeyConfig).flatMap(([key, action]) =>
      action ? [[action, key]] : [],
    ),
  )

  return { hotkeyConfig, hotkeyLookup }
}
