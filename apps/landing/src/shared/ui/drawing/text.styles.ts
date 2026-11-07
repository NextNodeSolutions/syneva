import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { drawingMarker } from './drawing.stylex'

// Text sizes are SVG user units (figures render between ~0.75x phones and 1.25x desktop); reframed drawings and small state diagrams grow their faintest words instead of shrinking into microtext.
const compact = (): string =>
	stylex.when.ancestor(':not(.is-dense)[data-compact]', drawingMarker)
const dense = (): string =>
	stylex.when.ancestor(':is(.is-dense)', drawingMarker)

export const text = stylex.create({
	label: {
		font: `11px ${font['--mono']}`,
		letterSpacing: '.04em',
		fill: color['--ink'],
		fontSize: {
			default: null,
			[media.phone]: { default: null, [dense()]: '14px' },
		},
	},
	tiny: {
		font: `9.5px ${font['--mono']}`,
		letterSpacing: {
			default: '.06em',
			[media.phone]: {
				default: '.06em',
				[compact()]: '.03em',
				[dense()]: 0,
			},
		},
		fill: color['--muted'],
		fontSize: {
			default: null,
			[media.phone]: {
				default: null,
				[compact()]: '10.5px',
				[dense()]: '12px',
			},
		},
	},
	copy: {
		font: `500 13.5px ${font['--sans']}`,
		letterSpacing: '-.01em',
		fill: color['--ink'],
	},
	small: {
		font: `12px ${font['--sans']}`,
		fill: color['--muted'],
		fontSize: {
			default: null,
			[media.phone]: { default: null, [dense()]: '14.5px' },
		},
	},
	code: { font: `11.5px ${font['--mono']}`, fill: color['--ink'] },
	file: { font: `10.5px ${font['--mono']}`, fill: color['--ink'] },
	lineNumber: {
		font: `10.5px ${font['--mono']}`,
		fill: color['--line-strong'],
	},
	head: {
		font: `500 17px ${font['--sans']}`,
		letterSpacing: '-.02em',
		fill: color['--ink'],
	},
	// Applied after their base.
	strong: { fontWeight: 600 },
	green: { fill: color['--green'] },
	accent: { fill: color['--accent'] },
	white: { fill: color['--white'] },
	muted: { fill: color['--muted'] },
})
