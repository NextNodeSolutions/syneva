import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const navList = stylex.create({
	list: {
		display: 'flex',
		flexDirection: { default: 'column', [media.stacked]: 'row' },
		gap: '2px',
		margin: 0,
		padding: 0,
		listStyle: 'none',
	},
})
