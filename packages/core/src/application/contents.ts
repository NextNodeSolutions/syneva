import path from 'node:path'

import { hash } from '../domain/identity.js'

import type { FileContents } from '../domain/contents.js'
import type { ReviewFile, ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'

// Keyed by root + path + both sides' identities: contentHash names the new side, the file's hunks the old one (with the new side fixed, the diff determines it). The old side moves on its own - staging a hunk rewrites the index a working diff reads its old side from, a commit moves the HEAD a staged diff reads - so a key on the new side alone would keep serving the old side from before. A reload that changes either side changes the key, and the stale entry falls out (no explicit invalidation).
// Process-global and shared by every desk, but the key carries the repo root, so two desks never collide.
const CONTENTS_CACHE_CAP = 30
const contentsCache = new Map<string, FileContents>()

// Review files are immutable records (a reload replaces them), so one hash per record is enough.
const oldSideStamps = new WeakMap<ReviewFile, string>()

function oldSideStamp(file: ReviewFile): string {
	const known = oldSideStamps.get(file)
	if (known) return known
	const stamp = hash(
		JSON.stringify([file.changeKind ?? '', file.oldPath ?? '', file.hunks]),
	)
	oldSideStamps.set(file, stamp)
	return stamp
}

// Replays the exact per-mode ref semantics buildDiffSource built the diff against, so a fetch returns the bytes the diff was taken over (the state carries no contents).
export async function readFileContents(
	state: ReviewState,
	file: ReviewFile,
	git: GitPort,
): Promise<FileContents> {
	const key = `${state.root}\0${file.path}\0${file.contentHash}\0${oldSideStamp(file)}`
	const hit = contentsCache.get(key)
	if (hit) {
		contentsCache.delete(key) // re-insert below → most-recently-used
		contentsCache.set(key, hit)
		return hit
	}
	const resolved = await resolveFileContents(state, file, git)
	contentsCache.set(key, resolved)
	evictLeastRecentlyUsed()
	return resolved
}

function resolveFileContents(
	state: ReviewState,
	file: ReviewFile,
	git: GitPort,
): Promise<FileContents> {
	if (state.mode === 'pr') return prContents(state, file, git)
	if (state.mode === 'file') return fileModeContents(state, file, git)
	return state.staged
		? stagedContents(state, file, git)
		: workingContents(state, file, git)
}

function evictLeastRecentlyUsed(): void {
	while (contentsCache.size > CONTENTS_CACHE_CAP) {
		const oldest = contentsCache.keys().next().value
		if (!oldest) break
		contentsCache.delete(oldest)
	}
}

// pr: both sides are committed objects (the new one the head the diff was built from, not whatever
// HEAD is now), read strictly - a git object dropped by a mid-session rebase throws (→ /file-contents
// 404s with a reload hint) instead of serving empty; `changeKind` says which sides exist, so a
// legitimately absent side is "" WITHOUT a read.
async function prContents(
	state: ReviewState,
	file: ReviewFile,
	git: GitPort,
): Promise<FileContents> {
	const base = state.base ?? 'HEAD'
	const oldContents =
		file.changeKind === 'added'
			? ''
			: await git.fileAt(state.root, file.oldPath, base, true)
	const newContents =
		file.changeKind === 'deleted'
			? ''
			: await git.fileAt(
					state.root,
					file.newPath,
					state.head ?? 'HEAD',
					true,
				)
	return { oldContents, newContents }
}

// file mode: tracked+changed reads old from the INDEX (:0) and new from the working tree; tracked-unchanged is full-file working/working; untracked/new is ""/working. The working tree stays non-strict - a file deleted under us reads "".
async function fileModeContents(
	state: ReviewState,
	file: ReviewFile,
	git: GitPort,
): Promise<FileContents> {
	const abs = path.isAbsolute(file.path)
		? file.path
		: path.join(state.root, file.path)
	const working = (await git.workspace.readFile(abs)) ?? ''
	const tracked = await git.isTracked(state.root, file.path)
	if (tracked && file.hunks.length)
		return {
			oldContents: await git.fileAt(state.root, file.oldPath, ':0'),
			newContents: working,
		}
	return { oldContents: tracked ? working : '', newContents: working }
}

async function stagedContents(
	state: ReviewState,
	file: ReviewFile,
	git: GitPort,
): Promise<FileContents> {
	const oldContents =
		file.changeKind === 'added'
			? ''
			: await git.fileAt(state.root, file.oldPath, 'HEAD', true)
	const newContents =
		file.changeKind === 'deleted'
			? ''
			: await git.fileAt(state.root, file.newPath, ':0', true)
	return { oldContents, newContents }
}

// working repo diff: old reads :0 (committed → strict), new the dirty working tree (non-strict → a vanished file reads ""); an untracked add is changeKind "added", so its old side is "" without a (failing) :0 read.
async function workingContents(
	state: ReviewState,
	file: ReviewFile,
	git: GitPort,
): Promise<FileContents> {
	const oldContents =
		file.changeKind === 'added'
			? ''
			: await git.fileAt(state.root, file.oldPath, ':0', true)
	return {
		oldContents,
		newContents: await git.fileAt(state.root, file.newPath),
	}
}
