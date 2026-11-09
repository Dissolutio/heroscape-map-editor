export const defaultHotkeyConfig = {
  delete: 'deleteSelectedPiece',
  backspace: 'deleteSelectedPiece',

  // CAMERA
  insert: 'handleToggleIsOrthoCam',
  end: 'handleToggleIsCameraDisabled',
  home: 'zoomToMap',
  up: 'cameraPanUp',
  down: 'cameraPanDown',
  left: 'cameraPanLeft',
  right: 'cameraPanRight',
  'shift+up': 'cameraRotateUp',
  'shift+down': 'cameraRotateDown',
  'shift+left': 'cameraRotateLeft',
  'shift+right': 'cameraRotateRight',
  'mod+left': 'cameraRotateLeftFar',
  'mod+right': 'cameraRotateRightFar',
  'mod+up': 'cameraZoomIn',
  'mod+down': 'cameraZoomOut',

  pagedown: 'decrementViewingLevel',
  pageup: 'incrementViewingLevel',

  // 2 control buttons
  'mod+z': 'undoWorld',
  'mod+y': 'redoWorld',

  // 10 numbers, 26 letters, shift+, alt+
  '1': 'togglePieceSize1',
  'shift+1': 'cyclePieceVariantBackward',
  'alt+1': undefined,
  '2': 'togglePieceSize2',
  'shift+2': undefined,
  'alt+2': undefined,
  '3': 'togglePieceSize3',
  'shift+3': undefined,
  'alt+3': undefined,
  '4': 'togglePieceSize4',
  'shift+4': undefined,
  'alt+4': undefined,
  '5': 'togglePieceSize5',
  'shift+5': undefined,
  'alt+5': undefined,
  '6': 'togglePieceSize6',
  'shift+6': undefined,
  'alt+6': undefined,
  '7': 'togglePieceSize7',
  'shift+7': undefined,
  'alt+7': undefined,
  '8': undefined,
  'shift+8': undefined,
  'alt+8': undefined,
  '9': undefined,
  'shift+9': undefined,
  'alt+9': undefined,
  '0': undefined,
  'shift+0': undefined,
  'alt+0': undefined,

  a: 'togglePenModeAsphalt',
  'shift+a': undefined,
  'alt+a': undefined,
  b: 'togglePenModeWood',
  'shift+b': undefined,
  'alt+b': undefined,
  c: 'togglePenModeConcrete',
  'shift+c': undefined,
  'alt+c': undefined,
  d: 'togglePenModeDungeon',
  'shift+d': 'togglePenModeShadow',
  'alt+d': undefined,
  e: 'cyclePrevPieceRotation',
  'shift+e': undefined,
  'alt+e': undefined,
  f: undefined,
  'shift+f': undefined,
  'alt+f': undefined,
  g: 'togglePenModeGrass',
  'shift+g': undefined,
  'alt+g': undefined,
  h: undefined,
  'shift+h': undefined,
  'alt+h': undefined,
  i: 'togglePenModeSnow',
  'shift+i': 'togglePenModeIce',
  'alt+i': undefined,
  j: undefined,
  'shift+j': undefined,
  'alt+j': undefined,
  k: undefined,
  'shift+k': undefined,
  'alt+k': undefined,
  l: 'togglePenModeLavaField',
  'shift+l': 'togglePenModeLava',
  'alt+l': undefined,
  m: 'togglePenModeObjectiveMarker',
  'shift+m': 'togglePenModeObjectiveMarkerWhite',
  'alt+m': undefined,
  n: 'togglePenModeAncientTerrain',
  'shift+n': undefined,
  'alt+n': undefined,
  o: 'togglePenModeRoad',
  'shift+o': 'togglePenModeWallWalk',
  'alt+o': undefined,
  p: 'togglePenModeSwamp',
  'shift+p': 'togglePenModeSwampWater',
  'alt+p': undefined,
  q: 'cycleNextPieceRotation',
  'shift+q': undefined,
  'alt+q': undefined,
  r: 'togglePenModeRock',
  'shift+r': undefined,
  'alt+r': undefined,
  s: 'togglePenModeSand',
  'shift+s': undefined,
  'alt+s': 'saveSelection',
  t: 'togglePenModeToxic',
  'shift+t': 'togglePenModeToxicWater',
  'alt+t': undefined,
  u: undefined,
  'shift+u': undefined,
  'alt+u': undefined,
  v: undefined,
  'shift+v': undefined,
  'alt+v': undefined,
  w: 'togglePenModeWater',
  'shift+w': 'togglePenModeWellspringWater',
  'alt+w': undefined,
  x: 'togglePenModeLast',
  'shift+x': undefined,
  'alt+x': undefined,
  y: 'togglePenModePowerGlyph',
  'shift+y': 'togglePenModeTreasureGlyph',
  'alt+y': undefined,
  z: 'togglePenModeSelect',
  'shift+z': 'togglePenModePick',
  'alt+z': undefined,
} as const

