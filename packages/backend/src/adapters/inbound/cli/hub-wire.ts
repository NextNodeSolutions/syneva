// The hub's desk JSON as the CLI reads it, shaped field by field - never cast.
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

// The fields the CLI acts on; the rest of the summary rides along untouched for `syneva desks` output.
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
		...summaryTexts(record),
		id: record.id,
		root: record.root,
		session: record.session,
		mode: record.mode,
		target: typeof record.target === 'string' ? record.target : undefined,
		staged: record.staged === true,
		empty: record.empty === true,
		agentListening: record.agentListening === true,
		agentActivity: null,
		path: record.path,
	}
}

type SummaryTexts = Pick<
	DeskSummary,
	'project' | 'projectId' | 'baseDiffHash' | 'openedAt' | 'lastActivityAt'
>

function summaryTexts(record: Record<string, unknown>): SummaryTexts {
	const text = (key: keyof SummaryTexts): string =>
		typeof record[key] === 'string' ? record[key] : ''
	return {
		project: text('project'),
		projectId: text('projectId'),
		baseDiffHash: text('baseDiffHash'),
		openedAt: text('openedAt'),
		lastActivityAt: text('lastActivityAt'),
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

export function failureText(body: unknown, fallback: string): string {
	if (typeof body !== 'object' || body === null) return fallback
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(body),
	)
	const error = typeof record.error === 'string' ? record.error : fallback
	const fix = typeof record.fix === 'string' ? ` ${record.fix}` : ''
	// The two read as consecutive sentences: a reason that ends without punctuation (a listed field) gets its period before the fix.
	const stop = /[.!?)]$/.test(error) || !fix ? '' : '.'
	return `${error}${stop}${fix}`
}
