import { parsePatchFiles } from '@pierre/diffs'

import type { ChangeTypes, FileDiffMetadata } from '@pierre/diffs'

export type DiffFile = {
	metadata: FileDiffMetadata
	isUnavailable: boolean
	path: string
	additions: number
	deletions: number
}

export const DIFF_STYLES = ['split', 'unified'] as const
export type DiffStyle = (typeof DIFF_STYLES)[number]

// Split needs a line on both sides: an added or deleted file has one side, a pure rename has no line.
const SPLITTABLE_CHANGES: ReadonlySet<ChangeTypes> = new Set([
	'change',
	'rename-changed',
])

export function isSplittable(file: DiffFile): boolean {
	return SPLITTABLE_CHANGES.has(file.metadata.type)
}

export function readDiffFiles(
	patch: string,
	unavailableFiles: readonly string[],
): DiffFile[] {
	return parsePatchFiles(patch)
		.flatMap(({ files }) => files)
		.map(metadata => ({
			metadata,
			isUnavailable: unavailableFiles.includes(metadata.name),
			path: metadata.name,
			additions: sum(metadata.hunks.map(hunk => hunk.additionLines)),
			deletions: sum(metadata.hunks.map(hunk => hunk.deletionLines)),
		}))
}

function sum(counts: readonly number[]): number {
	return counts.reduce((total, count) => total + count, 0)
}