export type HotkeyAction = Exclude<
  (typeof defaultHotkeyConfig)[keyof typeof defaultHotkeyConfig],
  undefined
>

export type HotkeyOverrides = Partial<Record<HotkeyAction, string[]>>

export const HOTKEY_ACTIONS: {
  id: HotkeyAction
  label: string
  group: string
}[] = [
  { id: 'zoomToMap', label: 'Zoom to map', group: 'Camera' },
  {
    id: 'handleToggleIsCameraDisabled',
    label: 'Lock or unlock camera',
    group: 'Camera',
  },
  {
    id: 'handleToggleIsOrthoCam',
    label: 'Switch camera perspective',
    group: 'Camera',
  },
  { id: 'cameraPanUp', label: 'Move camera up', group: 'Camera' },
  { id: 'cameraPanDown', label: 'Move camera down', group: 'Camera' },
  { id: 'cameraPanLeft', label: 'Move camera left', group: 'Camera' },
  { id: 'cameraPanRight', label: 'Move camera right', group: 'Camera' },
  { id: 'cameraRotateUp', label: 'Rotate camera up', group: 'Camera' },
  { id: 'cameraRotateDown', label: 'Rotate camera down', group: 'Camera' },
  { id: 'cameraRotateLeft', label: 'Rotate camera left', group: 'Camera' },
  { id: 'cameraRotateRight', label: 'Rotate camera right', group: 'Camera' },
  {
    id: 'cameraRotateLeftFar',
    label: 'Rotate camera left 15°',
    group: 'Camera',
  },
  {
    id: 'cameraRotateRightFar',
    label: 'Rotate camera right 15°',
    group: 'Camera',
  },
  { id: 'cameraZoomIn', label: 'Zoom camera in', group: 'Camera' },
  { id: 'cameraZoomOut', label: 'Zoom camera out', group: 'Camera' },
  {
    id: 'incrementViewingLevel',
    label: 'Increase viewing level',
    group: 'Viewing level',
  },
  {
    id: 'decrementViewingLevel',
    label: 'Decrease viewing level',
    group: 'Viewing level',
  },
  {
    id: 'cycleNextPieceRotation',
    label: 'Rotate clockwise',
    group: 'Rotation',
  },
  {
    id: 'cyclePrevPieceRotation',
    label: 'Rotate counterclockwise',
    group: 'Rotation',
  },
  {
    id: 'cyclePieceVariantBackward',
    label: 'Previous piece size',
    group: 'Sizes',
  },
  ...[1, 2, 3, 4, 5, 6, 7].map((size) => ({
    id: `togglePieceSize${size}` as HotkeyAction,
    label: `Select piece size ${size}`,
    group: 'Sizes',
  })),
  { id: 'saveSelection', label: 'Save selection', group: 'Selection' },
  {
    id: 'deleteSelectedPiece',
    label: 'Delete selected pieces',
    group: 'Selection',
  },
  { id: 'undoWorld', label: 'Undo', group: 'Undo and redo' },
  { id: 'redoWorld', label: 'Redo', group: 'Undo and redo' },
  { id: 'togglePenModeSelect', label: 'Select mode', group: 'Pens' },
  { id: 'togglePenModePick', label: 'Pick mode', group: 'Pens' },
  { id: 'togglePenModeLast', label: 'Previous pen mode', group: 'Pens' },
  { id: 'togglePenModeGrass', label: 'Grass', group: 'Pens' },
  { id: 'togglePenModeRock', label: 'Rock', group: 'Pens' },
  { id: 'togglePenModeSand', label: 'Sand', group: 'Pens' },
  { id: 'togglePenModeRoad', label: 'Road', group: 'Pens' },
  { id: 'togglePenModeWallWalk', label: 'Wall walk', group: 'Pens' },
  { id: 'togglePenModeSnow', label: 'Snow', group: 'Pens' },
  { id: 'togglePenModeIce', label: 'Ice', group: 'Pens' },
  { id: 'togglePenModeLavaField', label: 'Lava field', group: 'Pens' },
  { id: 'togglePenModeLava', label: 'Lava', group: 'Pens' },
  { id: 'togglePenModeSwamp', label: 'Swamp', group: 'Pens' },
  { id: 'togglePenModeSwampWater', label: 'Swamp water', group: 'Pens' },
  { id: 'togglePenModeAsphalt', label: 'Asphalt', group: 'Pens' },
  { id: 'togglePenModeConcrete', label: 'Concrete', group: 'Pens' },
  { id: 'togglePenModeDungeon', label: 'Dungeon', group: 'Pens' },
  { id: 'togglePenModeToxic', label: 'Toxic', group: 'Pens' },
  { id: 'togglePenModeToxicWater', label: 'Toxic water', group: 'Pens' },
  { id: 'togglePenModeShadow', label: 'Shadow', group: 'Pens' },
  {
    id: 'togglePenModeAncientTerrain',
    label: 'Ancient terrain',
    group: 'Pens',
  },
  { id: 'togglePenModeWood', label: 'Wood', group: 'Pens' },
  {
    id: 'togglePenModeWellspringWater',
    label: 'Wellspring water',
    group: 'Pens',
  },
  { id: 'togglePenModeWater', label: 'Water', group: 'Pens' },
  { id: 'togglePenModePowerGlyph', label: 'Power glyph', group: 'Pens' },
  { id: 'togglePenModeTreasureGlyph', label: 'Treasure glyph', group: 'Pens' },
  {
    id: 'togglePenModeObjectiveMarker',
    label: 'Objective marker',
    group: 'Pens',
  },
  {
    id: 'togglePenModeObjectiveMarkerWhite',
    label: 'White objective marker',
    group: 'Pens',
  },
]

