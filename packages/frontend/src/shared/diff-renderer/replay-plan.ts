import type {
	DiffAcceptRejectHunkConfig,
	DiffAcceptRejectHunkType,
	FileDiffMetadata,
} from '@pierre/diffs'
import type { DecidedPosition } from '@shared/diff-renderer/linemap'

export type ReplayCall = {
	hunkIndex: number
	options: DiffAcceptRejectHunkConfig | DiffAcceptRejectHunkType
}

// One library call per decided block copies the whole diff (measured ~180 ms for 925 decisions on a 3,700-line file, making an approve-all click grow with the file).
// The library also resolves a whole hunk in one call, so grouping consecutive decisions of one hunk collapses those calls with replay-equivalent results; mixed hunks stay on the per-change path.
export function planReplayCalls(
	diff: FileDiffMetadata,
	decided: DecidedPosition[],
): ReplayCall[] {
	const calls: ReplayCall[] = []
	let index = 0
	while (index < decided.length) {
		const head = decided[index]
		if (!head) break
		const { hunkIndex } = head
		let end = index
		while (end < decided.length && decided[end]?.hunkIndex === hunkIndex)
			end++
		const group = decided.slice(index, end)
		const [first] = group
		const whole =
			!!first &&
			group.every(d => d.status === first.status) &&
			group.length === changeCount(diff, hunkIndex)
		if (whole) {
			calls.push({
				hunkIndex,
				options: first.status === 'rejected' ? 'reject' : 'accept',
			})
		} else {
			calls.push(...perChangeCalls(group))
		}
		index = end
	}
	return calls
}

function perChangeCalls(group: DecidedPosition[]): ReplayCall[] {
	return group.map(d => ({
		hunkIndex: d.hunkIndex,
		options: {
			type: d.status === 'rejected' ? 'reject' : 'accept',
			changeIndex: d.changeIndex,
		},
	}))
}

function changeCount(diff: FileDiffMetadata, hunkIndex: number): number {
	const hunk = diff.hunks.at(hunkIndex)
	if (!hunk) return 0
	return hunk.hunkContent.filter(part => part.type === 'change').length
}
