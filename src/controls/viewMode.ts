export type ViewMode = '3d' | '2d' | 'pdf'

export function getViewMode(is2DOpen: boolean, isPdfOpen: boolean): ViewMode {
  if (isPdfOpen) return 'pdf'
  if (is2DOpen) return '2d'
  return '3d'
}
