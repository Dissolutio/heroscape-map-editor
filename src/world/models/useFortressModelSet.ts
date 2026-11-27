import useBoundStore from '../../store/store'
import {
  type FortressModelSet,
  getFortressModelOverride,
  resolveFortressModelSet,
} from './fortressModels'

const currentSearch = () =>
  typeof window === 'undefined' ? '' : window.location.search

/** The saved setting, unless the page URL has `?fortress=vs|classic`. */
export function useFortressModelSet(): FortressModelSet {
  const setting = useBoundStore((s) => s.fortressModels)
  return resolveFortressModelSet(setting, currentSearch())
}

export function useFortressModelOverride(): FortressModelSet | null {
  return getFortressModelOverride(currentSearch())
}
