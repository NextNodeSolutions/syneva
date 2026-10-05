import { queries } from '@syneva/design-system/media.stylex'

// The visitor's motion preference, read live: every runtime piece listens to
// the same query so switching to reduce stops motion everywhere at once.
export const reducedMotion = matchMedia(queries.motionReduced)
