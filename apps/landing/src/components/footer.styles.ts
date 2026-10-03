import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

const rule = {
	borderTopWidth: '1px',
	borderTopStyle: 'solid',
	borderTopColor: color['--line'],
}

// Footer: pitch and primary action, a sitemap generated from the site map,
// and the wordmark sized from its container so it spans the frame.
export const footer = stylex.create({
	root: rule,
	top: {
		display: 'grid',
		gridTemplateColumns: { default: '1fr 2fr', [media.tablet]: '1fr' },
		gap: { default: '64px', [media.tablet]: '44px' },
		paddingTop: { default: '64px', [media.phone]: '48px' },
		paddingBottom: { default: '56px', [media.phone]: '40px' },
		paddingInline: 'var(--gutter)',
	},
	pitch: { margin: '18px 0 26px', fontSize: '15px', maxWidth: '320px' },
	map: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, 1fr)',
			[media.stacked]: 'repeat(2, 1fr)',
		},
		columnGap: '28px',
		rowGap: { default: '28px', [media.stacked]: '36px' },
	},
	head: {
		display: 'block',
		font: `11px ${font['--mono']}`,
		letterSpacing: '.04em',
		textTransform: 'uppercase',
		color: { default: color['--muted'], ':hover': color['--accent'] },
		marginBottom: '16px',
	},
	list: {
		listStyle: 'none',
		margin: 0,
		padding: 0,
		display: 'grid',
		gap: '10px',
	},
	link: {
		fontSize: '14px',
		transition: `color .15s ${ease['--ease-out']}`,
		color: { default: null, ':hover': color['--accent'] },
	},
	word: {
		containerType: 'inline-size',
		overflow: 'hidden',
		...rule,
		paddingInline: 'calc(var(--gutter) - 8px)',
	},
	// The wordmark spans the frame: sized from the container, trimmed to its
	// x-height.
	wordmark: {
		display: 'block',
		fontWeight: 500,
		fontSize: '35.4cqi',
		letterSpacing: '-.075em',
		lineHeight: 0.72,
		margin: '-.12em 0 0 -.04em',
		paddingBottom: '.2em',
		color: '#dfe3d6',
		whiteSpace: 'nowrap',
		userSelect: 'none',
	},
	bottom: {
		padding: '20px var(--gutter)',
		...rule,
		display: 'flex',
		flexDirection: { default: null, [media.phone]: 'column' },
		justifyContent: 'space-between',
		gap: { default: '20px', [media.phone]: '6px' },
		font: `11px ${font['--mono']}`,
		color: color['--muted'],
	},
})
