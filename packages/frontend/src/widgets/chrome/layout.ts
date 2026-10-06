import type { ReviewState } from '@entities/review/model'

export function isTreeless({ state }: { state: ReviewState | null }): boolean {
	return (state?.files.length ?? 0) <= 1 || state?.mode === 'file'
}
