/* eslint-disable nextnode/no-barrel-file -- package public entry: the one import of the animation engine */
// The one Motion seam: motion/mini is WAAPI's animate() (a 'motion' import would silently swap in the full engine); new Motion APIs export here first.
// Callers keep their options, so upgrades re-review only here; the landing imports motion only through this module (oxlint).
import type { AnimationOptions } from 'motion'

export { animate } from 'motion/mini'
export { cancelFrame, frame, inView } from 'motion'
export type { FrameData } from 'motion'

// Motion forwards pseudoElement to the Web Animations API but its options type does not declare it: patched here once.
export type AnimateOptions = AnimationOptions & { pseudoElement?: string }

// Keyframes the site writes: each animated property with its values from the first frame to the last.
export type Keyframes = Record<string, (string | number)[]>
