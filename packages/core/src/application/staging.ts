import { patchForChange } from '../domain/diff/change.js'

import { errorMessage } from './errors.js'

import type { ReviewState } from '../domain/review.js'
import type { StagingPort } from './ports.js'

export type StagePathsRequest = {
	paths: string[]
	recorded?: string | undefined
}

export type StageChangeRequest = { path: string; stableKey: string }

export type StageChangeOutcome =
	| { decision: 'already-staged'; skipped: true; state: ReviewState }
	| { decision: 'staged'; skipped: boolean; state: ReviewState }
	| { decision: 'conflict'; skipped: false; message: string }

// `git add`-ing both the old (deleted) and new path records the rename in the index; stagedFiles records the review file's path once - the caller's `path`, else the last of `paths` (approveCurrentFile sends [old, new]).
export async function stagePaths(
	state: ReviewState,
	request: StagePathsRequest,
	staging: StagingPort,
): Promise<ReviewState> {
	if (request.paths.length) await staging.stage(state.root, request.paths)
	const recorded = request.recorded ?? request.paths.at(-1)
	if (!recorded || state.stagedFiles.includes(recorded)) return state
	return { ...state, stagedFiles: [...state.stagedFiles, recorded] }
}

// The recorded key is what makes staging idempotent: a block already staged (the reviewer reloaded and accepted it again) is a no-op, not a double-apply; past it, the index itself tells "already staged" (a reload re-accepting a block it already holds) from a real apply.
export async function stageChange(
	state: ReviewState,
	request: StageChangeRequest,
	staging: StagingPort,
): Promise<StageChangeOutcome> {
	const key = `${request.path}:${request.stableKey}`
	const staged = state.stagedChangeKeys ?? []
	if (staged.includes(key))
		return { decision: 'already-staged', skipped: true, state }
	let applied: 'applied' | 'skipped'
	try {
		applied = await staging.applyToIndex(
			state.root,
			patchForChange(state.rawDiff, request.path, request.stableKey),
		)
	} catch (error) {
		return {
			decision: 'conflict',
			skipped: false,
			message: errorMessage(error),
		}
	}
	return {
		decision: 'staged',
		skipped: applied === 'skipped',
		state: { ...state, stagedChangeKeys: [...staged, key] },
	}
}

export async function unstagePath(
	state: ReviewState,
	filePath: string,
	staging: StagingPort,
): Promise<ReviewState> {
	await staging.unstage(state.root, [filePath])
	return {
		...state,
		stagedFiles: state.stagedFiles.filter(
			candidate => candidate !== filePath,
		),
		stagedChangeKeys: (state.stagedChangeKeys ?? []).filter(
			key => !key.startsWith(`${filePath}:`),
		),
	}
}
