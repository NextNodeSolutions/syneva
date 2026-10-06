import { queries } from '@syneva/design-system/media.stylex'

// Read live: every runtime piece listens to this same query, so switching to reduce stops motion everywhere at once.
export const reducedMotion = matchMedia(queries.motionReduced)