const actionIds = new Set(HOTKEY_ACTIONS.map(({ id }) => id))
const keyNames = new Set([
  'backspace',
  'delete',
  'end',
  'enter',
  'escape',
  'home',
  'insert',
  'pageup',
  'pagedown',
  'space',
  'tab',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'up',
  'down',
  'left',
  'right',
])
const modifierOrder = ['mod', 'alt', 'shift']

export function normalizeHotkey(value: string): string | null {
  if (value.length > 40) return null
  const parts = value
    .toLowerCase()
    .trim()
    .split('+')
    .map((part) => (part === 'ctrl' ? 'mod' : part))
  if (parts.some((part) => !part)) return null
  const rawKey = parts.pop()
  const key =
    rawKey === 'arrowup'
      ? 'up'
      : rawKey === 'arrowdown'
        ? 'down'
        : rawKey === 'arrowleft'
          ? 'left'
          : rawKey === 'arrowright'
            ? 'right'
            : rawKey
  if (
    !key ||
    !(
      /^[a-z0-9]$/.test(key) ||
      /^[^\s+]$/.test(key) ||
      /^f(?:[1-9]|1[0-2])$/.test(key) ||
      keyNames.has(key)
    )
  ) {
    return null
  }
  const modifiers = new Set(parts)
  if (
    modifiers.size !== parts.length ||
    parts.some((part) => !modifierOrder.includes(part))
  ) {
    return null
  }
  return [...modifierOrder.filter((part) => modifiers.has(part)), key].join('+')
}

export function hotkeyFromKeyboardEvent(
  event: Pick<
    KeyboardEvent,
    'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'
  >,
): string | null {
  const key =
    event.key.toLowerCase() === ' '
      ? 'space'
      : event.key.toLowerCase().replace(/^arrow/, '')
  if (key === 'control' || key === 'meta' || key === 'alt' || key === 'shift') {
    return null
  }
  return normalizeHotkey(
    [
      event.ctrlKey || event.metaKey ? 'mod' : '',
      event.altKey ? 'alt' : '',
      event.shiftKey ? 'shift' : '',
      key,
    ]
      .filter(Boolean)
      .join('+'),
  )
}

