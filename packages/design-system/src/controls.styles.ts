import * as stylex from '@stylexjs/stylex'

import { color, font } from './tokens.stylex'

export const caption = stylex.create({
	base: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		fontWeight: 400,
		letterSpacing: '.02em',
		color: color['--muted'],
	},
	upper: { textTransform: 'uppercase', letterSpacing: '.08em' },
})

// Tone meanings: petrol = the agent's work and the reviewer's questions, green = a verdict, amber = a requested change, red = what goes.
export const tag = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		paddingBlock: '2px',
		paddingInline: '6px',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		fontWeight: 500,
		fontStyle: 'normal',
		lineHeight: 1.5,
		letterSpacing: '.04em',
		whiteSpace: 'nowrap',
	},
	accent: { color: color['--accent'], backgroundColor: color['--wash'] },
})

// Tone paints currentColor, so tone keys recolour it.
export const dot = stylex.create({
	base: {
		display: 'inline-block',
		flexShrink: 0,
		width: '7px',
		height: '7px',
		color: color['--line-strong'],
		backgroundColor: 'currentColor',
	},
	petrol: { color: color['--accent'] },
	green: { color: color['--green'] },
	red: { color: color['--red'] },
})
