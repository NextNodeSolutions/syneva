// Writing the index, one git command per operation (GitPort documents each); the temp file `git apply` reads is this adapter's own detail.
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { AdapterError, errorMessage } from '@syneva/core/application/errors'

import { git } from './exec.js'

export async function stage(
	root: string,
	paths: readonly string[],
): Promise<void> {
	await git(['add', '--', ...paths], root)
}

export async function unstage(
	root: string,
	paths: readonly string[],
): Promise<void> {
	await git(['restore', '--staged', '--', ...paths], root).catch(async () =>
		git(['reset', 'HEAD', '--', ...paths], root),
	)
}

// A reverse `--check` first tells "already staged" (a reload re-accepting a block the index
// already holds) from a real apply.
export async function applyToIndex(
	root: string,
	patch: string,
): Promise<'applied' | 'skipped'> {
	const tmp = await writeTempFile(patch)
	try {
		const baseArgs = ['apply', '--cached', '--unidiff-zero']
		const alreadyApplied = await git(
			[...baseArgs, '--reverse', '--check', tmp],
			root,
		).then(
			() => true,
			() => false,
		)
		if (alreadyApplied) return 'skipped'
		await git([...baseArgs, tmp], root)
		return 'applied'
	} finally {
		await removeTempDir(path.dirname(tmp))
	}
}

// mkdtemp, not $TMPDIR-or-/tmp: Windows sets TEMP/TMP instead, so the old fallback resolved to a nonexistent C:\tmp and mkdtemp ENOENT'd there (hunk staging failed on Windows); the file only has to live long enough for one `git apply`.
async function writeTempFile(contents: string): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'syneva-'))
	const file = path.join(dir, `${crypto.randomUUID()}.diff`)
	try {
		await fs.writeFile(file, contents, 'utf8')
	} catch (error) {
		await fs
			.rm(dir, { recursive: true, force: true })
			.catch(() => undefined)
		throw new AdapterError(errorMessage(error), { cause: error })
	}
	return file
}

async function removeTempDir(dir: string): Promise<void> {
	await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
}
