import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

const SECTION_SCALE = 'clamp(32px, 3.7vw, 46px)'

// The heading of a section that shares its row with a drawing or the install
// commands (chapters, FAQ topics, the start band), smaller than the scale
// global.css gives every h2. Subpages set it at 32px on phones; the variant
// restates the default because StyleX merges a property's whole value.
export const heading = stylex.create({
	section: { fontSize: { default: SECTION_SCALE, [media.phone]: '34px' } },
	subpage: { fontSize: { default: SECTION_SCALE, [media.phone]: '32px' } },
})
