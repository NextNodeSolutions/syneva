export const GUIDE_SECTIONS = [
	{
		label: '01 · CONTRACTS',
		kind: 'guided',
		y: 84,
		rows: [['contracts/review.ts', 92]],
	},
	{
		label: '02 · BEHAVIOR',
		kind: 'guided',
		y: 146,
		rows: [
			['auth/session.ts', 154],
			['api/middleware.ts', 190],
		],
	},
	{
		label: '03 · INTERFACE',
		kind: 'guided',
		y: 246,
		rows: [['pages/desk.tsx', 254]],
	},
	{
		label: 'OTHER · LISTED ANYWAY',
		kind: 'other',
		y: 308,
		rows: [
			['README.md', 316],
			['lib/hash.ts', 352],
		],
	},
] as const

export const GUIDE_FILE_COUNT = GUIDE_SECTIONS.reduce(
	(count, { rows }) => count + rows.length,
	0,
)
export const UNMENTIONED_FILE_COUNT = GUIDE_SECTIONS.reduce(
	(count, { kind, rows }) => (kind === 'other' ? count + rows.length : count),
	0,
)
