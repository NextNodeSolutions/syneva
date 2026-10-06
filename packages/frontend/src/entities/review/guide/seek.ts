// Files out of the flow (pure renames) are excluded HERE - the single choke point - so no seek ever lands on one.
export function navFileOrder(
	fileCount: number,
	guideOrder: number[] | null,
	inFlow: (i: number) => boolean,
): number[] {
	const all = Array.from({ length: fileCount }, (_, i) => i)
	if (!guideOrder) return all.filter(inFlow)
	const listed = new Set(guideOrder)
	return guideOrder.concat(all.filter(i => !listed.has(i))).filter(inFlow)
}

export function nextUnreviewed(
	order: number[],
	cur: number,
	finished: (i: number) => boolean,
): number | null {
	const n = order.length
	if (!n) return null
	const pos = order.indexOf(cur)
	for (let step = 1; step <= n; step++) {
		const i = order[(pos + step) % n]
		if (i === undefined || i === cur) continue
		if (!finished(i)) return i
	}
	return null
}

export function wrapNextTarget(
	order: number[],
	finished: (i: number) => boolean,
): number | null {
	if (!order.length) return null
	return order.find(i => !finished(i)) ?? order[0] ?? null
}

export function wrapPrevTarget(
	order: number[],
	finished: (i: number) => boolean,
): number | null {
	if (!order.length) return null
	for (let i = order.length - 1; i >= 0; i--) {
		const candidate = order[i]
		if (candidate !== undefined && !finished(candidate)) return candidate
	}
	return order[order.length - 1] ?? null
}
