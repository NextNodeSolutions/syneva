import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

// The 404: the words and the way back beside the page drawn as a diff.
export const lost = stylex.create({
	root: {
		padding: `96px ${layout['--gutter']} 120px`,
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr 1fr',
			[media.narrow]: 'minmax(0, 1fr)',
		},
		gap: '64px',
		alignItems: 'center',
	},
	title: { fontSize: 'clamp(44px, 6vw, 80px)' },
	text: { marginTop: '22px', fontSize: '18px', maxWidth: '420px' },
	actions: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: { default: '16px 24px', [media.phone]: '16px' },
		marginTop: '30px',
	},
	art: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--field'],
	},
})
