export type SampleLineKind = 'added' | 'removed' | 'context'

// The diff's sign for each kind of line, as the drawings set it (a true minus, not a hyphen).
export const LINE_SIGN: Record<SampleLineKind, string> = {
	context: '',
	added: '+',
	removed: '\u2212',
}

type SampleLine = {
	readonly line: string
	readonly kind: SampleLineKind
	readonly code: string
}

// The one change every drawing of a review round opens (the hero's desk, the welcome email): its file, its lines, the question asked on them and the agent's answer.
export const SAMPLE_CHANGE = {
	path: 'auth/session.ts',
	lines: [
		{ line: '12', kind: 'context', code: 'export function handle(req) {' },
		{ line: '13', kind: 'removed', code: 'return run(req)' },
		{ line: '14', kind: 'added', code: 'await verifySession(req)' },
		{ line: '15', kind: 'added', code: 'return run(req)' },
		{ line: '16', kind: 'context', code: '}' },
	],
	thread: {
		question: 'What if the session already expired?',
		answer: 'It returns 401 before the handler runs.',
	},
} as const satisfies {
	path: string
	lines: readonly SampleLine[]
	thread: { question: string; answer: string }
}

export const countLines = (kind: SampleLineKind): number =>
	SAMPLE_CHANGE.lines.filter(line => line.kind === kind).length

// The file header's count of added and removed lines.
export const changeStat = (): string =>
	`+${countLines('added')} ${LINE_SIGN.removed}${countLines('removed')}`
