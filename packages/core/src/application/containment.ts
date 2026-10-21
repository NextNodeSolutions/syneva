import path from 'node:path'

import type { WorkspacePort } from './ports.js'

// Repo-relative path → absolute, or null if absolute or escaping the repo; /open-editor hands this to a local process, so the boundary must be strict.
export function repoPath(root: string, rel: string): string | null {
	if (path.isAbsolute(rel)) return null
	const resolvedRoot = path.resolve(root)
	const abs = path.resolve(resolvedRoot, rel)
	if (abs !== resolvedRoot && !abs.startsWith(resolvedRoot + path.sep))
		return null
	return abs
}

export type ContainedPath = { abs: string } | { error: 'escape' | 'missing' }

// Realpath both the target and the root; re-check containment AFTER symlinks (the plain startsWith runs on the UNRESOLVED path, so an in-repo symlink escaping the repo passes).
// "missing" (ENOENT) stays distinct from "escape": /file 404s a nonexistent file while /file-contents still serves one whose bytes come from git.
// The resolution itself is the workspace port's - no fs in the application.
export async function resolveContained(
	root: string,
	rel: string,
	workspace: WorkspacePort,
): Promise<ContainedPath> {
	const resolvedRoot = (await workspace.realpath(root)) ?? path.resolve(root)
	const abs = path.resolve(resolvedRoot, rel)
	if (abs !== resolvedRoot && !abs.startsWith(resolvedRoot + path.sep))
		return { error: 'escape' }
	const real = await workspace.realpath(abs)
	if (real === null) return { error: 'missing' }
	if (real !== resolvedRoot && !real.startsWith(resolvedRoot + path.sep))
		return { error: 'escape' }
	return { abs: real }
}
