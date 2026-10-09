import { changeKey } from '../domain/change-blocks.js'
import { reanchorComments } from '../domain/comments.js'
import { effectiveDecisions } from '../domain/decisions.js'
import { reanchorDomainComments } from '../domain/domain-comments.js'
import { reconcileGuide } from '../domain/guide-reconcile.js'
import { buildInventory } from '../domain/inventory.js'

import { mapContentReads } from './content-reads.js'
import { readFileContents } from './contents.js'
import { readContextHashes } from './guide-context.js'

import type { FileContents } from '../domain/contents.js'
import type { GuideResolution } from '../domain/guide-shapes.js'
import type {
	ChangeState,
	Decision,
	ReviewComment,
	ReviewFile,
	ReviewState,
} from '../domain/review.js'
import type { GitPort } from './ports.js'

type RenameMigration = {
	migratePath: (path: string) => string
	// A `path:stableKey` key whose path prefix was renamed - prefix swapped, stableKey kept.
	migrateKey: (key: string) => string
}

// Carry the previous round's decisions, sign-offs, comments and staged bookkeeping onto a rebuilt diff; content hashes decide what survives, so a rewritten block or file falls back to pending.
export async function mergeReviewState(
	base: ReviewState,
	saved: ReviewState | null,
	git: GitPort,
): Promise<ReviewState> {
	if (!saved) return base
	const rename = renameMigration(base.files)
	const signOff = carryReviewedFiles(base, saved, rename)
	const decisions = mergeDecisions(base, saved, rename)
	return {
		...base,
		id: saved.id,
		createdAt: saved.createdAt,
		comments: await mergeComments(base, saved, rename, git),
		reviewedFiles: signOff.reviewedFiles,
		reviewedFileHashes: signOff.reviewedFileHashes,
		stagedFiles: saved.stagedFiles,
		// Rename key migration keeps a pre-rename key from lingering stale (readStagedSnapshot prunes unstaged keys).
		stagedChangeKeys: (saved.stagedChangeKeys ?? []).map(rename.migrateKey),
		decisionFiles: (saved.decisionFiles ?? []).map(rename.migratePath),
		changes: decisions.changes,
		decisions: decisions.decisions,
		guide: saved.guide ?? base.guide,
		guideResolution: await reconcileCarriedGuide(base, saved, git),
		// The threads on the guide follow the carried guide: a target it still has keeps its thread anchored.
		domainComments: reanchorDomainComments(
			saved.domainComments ?? [],
			saved.guide ?? base.guide,
		),
		persistFile: saved.persistFile,
	} satisfies ReviewState
}

// The carried guide is never rewritten: its attach-time identities stay and the reload marks what no longer holds (stale domains, reference statuses, changes no domain owns) against the rebuilt diff.
async function reconcileCarriedGuide(
	base: ReviewState,
	saved: ReviewState,
	git: GitPort,
): Promise<GuideResolution | undefined> {
	if (!saved.guide || !saved.guideResolution) return undefined
	return reconcileGuide(
		saved.guide,
		saved.guideResolution,
		buildInventory(base, undefined),
		await readContextHashes(base, saved.guide, git),
	)
}

// A git-native rename remaps reviewer records old→new up front: without it, records silently drop (path miss) or reset (key miss); content checks judge staleness as usual.
function renameMigration(files: readonly ReviewFile[]): RenameMigration {
	const renamed = new Map<string, string>()
	for (const file of files) {
		if (file.oldPath && file.newPath && file.oldPath !== file.newPath)
			renamed.set(file.oldPath, file.newPath)
	}
	return {
		migratePath: path => renamed.get(path) ?? path,
		migrateKey: key => {
			for (const [oldPath, newPath] of renamed) {
				if (key.startsWith(`${oldPath}:`))
					return `${newPath}:${key.slice(oldPath.length + 1)}`
			}
			return key
		},
	}
}

// Decisions survive a missing block (accepting may have staged the hunk out) and drop as stale when content changed; a vanished REJECTED decision is dropped too - an invisible objection would block approval forever.
function mergeDecisions(
	base: ReviewState,
	saved: ReviewState,
	rename: RenameMigration,
): { changes: ChangeState[]; decisions: Decision[] } {
	const migrated = effectiveDecisions(saved).map(decision =>
		renamedDecision(decision, rename),
	)
	const decisionByKey = new Map(
		migrated.map(decision => [decision.key, decision]),
	)
	const stale = new Set<string>()
	const statusByKey = new Map<
		string,
		Pick<ChangeState, 'status' | 'reviewedHash'>
	>()
	for (const change of base.changes) {
		const key = changeKey(change)
		const decision = decisionByKey.get(key)
		if (!decision) continue
		if (
			decision.reviewedHash &&
			decision.reviewedHash === change.contentHash
		) {
			statusByKey.set(key, {
				status: decision.status,
				reviewedHash: decision.reviewedHash,
			})
			continue
		}
		stale.add(key)
	}
	const changes = base.changes.map(change => {
		const applied = statusByKey.get(changeKey(change))
		return applied ? { ...change, ...applied } : change
	})
	const present = new Set(base.changes.map(change => changeKey(change)))
	return {
		changes,
		decisions: migrated.filter(
			decision =>
				!stale.has(decision.key) &&
				(decision.status !== 'rejected' || present.has(decision.key)),
		),
	}
}

