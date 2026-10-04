import * as stylex from '@stylexjs/stylex'

// Set on <html>. The inline head script writes data-motion="pending" before
// the first paint and the runtime switches it to "ready" once it has booted.
// Every hidden pose lives under this marker and under reduced-motion
// no-preference, so a page without scripts, or with reduced motion, renders
// its finished pose.
export const motionRoot = stylex.defineMarker()
