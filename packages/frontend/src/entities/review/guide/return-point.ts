// Where the reviewer was before following a reference: the domain, the file (or preview) and the cursor, plus the two scroll positions, so Back lands exactly there.
// The diff file is kept by path, not index: a reload can add, drop or reorder files under a saved point.
export type GuideReturnPoint = {
	domainId: string | null
	// Whether the code was open: a reference followed from the domain's reading returns to the reading, one followed beside the code to that code.
	codeOpen: boolean
	filePath: string | null
	previewPath: string | null
	// The preview's revision travels with its path: a staged or pr desk's cited side differs from the working tree.
	previewSide: 'additions' | 'deletions' | undefined
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