function renamedDecision(
	decision: Decision,
	rename: RenameMigration,
): Decision {
	const path = rename.migratePath(decision.path)
	if (path === decision.path) return decision
	return { ...decision, path, key: rename.migrateKey(decision.key) }
}

function carryReviewedFiles(
	base: ReviewState,
	saved: ReviewState,
	rename: RenameMigration,
): Pick<ReviewState, 'reviewedFiles' | 'reviewedFileHashes'> {
	const currentHashes = new Map(
		base.files.map(file => [file.path, file.contentHash]),
	)
	const savedHashes = Object.fromEntries(
		Object.entries(saved.reviewedFileHashes ?? {}).map(
			([path, fileHash]) => [rename.migratePath(path), fileHash],
		),
	)
	const reviewedFiles: string[] = []
	const reviewedFileHashes: Record<string, string> = {}
	for (const savedPath of saved.reviewedFiles) {
		const file = rename.migratePath(savedPath)
		const savedHash = savedHashes[file]
		if (!savedHash || currentHashes.get(file) !== savedHash) continue
		reviewedFiles.push(file)
		reviewedFileHashes[file] = savedHash
	}
	return { reviewedFiles, reviewedFileHashes }
}

async function mergeComments(
	base: ReviewState,
	saved: ReviewState,
	rename: RenameMigration,
	git: GitPort,
): Promise<ReviewComment[]> {
	const currentFiles = new Set(base.files.map(file => file.path))
	const comments = saved.comments
		.map(comment => renamedComment(comment, rename))
		.map(comment => markStaleIfGone(comment, currentFiles))
		.filter(
			comment =>
				currentFiles.has(comment.path) || comment.intent === 'action',
		)
	const openPaths = new Set(
		comments
			.filter(comment => comment.status === 'open')
			.map(comment => comment.path),
	)
	const contentsByPath = await readCommentedContents(base, openPaths, git)
	return reanchorComments(comments, base.files, path =>
		contentsByPath.get(path),
	)
}

function renamedComment(
	comment: ReviewComment,
	rename: RenameMigration,
): ReviewComment {
	const path = rename.migratePath(comment.path)
	if (path === comment.path) return comment
	return { ...comment, path }
}

function markStaleIfGone(
	comment: ReviewComment,
	currentFiles: Set<string>,
): ReviewComment {
	if (currentFiles.has(comment.path)) return comment
	return { ...comment, status: 'stale' }
}

// Only the open-commented files, read on demand: one read per commented file (never per diff file); a failed read degrades to unanchored, not a crashed reload; the reads run concurrently via mapContentReads.
async function readCommentedContents(
	base: ReviewState,
	openPaths: Set<string>,
	git: GitPort,
): Promise<Map<string, FileContents>> {
	const contentsByPath = new Map<string, FileContents>()
	const commented = base.files.filter(file => openPaths.has(file.path))
	await mapContentReads(commented, async file => {
		const resolved = await readFileContents(base, file, git).catch(
			() => undefined,
		)
		if (resolved) contentsByPath.set(file.path, resolved)
	})
	return contentsByPath
}

export type StagedSnapshot = Required<
	Pick<ReviewState, 'stagedFiles' | 'stagedChangeKeys'>
>

export async function readStagedSnapshot(
	state: ReviewState,
	git: GitPort,
): Promise<StagedSnapshot> {
	const staged = await git
		.run(['diff', '--cached', '--name-only'], state.root)
		.catch(() => '')
	const stagedFiles = new Set(staged.split(/\r?\n/).filter(Boolean))
	const reviewFiles = new Set(state.files.map(file => file.path))
	return {
		stagedFiles: [...stagedFiles].filter(file => reviewFiles.has(file)),
		stagedChangeKeys: (state.stagedChangeKeys ?? []).filter(key =>
			stagedFiles.has(key.split(':')[0] ?? ''),
		),
	}
}
