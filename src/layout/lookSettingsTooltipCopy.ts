export const LOOK_SETTINGS_TOOLTIP_COPY = {
  close: 'Closes this panel. Your current look settings stay in effect.',
  toneMapping:
    'Changes how bright and dark colors appear on screen. Try the options; Neutral is a good place to start.',
  exposure: 'Makes the whole scene lighter or darker.',
  ambientIntensity:
    'Sets the soft light across the scene. Higher values brighten areas that direct lights do not reach.',
  hemisphereIntensity:
    'Adds sky-colored light from above and ground-colored light from below.',
  pointLightIntensity:
    'Sets the strength of the four movable lights. It only has an effect when lights and shadows are on.',
  lightColor:
    'Changes the color of the four movable lights. It only shows when lights and shadows are on.',
  shine:
    'Changes how glossy standard 3D surfaces look. Lower is more matte; higher is smoother and glossier.',
  backgroundColor:
    'Changes the color behind the map, in the empty parts of the scene.',
  tableColor: 'Changes the color of the table surface under the map.',
  transparentBackground:
    'Takes the picture with no background so you can drop the map onto your own artwork.',
  fov: 'Controls how wide the perspective camera sees. Low is more zoomed-in and flatter, like a telephoto lens; high is wide-angle and more dramatic.',
  reset: 'Returns all controls in this panel to their default values.',
  copy: 'Copies all current 3D look values as JSON, including field of view and transparent background.',
} as const

export const LOOK_SETTINGS_CONTROL_IDS = [
  'close',
  'toneMapping',
  'exposure',
  'ambientIntensity',
  'hemisphereIntensity',
  'pointLightIntensity',
  'lightColor',
  'shine',
  'backgroundColor',
  'tableColor',
  'transparentBackground',
  'fov',
  'reset',
  'copy',
] as const satisfies readonly (keyof typeof LOOK_SETTINGS_TOOLTIP_COPY)[]

export type LookSettingsTooltipId = (typeof LOOK_SETTINGS_CONTROL_IDS)[number]
