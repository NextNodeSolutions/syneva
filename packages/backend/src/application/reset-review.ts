import type { ResetScope } from '@syneva/contracts/review'
import type { ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'

// Returned as a patch, not applied - the desk owns its live state, so the caller merges: 'review' drops every decision and sign-off but keeps notes; 'approved' returns only signed-off files to pending.
// 'all' the whole review, notes included.
export function resetReviewPatch(
	state: ReviewState,
	scope: ResetScope,
): Partial<ReviewState> {
	if (scope === 'approved') {
		// reviewedFiles IS the signed-off set, so dropping it drops exactly the approvals.
		const done = new Set(state.reviewedFiles)
		return {
			reviewedFiles: [],
			reviewedFileHashes: {},
			decisionFiles: (state.decisionFiles ?? []).filter(
				p => !done.has(p),
			),
			decisions: (state.decisions ?? []).filter(d => !done.has(d.path)),
			stagedFiles: state.stagedFiles.filter(p => !done.has(p)),
			stagedChangeKeys: (state.stagedChangeKeys ?? []).filter(
				key => !done.has(key.split(':')[0] ?? ''),
			),
			changes: state.changes.map(change =>
				done.has(change.path)
					? { ...change, status: 'pending', reviewedHash: undefined }
					: change,
			),
		}
	}
	const patch: Partial<ReviewState> = {
		reviewedFiles: [],
		reviewedFileHashes: {},
		stagedFiles: [],
		stagedChangeKeys: [],
		decisionFiles: [],
		decisions: [],
		comments: scope === 'review' ? state.comments : [],
		domainComments: scope === 'review' ? state.domainComments : [],
		changes: state.changes.map(change => ({
			...change,
			status: 'pending',
			reviewedHash: undefined,
		})),
	}
	return patch
}

// One spawn: `git restore --staged` takes many pathspecs; pr mode has no working-tree index to restore (skip the git work entirely).
// A fresh checkout without a HEAD commit has no restore target, hence the `git reset` fallback.
export async function unstageReviewedFiles(
	state: ReviewState,
	git: GitPort,
	paths: readonly string[] = state.files.map(file => file.path),
): Promise<void> {
	if (state.mode === 'pr' || !paths.length) return
	await git
		.run(['restore', '--staged', '--', ...paths], state.root)
		.catch(async () =>
			git.run(['reset', 'HEAD', '--', ...paths], state.root),
		)
}
