import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The hub's label over what it names: a sidebar group, a station, a board column, a tile, a
// panel's section, the journal. Mono in the uppercase register (caption.upper), a half step
// under a caption, so it reads as the name of what follows, never as its content.
export const sectionLabel = stylex.create({
	base: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
})
