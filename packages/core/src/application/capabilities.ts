// What a hub's GitPort offers beyond a branch on GitHub, asked for where a use case needs it.
import type { DeskCapabilities } from '@syneva/contracts/browser'
import type { ReviewState } from '../domain/review.js'
import type { GitPort, WorkingTreePort } from './ports.js'

// Why a repo or file desk does not open on a hub without a working tree (rootProblem answers it).
export const NO_WORKING_TREE =
	'This hub has no working tree: only a pr desk (a branch or a pull request) opens here.'

// Repo and file desks read the working tree and the index. rootProblem refuses them on a hub
// without one before anything is built, so reaching here without it is a wiring error, never a
// request to answer.
export function requireWorkingTree(git: GitPort): WorkingTreePort {
	if (git.workingTree) return git.workingTree
	throw new Error(NO_WORKING_TREE)
}

// What the tab is told the desk can do. Constant for a desk's life (its mode and its hub's port),
// so the state body cached per revision never carries a stale answer.
export function deskCapabilities(
	state: ReviewState,
	git: GitPort,
): DeskCapabilities {
	return { staging: state.mode !== 'pr' && !!git.staging }
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
