type LayerKind = 'diff' | 'guide' | 'thread' | 'verdict'
type LayerOf<Kind extends LayerKind> = {
	kind: Kind
	y: number
	from: number
	label: string
	words: string
}

// Each layer by what it carries: where it rests, where it travels in from,
// and its legend.
export const LAYER = {
	diff: {
		kind: 'diff',
		y: 388,
		from: -138,
		label: '01 · THE DIFF',
		words: 'Everything your agent changed.',
	},
	guide: {
		kind: 'guide',
		y: 296,
		from: -46,
		label: '02 · WALKTHROUGH',
		words: 'Your agent’s reading order.',
	},
	thread: {
		kind: 'thread',
		y: 204,
		from: 46,
		label: '03 · THREADS',
		words: 'Questions pinned to the line.',
	},
	verdict: {
		kind: 'verdict',
		y: 112,
		from: 138,
		label: '04 · VERDICTS',
		words: 'Yours. Recorded per change.',
	},
} as const satisfies { [Kind in LayerKind]: LayerOf<Kind> }

// The layers bottom to top.
export const LAYERS = [LAYER.diff, LAYER.guide, LAYER.thread, LAYER.verdict]

export type Layer = (typeof LAYERS)[number]
