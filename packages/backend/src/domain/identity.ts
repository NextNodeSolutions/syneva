import crypto from 'node:crypto'

import type { ReviewMode } from './review.js'

// Enough to key a per-repo review dir and a desk id, short enough to stay readable inside a path or a URL.
const HASH_LENGTH = 16

// sha1 over "blob <byteLen>\0" + bytes - the exact bytes git hashes, so this equals `git hash-object` and matches `git diff --raw`: committed sides need no re-hash.
// SHA-1 only (git's default): on a rare sha256 repo working sides use this while committed sides carry real OIDs - internally consistent per file, so staleness stays correct. Pure, so the diff assembly can hash without the adapter.
export function blobOid(content: string): string {
	const bytes = Buffer.from(content, 'utf8')
	return crypto
		.createHash('sha1')
		.update(`blob ${bytes.length}\0`)
		.update(bytes)
		.digest('hex')
}

export function hash(text: string): string {
	return crypto
		.createHash('sha256')
		.update(text)
		.digest('hex')
		.slice(0, HASH_LENGTH)
}

// Anything outside [A-Za-z0-9._-] collapses to '-', so `--session "pr 123/foo"` can never escape the review dir; a name that cleans away to nothing still names a desk (fixed fallback).
export function sanitizeSession(session: string): string {
	const cleaned = session
		.replace(/[^a-zA-Z0-9._-]/g, '-')
		.replace(/^-+|-+$/g, '')
	return cleaned || 'review'
}

// Deterministic per repo root + session: opening the same review twice lands on the same desk (idempotent open), the same /d/<id>/ URL survives a hub restart, and an already-open tab self-heals instead of dying on a fresh id.
export function deskId(root: string, session: string): string {
	return hash(`${root}\n${sanitizeSession(session)}`)
}

// The project's identity is deterministic per repo root (the digest that keys the repo's review dir): the project page keeps one URL across sessions, desks and hub restarts, and two repos sharing a directory name never share a page.
export function projectId(root: string): string {
	return hash(root)
}

// Default session per mode: <branch> / file-<path> / pr-<ref>, overridable.
// Pure: the CLI and the hub derive the same name for the same inputs, which is what makes an open idempotent across the two entry points.
export function deskSession(
	mode: ReviewMode,
	target: string | undefined,
	branch: string,
	override?: string,
): string {
	if (override) return sanitizeSession(override)
	if (mode === 'file') return sanitizeSession(`file-${target ?? 'file'}`)
	if (mode === 'pr')
		return sanitizeSession(`pr-${prHeadLabel(target, branch)}`)
	return sanitizeSession(branch || 'review')
}

function prHeadLabel(target: string | undefined, branch: string): string {
	if (target) return target
	if (branch) return branch
	return 'pr'
}
