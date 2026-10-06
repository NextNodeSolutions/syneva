import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { AdapterError, errorMessage } from '../../../application/errors.js'

const execFileAsync = promisify(execFile)

const KIB = 1024
const MIB = KIB * KIB
const MAX_BUFFER_MIB = 256

// Cap on a single git/gh stdout, generous because a whole-PR `git diff` or a `git show` of a large generated file can be big; exceeding it rejects, or degrades a file to a spurious full add/delete (fileAt swallows the error).
// A too-small cap silently corrupts a large diff.

export const MAX_BUFFER = MAX_BUFFER_MIB * MIB

// core.quotePath defaults true, so a non-ASCII path comes back C-quoted (caf\303\251.txt) and gets mangled downstream.
// Disabling it via -c on the one wrapper git.ts and state.ts spawn through makes every invocation emit raw UTF-8 paths (a no-op for commands that emit no paths).
export async function git(args: string[], cwd: string): Promise<string> {
	try {
		const { stdout } = await execFileAsync(
			'git',
			['-c', 'core.quotePath=false', ...args],
			{
				cwd,
				maxBuffer: MAX_BUFFER,
			},
		)
		return stdout.trimEnd()
	} catch (error) {
		throw new AdapterError(errorMessage(error), { cause: error })
	}
}

// Thin gh wrapper, used only to resolve a PR number/URL to its branch, kept optional: callers catch failures (gh missing or unauthenticated) and report.
export async function gh(args: string[], cwd: string): Promise<string> {
	const { stdout } = await execFileAsync('gh', args, {
		cwd,
		maxBuffer: MAX_BUFFER,
	})
	return stdout.trimEnd()
}

export async function runGitRaw(args: string[], cwd: string): Promise<string> {
	try {
		const { stdout } = await execFileAsync('git', args, {
			cwd,
			maxBuffer: MAX_BUFFER,
		})
		return stdout
	} catch (error) {
		throw new AdapterError(errorMessage(error), { cause: error })
	}
}
