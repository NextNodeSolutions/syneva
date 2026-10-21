// The clone on disk beyond its commits - the working tree, the index and the remotes - one git command per operation (WorkingTreePort documents each).
import { git } from './exec.js'
import { readObjects } from './objects.js'
import { fileAt, rawBlobOids } from './reads.js'

import type { WorkingTreePort } from '@syneva/core/application/ports'

export const nodeWorkingTree: WorkingTreePort = Object.freeze({
	diff: workingDiff,
	stagedBlobOids: async (root: string, path: string | undefined) =>
		rawBlobOids(root, { staged: true, path }),
	indexFile: async (
		root: string,
		rel: string | undefined,
		isStrict = false,
	) => fileAt(root, rel, ':0', isStrict),
	workingFile: async (root: string, rel: string | undefined) =>
		fileAt(root, rel),
	readObjects,
	isTracked,
	projectTree,
	untrackedFiles,
	stagedPaths,
	trackedChanges,
	remoteBranch,
	checkout,
})

async function workingDiff(
	root: string,
	scope: { staged?: boolean | undefined; path?: string | undefined },
): Promise<string> {
	const args = ['diff', '--no-ext-diff', '-M']
	if (scope.staged) args.push('--cached')
	if (scope.path) args.push('--', scope.path)
	return await git(args, root)
}

async function isTracked(root: string, rel: string): Promise<boolean> {
	return await git(['ls-files', '--error-unmatch', '--', rel], root).then(
		() => true,
		() => false,
	)
}

async function untrackedFiles(
	root: string,
	path: string | undefined,
): Promise<string[]> {
	const args = ['ls-files', '--others', '--exclude-standard']
	if (path) args.push('--', path)
	return (await git(args, root)).split(/\r?\n/).filter(Boolean)
}

async function stagedPaths(root: string): Promise<string[]> {
	return (await git(['diff', '--cached', '--name-only'], root))
		.split(/\r?\n/)
		.filter(Boolean)
}

async function trackedChanges(root: string): Promise<string> {
	return await git(['status', '--porcelain', '--untracked-files=no'], root)
}

async function remoteBranch(
	root: string,
	name: string,
): Promise<string | null> {
	await git(['fetch', 'origin', name], root).catch(() => undefined)
	const remote = `origin/${name}`
	try {
		await git(['rev-parse', '--verify', '--quiet', remote], root)
		return remote
	} catch {
		return null
	}
}

async function checkout(root: string, name: string): Promise<void> {
	await git(['checkout', name], root)
}

async function projectTree(root: string): Promise<string[]> {
	try {
		const tracked = await git(['ls-files'], root)
		return tracked
			.split(/\r?\n/)
			.filter(Boolean)
			.toSorted((a, b) => a.localeCompare(b))
	} catch {
		return []
	}
}
