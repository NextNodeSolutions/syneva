import type { ReviewState } from './model'

// The pr title is the ref, truncated so a long branch name can't dominate the tab strip.
const REF_TITLE_MAX = 32

// What the desk is named after - repo mode: the repo folder; file mode: the file name;
// pr mode: the (truncated) ref. The tab title and the top bar print it, so several desks
// stay distinguishable.
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
