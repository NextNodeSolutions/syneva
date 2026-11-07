import type { Churn } from '@syneva/contracts/projects'

const FILE_HEADER = 'diff --git '
const HUNK_HEADER = '@@ '
const ADDED = '+'
const REMOVED = '-'

// Only lines inside a hunk count: the `--- a/` and `+++ b/` headers above it are not changes.
export function countChurn(diff: string): Churn {
	const churn = { files: 0, additions: 0, deletions: 0 }
	let isInHunk = false
	for (const line of diff.split('\n')) {
		if (line.startsWith(FILE_HEADER)) {
			churn.files += 1
			isInHunk = false
			continue
		}
		if (line.startsWith(HUNK_HEADER)) isInHunk = true
		else if (isInHunk && line.startsWith(ADDED)) churn.additions += 1
		else if (isInHunk && line.startsWith(REMOVED)) churn.deletions += 1
	}
	return churn
}