export function getDefaultActionHotkeys(): Record<HotkeyAction, string[]> {
  const result = Object.fromEntries(
    HOTKEY_ACTIONS.map(({ id }) => [id, []]),
  ) as unknown as Record<HotkeyAction, string[]>
  for (const [key, action] of Object.entries(defaultHotkeyConfig)) {
    if (action) result[action as HotkeyAction].push(key)
  }
  return result
}

function overridesFromBindings(
  bindings: Record<HotkeyAction, string[]>,
): HotkeyOverrides {
  const defaults = getDefaultActionHotkeys()
  return Object.fromEntries(
    HOTKEY_ACTIONS.flatMap(({ id }) =>
      bindings[id].length === defaults[id].length &&
      bindings[id].every((key, index) => key === defaults[id][index])
        ? []
        : [[id, bindings[id]]],
    ),
  ) as HotkeyOverrides
}

function bindingsFromOverrides(
  overrides: HotkeyOverrides,
): Record<HotkeyAction, string[]> {
  const bindings = getDefaultActionHotkeys()
  for (const { id } of HOTKEY_ACTIONS) {
    if (Object.prototype.hasOwnProperty.call(overrides, id)) {
      bindings[id] = [...(overrides[id] ?? [])]
    }
  }
  return bindings
}

export function sanitizeHotkeyOverrides(value: unknown): {
  overrides: HotkeyOverrides
  issues: string[]
} {
  const issues: string[] = []
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { overrides: {}, issues: ['Hotkey overrides must be an object'] }
  }
  const raw = value as Record<string, unknown>
  const defaults = getDefaultActionHotkeys()
  const bindings = getDefaultActionHotkeys()
  const requestedBindings = new Map<HotkeyAction, string[]>()
  const explicitlyOverridden = new Set<HotkeyAction>()
  for (const [action, assignedKeys] of Object.entries(raw)) {
    if (!actionIds.has(action as HotkeyAction)) {
      issues.push(`Unknown action: ${action}`)
      continue
    }
    if (!Array.isArray(assignedKeys) || assignedKeys.length > 5) {
      issues.push(`Malformed keys for ${action}`)
      continue
    }
    const keys: string[] = []
    for (const assignedKey of assignedKeys) {
      const key =
        typeof assignedKey === 'string' ? normalizeHotkey(assignedKey) : null
      if (!key) {
        issues.push(`Malformed key for ${action}`)
      } else if (keys.includes(key)) {
        issues.push(`Duplicate key for ${action}: ${key}`)
      } else {
        keys.push(key)
      }
    }
    if (keys.length || assignedKeys.length === 0) {
      requestedBindings.set(action as HotkeyAction, keys)
      explicitlyOverridden.add(action as HotkeyAction)
    }
  }

  const seen = new Map<string, HotkeyAction>()
  for (const { id } of HOTKEY_ACTIONS) {
    if (!explicitlyOverridden.has(id)) {
      for (const key of defaults[id]) seen.set(key, id)
    } else {
      bindings[id] = []
    }
  }
  for (const { id } of HOTKEY_ACTIONS) {
    if (!explicitlyOverridden.has(id)) continue
    const assignedKeys: string[] = []
    for (const key of requestedBindings.get(id) ?? []) {
      const owner = seen.get(key)
      if (owner) {
        issues.push(`Key ${key} is already assigned to ${owner}`)
      } else {
        seen.set(key, id)
        assignedKeys.push(key)
      }
    }
    if (
      assignedKeys.length === 0 &&
      (requestedBindings.get(id)?.length ?? 0) > 0
    ) {
      for (const key of defaults[id]) {
        if (!seen.has(key)) {
          seen.set(key, id)
          assignedKeys.push(key)
        }
      }
    }
    bindings[id] = assignedKeys
  }
  return { overrides: overridesFromBindings(bindings), issues }
}

export function getActionHotkeys(
  overrides: HotkeyOverrides,
): Record<HotkeyAction, string[]> {
  return bindingsFromOverrides(overrides)
}

