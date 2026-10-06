import type { ReviewState } from './model'

const REF_TITLE_MAX = 32

export function deskName(review: ReviewState): string {
	if (review.mode === 'file') return lastPathSegment(review.target)
	if (review.mode === 'pr') {
		const ref = review.target ?? review.session
		return ref.length > REF_TITLE_MAX
			? `${ref.slice(0, REF_TITLE_MAX)}…`
			: ref
	}
	return lastPathSegment(review.root)
}

function lastPathSegment(path: string | undefined): string {
	return path?.replace(/\/+$/, '').split('/').pop() ?? ''
}
