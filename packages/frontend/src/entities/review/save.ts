import type { ReviewerSave } from './model'

// The reviewer-owned slice posted to /save - never the whole (multi-MB) ReviewState.
// The server holds rawDiff/file contents/changes/etc. authoritatively and merges only these
// fields. It's a full picture of the reviewer-owned state (snapshot semantics), so the
// coalesced trailing save re-derives it and latest wins. Enumerating keys explicitly (rather
// than deleting server fields off a clone) guarantees the wire never carries file contents.
export function reviewerSlice(state: ReviewerSave): ReviewerSave {
	return {
		decisions: state.decisions,
		comments: state.comments,
		reviewedFiles: state.reviewedFiles,
		reviewedFileHashes: state.reviewedFileHashes,
		decisionFiles: state.decisionFiles,
	}
}