export function buildHotkeyConfig(
  overrides: HotkeyOverrides,
): Record<string, HotkeyAction | undefined> {
  const config: Record<string, HotkeyAction | undefined> = {
    ...defaultHotkeyConfig,
  }
  for (const key of Object.keys(config)) {
    if (config[key]) config[key] = undefined
  }
  for (const [action, keys] of Object.entries(
    bindingsFromOverrides(overrides),
  )) {
    for (const key of keys) config[key] = action as HotkeyAction
  }
  return config
}

export function updateActionHotkeys(
  overrides: HotkeyOverrides,
  action: HotkeyAction,
  keys: string[],
): HotkeyOverrides {
  const bindings = bindingsFromOverrides(overrides)
  bindings[action] = keys
  return overridesFromBindings(bindings)
}

export function assignActionHotkey(
  overrides: HotkeyOverrides,
  action: HotkeyAction,
  key: string,
): { overrides: HotkeyOverrides; conflict: HotkeyAction | null } {
  const bindings = bindingsFromOverrides(overrides)
  const conflict =
    HOTKEY_ACTIONS.find(({ id }) => id !== action && bindings[id].includes(key))
      ?.id ?? null
  if (conflict) return { overrides, conflict }
  bindings[action] = [key]
  return { overrides: overridesFromBindings(bindings), conflict: null }
}

export function swapActionHotkeys(
  overrides: HotkeyOverrides,
  action: HotkeyAction,
  conflict: HotkeyAction,
  key: string,
): HotkeyOverrides {
  const bindings = bindingsFromOverrides(overrides)
  const previousKeys = bindings[action].filter((assigned) => assigned !== key)
  bindings[conflict] = [
    ...bindings[conflict].filter((assigned) => assigned !== key),
    ...previousKeys,
  ]
  bindings[action] = [key]
  return overridesFromBindings(bindings)
}

export function resetActionHotkeys(
  overrides: HotkeyOverrides,
  action: HotkeyAction,
  swapConflicts = false,
): {
  overrides: HotkeyOverrides
  conflicts: { action: HotkeyAction; key: string }[]
} {
  const bindings = bindingsFromOverrides(overrides)
  const defaults = getDefaultActionHotkeys()
  const conflicts = defaults[action].flatMap((key) => {
    const owner = HOTKEY_ACTIONS.find(
      ({ id }) => id !== action && bindings[id].includes(key),
    )?.id
    return owner ? [{ action: owner, key }] : []
  })
  if (conflicts.length && !swapConflicts) {
    return { overrides, conflicts }
  }

  const previousKeys = bindings[action].filter(
    (key) => !defaults[action].includes(key),
  )
  const usedPreviousKeys = new Set<string>()
  for (const conflict of conflicts) {
    const keys = bindings[conflict.action].filter((key) => key !== conflict.key)
    const replacement = previousKeys.find(
      (key) => !usedPreviousKeys.has(key) && !keys.includes(key),
    )
    if (replacement) {
      keys.push(replacement)
      usedPreviousKeys.add(replacement)
    }
    bindings[conflict.action] = keys
  }
  bindings[action] = defaults[action]
  return { overrides: overridesFromBindings(bindings), conflicts }
}

export type HotkeyFile = {
  version: 1
  overrides: HotkeyOverrides
}

export function exportHotkeyFile(overrides: HotkeyOverrides): HotkeyFile {
  return {
    version: 1,
    overrides: sanitizeHotkeyOverrides(overrides).overrides,
  }
}

export function parseHotkeyFile(text: string): {
  overrides: HotkeyOverrides | null
  issues: string[]
} {
  if (text.length > 65536) {
    return { overrides: null, issues: ['Hotkey file is too large'] }
  }
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { overrides: null, issues: ['Invalid JSON hotkey file'] }
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('version' in value) ||
    value.version !== 1 ||
    !('overrides' in value) ||
    typeof value.overrides !== 'object' ||
    value.overrides === null ||
    Array.isArray(value.overrides)
  ) {
    return { overrides: null, issues: ['Unsupported or malformed hotkey file'] }
  }
  return sanitizeHotkeyOverrides(value.overrides)
}
