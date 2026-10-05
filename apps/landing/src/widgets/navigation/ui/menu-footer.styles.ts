import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { menuFooterMarker } from './markers.stylex'

const footerHover = (): string =>
	stylex.when.ancestor(':hover', menuFooterMarker)
const footerCurrent = (): string =>
	stylex.when.ancestor('[aria-current="page"]', menuFooterMarker)

// Each menu's footer: what the section is for, and its overview link.
export const menuFooter = stylex.create({
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '16px',
		minHeight: '49px',
		padding: '13px 20px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
		backgroundColor: color['--paper'],
		fontSize: '11px',
		lineHeight: 1.5,
		outlineOffset: { default: null, ':focus-visible': '-5px' },
	},
	pitch: { color: color['--muted'] },
	productPitch: { display: { default: null, [media.navToggle]: 'none' } },
	overview: {
		whiteSpace: 'nowrap',
		color: {
			default: null,
			[footerCurrent()]: color['--accent'],
			[media.finePointer]: {
				default: null,
				[footerHover()]: color['--accent'],
			},
		},
	},
	// Keep the overview link on the right, as in the other menus.
	productOverview: {
		marginLeft: { default: null, [media.navToggle]: 'auto' },
	},
})
