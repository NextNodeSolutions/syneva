import type { ReviewerSave } from './model'

// Enumerating keys explicitly (rather than deleting server fields off a clone) guarantees the wire never carries file contents.
export function reviewerSlice(state: ReviewerSave): ReviewerSave {
	return {
		decisions: state.decisions,
		comments: state.comments,
		domainComments: state.domainComments,
		reviewedFiles: state.reviewedFiles,
		reviewedFileHashes: state.reviewedFileHashes,
		decisionFiles: state.decisionFiles,
	}
}
