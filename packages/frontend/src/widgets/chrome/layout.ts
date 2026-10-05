import type { ReviewState } from '@entities/review/model'

// A desk has no file tree when there is nothing to choose between: a single
// changed file, or a single-file desk (`syneva open file`). The workspace drops
// the tree column and the top bar takes over the tree's Settings entry.
export function isTreeless({ state }: { state: ReviewState | null }): boolean {
	return (state?.files.length ?? 0) <= 1 || state?.mode === 'file'
}
