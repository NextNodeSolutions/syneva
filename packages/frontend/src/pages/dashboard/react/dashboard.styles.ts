import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

// The site's frame: one ruled column of paper, 1280px at most, centred; every band inside
// runs edge to edge in it, parted by hairlines.
export const dashboard = stylex.create({
	frame: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100vh',
		maxWidth: '1280px',
		marginInline: 'auto',
		borderInlineWidth: '1px',
		borderInlineStyle: 'solid',
		borderInlineColor: color['--line'],
		backgroundColor: color['--paper'],
	},
	main: {
		flex: '1 0 auto',
		paddingInline: layout['--gutter'],
		paddingBottom: { default: '72px', [media.phone]: '48px' },
		// It takes focus only from the skip link: the ring would frame the whole list.
		outlineStyle: 'none',
	},
	// An empty hub's wash band sits on the footer's rule, as the site's closing band runs into
	// its footer: a column, so the band's top margin can take the height left over, and no
	// paper strip under it.
	mainEmpty: {
		display: 'flex',
		flexDirection: 'column',
		paddingBottom: 0,
	},
})
