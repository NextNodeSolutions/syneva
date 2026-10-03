// The hub's desk JSON as the CLI reads it: the summaries `syneva desks` prints and the
// fields the agent commands act on, shaped field by field - never cast.
import type { DeskSummary } from '@syneva/contracts/hub'

export function readDesks(body: unknown): DeskSummary[] {
	if (typeof body !== 'object' || body === null || !('desks' in body))
		return []
	const { desks } = body
	if (!Array.isArray(desks)) return []
	return desks.flatMap(entry => {
		const desk = readDesk(entry)
		return desk ? [desk] : []
	})
}

// The fields the CLI acts on, shaped from the hub's JSON; the rest of the summary rides along
// untouched for `syneva desks` output.
export function readDesk(entry: unknown): DeskSummary | null {
	if (typeof entry !== 'object' || entry === null) return null
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(entry),
	)
	if (
		typeof record.id !== 'string' ||
		typeof record.session !== 'string' ||
		typeof record.path !== 'string' ||
		typeof record.root !== 'string'
	)
		return null
	if (
		record.mode !== 'repo' &&
		record.mode !== 'file' &&
		record.mode !== 'pr'
	)
		return null
	return {
		...summaryCounts(record),
		id: record.id,
		root: record.root,
		project: typeof record.project === 'string' ? record.project : '',
		session: record.session,
		mode: record.mode,
		target: typeof record.target === 'string' ? record.target : undefined,
		staged: record.staged === true,
		baseDiffHash:
			typeof record.baseDiffHash === 'string' ? record.baseDiffHash : '',
		empty: record.empty === true,
		agentListening: record.agentListening === true,
		agentActivity: null,
		openedAt: typeof record.openedAt === 'string' ? record.openedAt : '',
		lastActivityAt:
			typeof record.lastActivityAt === 'string'
				? record.lastActivityAt
				: '',
		path: record.path,
	}
}

type SummaryCounts = Pick<
	DeskSummary,
	| 'files'
	| 'approvedFiles'
	| 'totalChanges'
	| 'decidedChanges'
	| 'openQuestions'
	| 'openRequests'
	| 'queuedQuestions'
	| 'queuedReviews'
>

function summaryCounts(record: Record<string, unknown>): SummaryCounts {
	const count = (key: keyof SummaryCounts): number =>
		typeof record[key] === 'number' ? record[key] : 0
	return {
		files: count('files'),
		approvedFiles: count('approvedFiles'),
		totalChanges: count('totalChanges'),
		decidedChanges: count('decidedChanges'),
		openQuestions: count('openQuestions'),
		openRequests: count('openRequests'),
		queuedQuestions: count('queuedQuestions'),
		queuedReviews: count('queuedReviews'),
	}
}

// The `error`/`fix` pair of a hub failure body, for the CLI's stderr.
export function failureText(body: unknown, fallback: string): string {
	if (typeof body !== 'object' || body === null) return fallback
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(body),
	)
	const error = typeof record.error === 'string' ? record.error : fallback
	const fix = typeof record.fix === 'string' ? ` ${record.fix}` : ''
	return `${error}${fix}`
}
