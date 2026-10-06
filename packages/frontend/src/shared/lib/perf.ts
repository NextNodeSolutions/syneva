// The load path crosses four contexts (main thread, HTTP, token workers, the @pierre renderer), so "the page loads and the colors arrive later" can only be attributed with per-stage stamps.
// A stage name is a constant so the timeline stays greppable.
const MAX_MARKS = 600
const TENTHS_PER_MS = 10

export type PerfDetail = Record<string, number | string | boolean>
export type PerfMark = { stage: string; t: number; detail?: PerfDetail }

const marks: PerfMark[] = []
const firsts = new Map<string, number>()

export function perfMark(stage: string, detail?: PerfDetail): void {
	const t = Math.round(performance.now() * TENTHS_PER_MS) / TENTHS_PER_MS
	if (!firsts.has(stage)) firsts.set(stage, t)
	if (marks.length < MAX_MARKS)
		marks.push(detail ? { stage, t, detail } : { stage, t })
}

export function perfSpan(stage: string): (detail?: PerfDetail) => void {
	const start = performance.now()
	return detail =>
		perfMark(stage, {
			ms: Math.round(performance.now() - start),
			...detail,
		})
}

export function perfFirst(stage: string): number | undefined {
	return firsts.get(stage)
}

function summary(): Record<string, number> {
	const report: Record<string, number> = {}
	for (const stage of HEADLINE_STAGES) {
		if (!firsts.has(stage)) continue
		report[stage] = Math.round(firsts.get(stage) ?? 0)
	}
	return report
}

const HEADLINE_STAGES = [
	'module',
	'contents:loaded',
	'render:painted',
	'render:colored',
	'pool:boot:start',
	'pool:boot:done',
	'pool:job:open',
	'pool:window:sent',
	'pool:window:done',
	'pool:publish',
	'pool:publish:painted',
	'pool:final',
] as const

declare global {
	interface Window {
		synevaPerf?: typeof timeline | undefined
	}
}

const timeline = {
	// Live array: the bench reads it mid-flight, so it must not be a copy taken at install time.
	marks,
	snapshot: (): { marks: PerfMark[]; summary: Record<string, number> } => ({
		marks: [...marks],
		summary: summary(),
	}),
}

if (typeof window !== 'undefined') window.synevaPerf = timeline

perfMark('module')
