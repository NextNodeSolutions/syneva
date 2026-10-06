import type { Side } from './types'

export type RowTwin = { side: Side; line: number }

export type MeasuredRow = {
	side: Side
	line: number
	top: number
	alt?: RowTwin
}

export type Row = MeasuredRow & {
	el?: HTMLElement
	height: number
	change: boolean
}

function compareSide(a: Side, b: Side): number {
	if (a === b) return 0
	return a === 'additions' ? -1 : 1
}

export function mergeRows<T extends MeasuredRow>(out: T[]): T[] {
	out.sort((a, b) => a.top - b.top || compareSide(a.side, b.side))
	const seen = new Map<number, T>()
	const list: T[] = []
	for (const r of out) {
		const k = Math.round(r.top)
		const kept = seen.get(k)
		if (kept) {
			kept.alt = { side: r.side, line: r.line }
			continue
		}
		seen.set(k, r)
		list.push(r)
	}
	return list
}
