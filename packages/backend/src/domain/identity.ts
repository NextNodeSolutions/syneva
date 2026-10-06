import crypto from 'node:crypto'

import type { ReviewMode } from './review.js'

// Hex chars kept from the sha256 digest: enough to key a per-repo review dir and a desk id,
// short enough to stay readable inside a path or a URL.
const HASH_LENGTH = 16

// Git's blob object id for a piece of content: sha1 over "blob <byteLen>\0" + bytes, the exact
// bytes git hashes, so this equals `git hash-object` for that content (barring clean/smudge
// filters, which Syneva doesn't use). Used as the file-level staleness key (contentHash) - the
// same value git reports in `git diff --raw`, so the committed sides need no re-hashing (see
// rawBlobOids in the git adapter) and only the working/untracked side is hashed here. SHA-1 only
// (git's default object format); on a rare sha256 repo committed sides still carry their real
// 64-hex OIDs while working sides get this sha1 - internally consistent per file, so staleness
// stays correct. Pure - lives in domain so the diff-assembly rules can hash without the adapter.
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

// A session name safe as one path segment: anything outside [A-Za-z0-9._-] collapses to '-', so
// `--session "pr 123/foo"` can never escape the review dir. A name that cleans away to nothing
// (`--session "///"`) still names a desk, so it falls back to a fixed default.
export function sanitizeSession(session: string): string {
	const cleaned = session
		.replace(/[^a-zA-Z0-9._-]/g, '-')
		.replace(/^-+|-+$/g, '')
	return cleaned || 'review'
}

// The desk's identity on the hub: deterministic per repo root + session, so opening the same
// review twice lands on the same desk (idempotent open), the same /d/<id>/ URL survives a hub
// restart, and an already-open tab self-heals instead of dying on a fresh id. The separator can
// never occur in a sanitized session, so two distinct (root, session) pairs never collide by
// concatenation.
export function deskId(root: string, session: string): string {
	return hash(`${root}\n${sanitizeSession(session)}`)
}

// The project's identity on the hub: deterministic per repo root (the same digest that keys the
// repo's review dir), so the dashboard's project page keeps one URL across sessions, desks and
// hub restarts, and two repos sharing a directory name never share a page.
export function projectId(root: string): string {
	return hash(root)
}

// Default session per mode: <branch> / file-<path> / pr-<ref>, overridable. Pure: the CLI and
// the hub derive the same name for the same inputs, which is what makes an open idempotent
// across the two entry points.
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

// A PR desk is named after its head: the resolved target when one was given, else the
// checked-out branch, else a bare "pr" so the session name is never empty.
function prHeadLabel(target: string | undefined, branch: string): string {
	if (target) return target
	if (branch) return branch
	return 'pr'
}
