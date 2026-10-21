// The clone on disk beyond its commits - the working tree, the index and the remotes - one git command per operation (GitPort documents each).
import { git } from './exec.js'

export async function workingDiff(
	root: string,
	scope: { staged?: boolean | undefined; path?: string | undefined },
): Promise<string> {
	const args = ['diff', '--no-ext-diff', '-M']
	if (scope.staged) args.push('--cached')
	if (scope.path) args.push('--', scope.path)
	return await git(args, root)
}

export async function isTracked(root: string, rel: string): Promise<boolean> {
	return await git(['ls-files', '--error-unmatch', '--', rel], root).then(
		() => true,
		() => false,
	)
}

export async function untrackedFiles(
	root: string,
	path: string | undefined,
): Promise<string[]> {
	const args = ['ls-files', '--others', '--exclude-standard']
	if (path) args.push('--', path)
	return (await git(args, root)).split(/\r?\n/).filter(Boolean)
}

export async function stagedPaths(root: string): Promise<string[]> {
	return (await git(['diff', '--cached', '--name-only'], root))
		.split(/\r?\n/)
		.filter(Boolean)
}

export async function trackedChanges(root: string): Promise<string> {
	return await git(['status', '--porcelain', '--untracked-files=no'], root)
}

export async function remoteBranch(
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

export async function checkout(root: string, name: string): Promise<void> {
	await git(['checkout', name], root)
}
