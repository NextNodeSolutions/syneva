// What a hub's GitPort offers beyond a branch on GitHub, asked for where a use case needs it.
import type { DeskCapabilities } from '@syneva/contracts/browser'
import type { ReviewState } from '../domain/review.js'
import type { GitPort, StagingPort, WorkingTreePort } from './ports.js'

// Why a repo or file desk does not open on a hub without a working tree (rootProblem answers it).
export const NO_WORKING_TREE =
	'This hub has no working tree: only a pr desk (a branch or a pull request) opens here.'

// A repo or file desk's read of a working tree its hub lacks: the desk's mode conflicts with the
// hub, so the routes answer it 409 NO_WORKING_TREE (http.ts failureOf), not an INTERNAL 500.
export class NoWorkingTreeError extends Error {
	constructor() {
		super(NO_WORKING_TREE)
		this.name = 'NoWorkingTreeError'
	}
}

// Repo and file desks read the working tree and the index. rootProblem refuses them on a hub
// without one before anything is built, so reaching here without it is a broken invariant; it
// still answers in the hub's error shape, through the routes' one error mapping.
export function requireWorkingTree(git: GitPort): WorkingTreePort {
	if (git.workingTree) return git.workingTree
	throw new NoWorkingTreeError()
}

// The index a desk may write, the one answer to whether it stages: its capability, its staging
// routes and its reset all ask here. A pr desk reviews commits and stages nothing, even on a hub
// whose git could (its root is the user's clone, whose index is the user's); a hub without a
// working tree has no index at all.
export function deskStaging(
	state: ReviewState,
	git: GitPort,
): StagingPort | undefined {
	if (state.mode === 'pr') return undefined
	return git.staging
}

// What the tab is told the desk can do. Constant for a desk's life (its mode and its hub's port),
// so the state body cached per revision never carries a stale answer.
export function deskCapabilities(
	state: ReviewState,
	git: GitPort,
): DeskCapabilities {
	return { staging: !!deskStaging(state, git) }
}

// The files a desk's picker lists: what the index tracks on a clone, else every file of the
// reviewed head's tree.
export async function projectFiles(
	state: ReviewState,
	git: GitPort,
): Promise<string[]> {
	if (git.workingTree) return await git.workingTree.projectTree(state.root)
	return await git.tree(state.root, state.head ?? 'HEAD')
}
