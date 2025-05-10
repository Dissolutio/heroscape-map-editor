import { useStoreWithEqualityFn } from 'zustand/traditional'
import useBoundStore from '../store/store'

/* Did this in JavaScript because the Typescript version detailed here:
https://github.com/charkour/zundo?tab=readme-ov-file#for-reactive-changes-to-member-properties-of-the-temporal-object-optionally-convert-to-a-react-store-hook
did not work, it errored
 */

export default function useTemporalStore(selector, equality) {
  return useStoreWithEqualityFn(useBoundStore.temporal, selector, equality)
}
