import { gitStats } from '@syneva/core/domain/diff/git-stats'

import { nodeWorkspace } from '../filesystem/workspace.js'
import { nodeParser } from '../source/parser.js'

import { git } from './exec.js'
import { readObjects } from './objects.js'
import { fileAt, rawBlobOids } from './reads.js'
import { nodeStaging } from './staging.js'
import { nodeWorkingTree } from './working-tree.js'

import type { GitPort } from '@syneva/core/application/ports'

export { gitStats }

// A clone on disk: every tier of the port. The workspace facet rides along (the working tree is this adapter's domain), so a use case takes one capability object and imports no node:fs itself.
export const nodeGit: GitPort = Object.freeze({
	getGitRoot,
	getHead,
	getBranch,
	defaultBranch,
	mergeBase,
	resolveRef,
	diff,
	rawBlobOids,
	fileAt,
	readObjects,
	tree,
	workspace: nodeWorkspace,
	parser: nodeParser,
	workingTree: nodeWorkingTree,
	staging: nodeStaging,
})

export async function getGitRoot(cwd: string): Promise<string> {
	return git(['rev-parse', '--show-toplevel'], cwd)
}

export async function getHead(cwd: string): Promise<string | null> {
	try {
		return await git(['rev-parse', 'HEAD'], cwd)
	} catch {
		return null
	}
}

// Branches a clone's default branch falls back to when origin/HEAD isn't set.
const BRANCH_CANDIDATES = ['main', 'master'] as const

export async function diff(
	root: string,
	range: { base: string; head: string },
): Promise<string> {
	return await git(
		['diff', '--no-ext-diff', '-M', `${range.base}..${range.head}`],
		root,
	)
}

// Else the first of main/master that exists, else HEAD (a detached or unusual checkout still gets a review).
export async function defaultBranch(root: string): Promise<string> {
	const sym = await git(
		['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'],
		root,
	).catch(() => '')
	if (sym) return sym // e.g. "origin/main"
	const probed = await Promise.all(
		BRANCH_CANDIDATES.map(async branch => branchExists(root, branch)),
	)
	const found = BRANCH_CANDIDATES.find((_, index) => probed[index])
	return found ?? 'HEAD'
}

async function branchExists(root: string, branch: string): Promise<boolean> {
	return await git(['rev-parse', '--verify', branch], root).then(
		() => true,
		() => false,
	)
}

export async function mergeBase(
	root: string,
	a: string,
	b: string,
): Promise<string> {
	return await git(['merge-base', a, b], root)
}

export async function resolveRef(
	root: string,
	ref: string,
): Promise<string | null> {
	return await git(
		['rev-parse', '--verify', '--quiet', `${ref}^{commit}`],
		root,
	).catch(() => null)
}

export async function getBranch(cwd: string): Promise<string> {
	try {
		const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)
		if (branch && branch !== 'HEAD') return branch
		const short = await git(['rev-parse', '--short', 'HEAD'], cwd)
		return short ? `detached-${short}` : ''
	} catch {
		return ''
	}
}

// Every file at a commit, for a desk without a working tree's project tree (unused by this hub,
// whose desks list the index through workingTree.projectTree).
async function tree(root: string, ref: string): Promise<string[]> {
	try {
		const listed = await git(['ls-tree', '-r', '--name-only', ref], root)
		return listed
			.split(/\r?\n/)
			.filter(Boolean)
			.toSorted((a, b) => a.localeCompare(b))
	} catch {
		return []
	}
}
