/* eslint-disable nextnode/no-barrel-file -- package public entry: the one seam onto the animation engine */
// The one module that names the animation engine: the site and every other
// module of this package reach Motion through these exports, so swapping the
// engine touches this file alone. motion/mini is the WAAPI-backed animate()
// (no JS interpolation loop, a few kilobytes). The landing never imports
// motion itself (oxlint enforces it); a Motion API it needs is exported from
// here first.
import type { AnimationOptions } from 'motion'

export { animate } from 'motion/mini'
export { cancelFrame, frame, inView } from 'motion'
export type { FrameData } from 'motion'

// animate()'s options, plus the pseudo-element target: Motion forwards
// pseudoElement to the Web Animations API (its NativeAnimation reads it),
// but the options type does not declare it.
export type AnimateOptions = AnimationOptions & { pseudoElement?: string }
