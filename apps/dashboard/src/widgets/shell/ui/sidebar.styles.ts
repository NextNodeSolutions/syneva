import { frame } from '@shared/ui/frame.stylex'
import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const sidebar = stylex.create({
	sidebar: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: 0,
		overflowY: { default: 'auto', [media.stacked]: 'visible' },
		fontSize: '13px',
		borderRightWidth: { default: '1px', [media.stacked]: 0 },
		borderRightStyle: 'solid',
		borderRightColor: color['--line'],
		borderBottomWidth: { default: 0, [media.stacked]: '1px' },
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	bar: {
		display: 'flex',
		flexShrink: 0,
		alignItems: 'center',
		height: frame.barHeight,
		paddingInline: '16px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	nav: {
		display: 'flex',
		flexDirection: { default: 'column', [media.stacked]: 'row' },
		gap: '16px',
		padding: '8px',
		overflowX: { default: 'visible', [media.stacked]: 'auto' },
	},
	label: {
		display: { default: 'block', [media.stacked]: 'none' },
		margin: 0,
		paddingInline: '12px',
		paddingBottom: '4px',
	},
})
