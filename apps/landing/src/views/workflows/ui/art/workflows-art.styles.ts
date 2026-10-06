import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const workflowsArt = stylex.create({
	// The 1.4 stroke takes back WorkflowHub's 1.25x on the 24-unit icons.
	hubGlyph: {
		fill: 'none',
		stroke: color['--ink'],
		strokeWidth: 1.12,
		strokeLinejoin: 'round',
	},
	barMod: { fill: color['--signal'] },
	barAdd: { fill: color['--green'] },
	main: { fill: 'none', stroke: color['--line-strong'], strokeWidth: 2 },
	branch: { fill: 'none', stroke: color['--accent'], strokeWidth: 2 },
	commit: {
		fill: color['--white'],
		stroke: color['--line-strong'],
		strokeWidth: 1.5,
	},
	commitBase: { fill: color['--ink'], stroke: color['--ink'] },
	image: { fill: color['--field'], stroke: color['--line-strong'] },
	imageLine: {
		fill: 'none',
		stroke: color['--line-strong'],
		strokeWidth: 1.4,
	},
	sun: { fill: color['--signal'] },
})
