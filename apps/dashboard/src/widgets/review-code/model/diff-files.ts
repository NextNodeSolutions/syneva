import { parsePatchFiles } from '@pierre/diffs'

import type { ChangeTypes, FileDiffMetadata } from '@pierre/diffs'

export type DiffFile = {
	metadata: FileDiffMetadata
	anchor: string
	additions: number
	deletions: number
}

export const DIFF_STYLES = ['unified', 'split'] as const
export type DiffStyle = (typeof DIFF_STYLES)[number]

export const CHANGE_MARKS: Readonly<Record<ChangeTypes, string>> = {
	new: 'A',
	change: 'M',
	deleted: 'D',
	'rename-pure': 'R',
	'rename-changed': 'R',
}

export function readDiffFiles(patch: string): DiffFile[] {
	return parsePatchFiles(patch)
		.flatMap(({ files }) => files)
		.map(metadata => ({
			metadata,
			anchor: `file-${metadata.name}`,
			additions: sum(metadata.hunks.map(hunk => hunk.additionLines)),
			deletions: sum(metadata.hunks.map(hunk => hunk.deletionLines)),
		}))
}

function sum(counts: readonly number[]): number {
	return counts.reduce((total, count) => total + count, 0)
}
