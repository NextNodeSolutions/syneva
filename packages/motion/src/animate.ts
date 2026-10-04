/* eslint-disable nextnode/no-barrel-file -- package public entry: the one seam onto the animation engine */
// The site, and every module of this package, animates through this export:
// motion/mini is the WAAPI-backed animate() (no JS interpolation loop, a few
// kilobytes), and naming it here alone keeps the engine swappable from one
// file. The landing never imports motion itself (oxlint enforces it); a Motion
// API it needs is exported from this package first.
export { animate } from 'motion/mini'
