// Where the reviewer was before following a reference: the domain, the file (or preview) and the cursor, plus the two scroll positions, so Back lands exactly there.
export type GuideReturnPoint = {
	domainId: string | null
	fileIndex: number
	previewPath: string | null
	cursor: { side: 'additions' | 'deletions'; lineNumber: number } | null
	paneScroll: number
	diffScroll: number
}

export const RETURN_STACK_DEPTH = 8

export function pushReturnPoint(
	stack: readonly GuideReturnPoint[],
	point: GuideReturnPoint,
): GuideReturnPoint[] {
	return [...stack, point].slice(-RETURN_STACK_DEPTH)
}
