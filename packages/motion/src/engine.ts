/* eslint-disable nextnode/no-barrel-file -- package public entry: the one import of the animation engine */
// The one module that imports the animation engine: the site and every other
// module of this package reach Motion through these exports. It picks
// motion/mini, the WAAPI-backed animate() (no JS interpolation loop, a few
// kilobytes), which an animate imported from 'motion' would silently replace
// with the full engine, and patches the options type below once. Callers
// still pass Motion's options and hold its playback controls, so an engine
// upgrade reviews them too. The landing never imports motion itself (oxlint
// enforces it); a Motion API it needs is exported from here first.
import type { AnimationOptions } from 'motion'

export { animate } from 'motion/mini'
export { cancelFrame, frame, inView } from 'motion'
export type { FrameData } from 'motion'

// animate()'s options, plus the pseudo-element target: Motion forwards
// pseudoElement to the Web Animations API (its NativeAnimation reads it),
// but the options type does not declare it.
export type AnimateOptions = AnimationOptions & { pseudoElement?: string }

// animate()'s keyframes as the site writes them: each animated property with
// its values from the first frame to the last.
export type Keyframes = Record<string, (string | number)[]>
