// The review round the hero instrument plays: your agent's changed files in
// reading order, with your verdict on each. The agent's column draws the
// files that carry code bars as cards, your desk opens one of them, and the
// ledger lists them all. The markup tells the timeline which file you
// rejected and in which turn each verdict lands (hero-round-part.ts).
export type LineKind = 'added' | 'removed' | 'context'
export type Bar = { readonly kind: LineKind; readonly width: number }
export type Verdict = 'yes' | 'no'

type HeroFile = {
	readonly path: string
	readonly verdict: Verdict
	readonly bars?: readonly Bar[]
}
type Card = HeroFile & { readonly bars: readonly Bar[] }

// The change your desk opens: you ask about it and accept it first.
export const DESK_FILE = {
	path: 'auth/session.ts',
	verdict: 'yes',
	bars: [
		{ kind: 'removed', width: 84 },
		{ kind: 'added', width: 120 },
		{ kind: 'added', width: 92 },
	],
} as const satisfies HeroFile

export const HERO_FILES: readonly HeroFile[] = [
	{
		path: 'contracts/review.ts',
		verdict: 'yes',
		bars: [
			{ kind: 'added', width: 96 },
			{ kind: 'added', width: 128 },
			{ kind: 'context', width: 70 },
		],
	},
	DESK_FILE,
	{ path: 'api/middleware.ts', verdict: 'yes' },
	{
		path: 'pages/desk.tsx',
		verdict: 'no',
		bars: [
			{ kind: 'context', width: 110 },
			{ kind: 'added', width: 76 },
			{ kind: 'removed', width: 120 },
		],
	},
	{ path: 'lib/hash.ts', verdict: 'yes' },
	{ path: 'README.md', verdict: 'yes' },
]

export const CARDS: readonly Card[] = HERO_FILES.flatMap(file =>
	file.bars ? [{ ...file, bars: file.bars }] : [],
)

// After the desk's file, the verdicts land in ledger order.
const DECISION_ORDER = [
	DESK_FILE,
	...HERO_FILES.filter(file => file !== DESK_FILE),
]
export const turnOf = (file: HeroFile): number => DECISION_ORDER.indexOf(file)

export const REJECTED_COUNT = HERO_FILES.filter(
	file => file.verdict === 'no',
).length
