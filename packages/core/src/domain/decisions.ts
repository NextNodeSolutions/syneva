import { changeKey } from './change-blocks.js'
import { isRequestedChange } from './comments.js'

import type { Decision, ReviewState } from './review.js'

// Decisions[] is the source of truth; reviews persisted before it existed derive decisions from any decided changes so the handoff/summary stay correct.
export function effectiveDecisions(state: ReviewState): readonly Decision[] {
	if (state.decisions) return state.decisions
	const derived: Decision[] = []
	for (const change of state.changes) {
		if (change.status === 'pending') continue
		derived.push({
			key: changeKey(change),
			status: change.status,
			reviewedHash: change.reviewedHash,
			path: change.path,
			lineNumber: change.lineNumber,
			side: change.side,
			title: change.title,
		})
	}
	return derived
}

// Guarantees approvedFiles stays disjoint from rejected/requestedChanges: a question or an agent reply does not count as an objection.
export function computeApprovedFiles(state: ReviewState): string[] {
	const signOffHashes = state.reviewedFileHashes ?? {}
	const currentHashes = new Map(
		state.files.map(file => [file.path, file.contentHash]),
	)
	const rejected = new Set<string>()
	for (const decision of effectiveDecisions(state))
		if (decision.status === 'rejected') rejected.add(decision.path)
	const openChanges = new Set<string>()
	for (const comment of state.comments)
		if (isRequestedChange(comment)) openChanges.add(comment.path)
	const isSignedOff = (filePath: string): boolean => {
		const signedHash = signOffHashes[filePath]
		return !!signedHash && signedHash === currentHashes.get(filePath)
	}
	return state.reviewedFiles.filter(
		filePath =>
			isSignedOff(filePath) &&
			!rejected.has(filePath) &&
			!openChanges.has(filePath),
	)
}
