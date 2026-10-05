import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// " · " in a mono line: three cells.
const SEPARATOR_WIDTH = '3ch'

// A mono run of parts set apart by " · " (a desk's meta line, the footer's state) that wraps
// only between parts, and shows a separator only between two parts on one line: never opening
// a line, never left dangling at a line's end. Each part draws the separator before it; the
// parts start one separator before the run's box, which clips that overhang, so the separator
// before whatever part opens a line - the first, or one a wrap put there - is never seen. A
// part longer than the line breaks inside itself, its lines indented past the separator. Set
// `clip` on the run's box, `parts` on the element holding the parts, `part` on each.
export const run = stylex.create({
	clip: { overflow: 'hidden' },
	parts: {
		display: 'flex',
		flexWrap: 'wrap',
		marginLeft: `calc(-1 * ${SEPARATOR_WIDTH})`,
	},
	part: {
		position: 'relative',
		minWidth: 0,
		paddingLeft: SEPARATOR_WIDTH,
		overflowWrap: 'anywhere',
		'::before': {
			content: '"·"',
			position: 'absolute',
			left: 0,
			width: SEPARATOR_WIDTH,
			textAlign: 'center',
			color: color['--muted'],
		},
	},
})
