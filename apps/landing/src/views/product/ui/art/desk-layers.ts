// Each layer, bottom to top: what it carries, where it rests, where it
// travels in from, and its legend.
export const LAYERS = [
	{
		kind: 'diff',
		y: 388,
		from: -138,
		label: '01 · THE DIFF',
		words: 'Everything your agent changed.',
	},
	{
		kind: 'guide',
		y: 296,
		from: -46,
		label: '02 · WALKTHROUGH',
		words: 'Your agent’s reading order.',
	},
	{
		kind: 'thread',
		y: 204,
		from: 46,
		label: '03 · THREADS',
		words: 'Questions pinned to the line.',
	},
	{
		kind: 'verdict',
		y: 112,
		from: 138,
		label: '04 · VERDICTS',
		words: 'Yours. Recorded per change.',
	},
] as const

export type Layer = (typeof LAYERS)[number]
