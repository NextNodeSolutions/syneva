// Where the reviewer was before following a reference: the domain, the file (or preview) and the cursor, plus the two scroll positions, so Back lands exactly there.
// The diff file is kept by path, not index: a reload can add, drop or reorder files under a saved point.
export type GuideReturnPoint = {
	domainId: string | null
	filePath: string | null
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
