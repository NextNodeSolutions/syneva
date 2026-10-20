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

// A plan as `syneva plans` lists it: the fields the CLI acts on are checked, the rest of the
// summary rides along untouched, and the CLI adds the plan's page.
export type ListedPlan = Record<string, unknown> & {
	id: string
	root: string
	url?: string
}

export function readPlans(body: unknown): ListedPlan[] {
	if (typeof body !== 'object' || body === null || !('plans' in body))
		return []
	const { plans } = body
	if (!Array.isArray(plans)) return []
	return plans.flatMap(entry => {
		if (typeof entry !== 'object' || entry === null) return []
		const plan: Record<string, unknown> = Object.fromEntries(
			Object.entries(entry),
		)
		const { id, root } = plan
		if (typeof id !== 'string' || typeof root !== 'string') return []
		// Narrowed in place: the entry is copied once.
		return [Object.assign(plan, { id, root })]
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
		plan: typeof record.plan === 'string' ? record.plan : undefined,
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
