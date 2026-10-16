import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { AdapterError, errorMessage } from '../../../application/errors.js'
import { nowIso } from '../../../application/time.js'

import { reviewDir } from './desk.js'
import { decodeReviewFile, encodeReviewFile } from './diff-envelope-dto.js'
import { asString } from './dto.js'
import {
	decodeGuideResolution,
	encodeGuideResolution,
} from './guide-resolution-dto.js'
import {
	decodeChange,
	decodeComment,
	decodeDecision,
	decodeGuide,
	decodeReviewStateFile,
	encodeChange,
	encodeComment,
	encodeDecision,
	encodeGuide,
} from './review-file-dto.js'

import type {
	PersistedReview,
	ReviewStamp,
	ReviewStorePort,
} from '../../../application/ports.js'
import type { ReviewState } from '../../../domain/review.js'
import type { Raw } from './dto.js'

const JSON_INDENT = 2
const REVIEW_FILE_SUFFIX = '.json'

function reviewFileName(state: ReviewState): string {
	return `${state.createdAt.replace(/[:.]/g, '-')}-${state.id}${REVIEW_FILE_SUFFIX}`
}

// Same-directory temp file + rename: a desk killed mid-write leaves no truncated review (readers see whole old or whole new).
export async function writeFileAtomic(
	file: string,
	contents: string,
): Promise<void> {
	const tmp = `${file}.${crypto.randomUUID()}.tmp`
	try {
		await fs.writeFile(tmp, contents, 'utf8')
		await fs.rename(tmp, file)
	} catch (error) {
		throw new AdapterError(errorMessage(error), { cause: error })
	}
}

// Hand back the stamp the caller adopts onto its live state; the argument must not be mutated (its identity IS the live state).
export async function persistReview(
	state: ReviewState,
): Promise<PersistedReview> {
	const dir = await reviewDir(state.root, state.session)
	const file = path.join(dir, state.persistFile ?? reviewFileName(state))
	const stamp: ReviewStamp = {
		updatedAt: nowIso(),
		persistFile: path.basename(file),
	}
	await writeFileAtomic(
		file,
		`${JSON.stringify(serializeReviewState(state, stamp), null, JSON_INDENT)}\n`,
	)
	return { file, stamp }
}

// Field-by-field on purpose: a spread would silently persist any field a future run adds; nested records go through the storage DTO encoders, so the disk format is exactly the storage contract.
function serializeReviewState(
	state: ReviewState,
	stamp: ReviewStamp,
): Record<string, unknown> {
	return {
		id: state.id,
		session: state.session,
		root: state.root,
		repoHash: state.repoHash,
		mode: state.mode,
		target: state.target,
		base: state.base,
		staged: state.staged,
		head: state.head,
		baseDiffHash: state.baseDiffHash,
		createdAt: state.createdAt,
		updatedAt: stamp.updatedAt,
		rawDiff: state.rawDiff,
		files: state.files.map(encodeReviewFile),
		comments: state.comments.map(encodeComment),
		changes: state.changes.map(encodeChange),
		reviewedFiles: state.reviewedFiles,
		reviewedFileHashes: state.reviewedFileHashes,
		stagedFiles: state.stagedFiles,
		stagedChangeKeys: state.stagedChangeKeys,
		decisionFiles: state.decisionFiles,
		decisions: state.decisions?.map(encodeDecision),
		guide: state.guide ? encodeGuide(state.guide) : undefined,
		guideResolution: state.guideResolution
			? encodeGuideResolution(state.guideResolution)
			: undefined,
		persistFile: stamp.persistFile,
	}
}

export async function loadLatestReview(
	root: string,
	session: string,
): Promise<ReviewState | null> {
	const dir = await reviewDir(root, session)
	const entries = await fs.readdir(dir).catch(() => [])
	const newestFirst = entries
		.filter(name => name.endsWith(REVIEW_FILE_SUFFIX))
		.toSorted()
		.toReversed()
	return await loadNewestFor(
		newestFirst.map(name => path.join(dir, name)),
		root,
	)
}

// Candidates newest-first, first hit for THIS root wins; a corrupt file is deleted and the desk starts empty rather than resurrecting a superseded older round.
async function loadNewestFor(
	candidates: string[],
	root: string,
): Promise<ReviewState | null> {
	const [file, ...older] = candidates
	if (!file) return null
	const state = await readReviewFile(file)
	if (state === 'corrupt') {
		await fs.rm(file, { force: true }).catch(() => undefined)
		return null
	}
	if (state === null) return await loadNewestFor(older, root)
	if (state.root === root) return state
	return await loadNewestFor(older, root)
}

// Decoded through the storage DTO (never cast): collections older files lack are padded, malformed
// records dropped, so a file always loads whatever is intact. 'corrupt' = invalid JSON (deleted or
// empty file); null = not a review record (skipped).
async function readReviewFile(
	file: string,
): Promise<ReviewState | null | 'corrupt'> {
	let raw: string
	try {
		raw = await fs.readFile(file, 'utf8')
	} catch (error) {
		throw new AdapterError(errorMessage(error), { cause: error })
	}
	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		return 'corrupt'
	}
	const decoded = decodeReviewStateFile(parsed)
	if (decoded === null) return null // not a review record - the loader skips the candidate
	const { id, session, root, body } = decoded
	return decodePersistedState(
		{ id, session, root },
		body,
		path.basename(file),
	)
}

// Identity already verified by decodeReviewStateFile; map field by field.
function decodePersistedState(
	identity: { id: string; session: string; root: string },
	body: Raw,
	persistFile: string,
): ReviewState {
	const { id, session, root } = identity
	return {
		id,
		session,
		root,
		repoHash: typeof body.repoHash === 'string' ? body.repoHash : '',
		mode:
			body.mode === 'repo' || body.mode === 'file' || body.mode === 'pr'
				? body.mode
				: 'repo',
		target: typeof body.target === 'string' ? body.target : undefined,
		base: typeof body.base === 'string' ? body.base : undefined,
		staged: body.staged === true,
		head: typeof body.head === 'string' ? body.head : null,
		baseDiffHash:
			typeof body.baseDiffHash === 'string' ? body.baseDiffHash : '',
		createdAt:
			typeof body.createdAt === 'string' ? body.createdAt : nowIso(),
		updatedAt:
			typeof body.updatedAt === 'string' ? body.updatedAt : undefined,
		rawDiff: typeof body.rawDiff === 'string' ? body.rawDiff : '',
		files: decodeArray(body.files, decodeReviewFile),
		comments: decodeArray(body.comments, decodeComment),
		changes: decodeArray(body.changes, decodeChange),
		reviewedFiles: decodeArray(body.reviewedFiles, asString),
		reviewedFileHashes: decodeStringRecord(body.reviewedFileHashes),
		stagedFiles: decodeArray(body.stagedFiles, asString),
		stagedChangeKeys: decodeArray(body.stagedChangeKeys, asString),
		decisionFiles: decodeArray(body.decisionFiles, asString),
		decisions: decodeArray(body.decisions, decodeDecision),
		...decodeGuideFields(body),
		persistFile,
	}
}

// A malformed guide decodes to nothing rather than half a guide (the desk reviews in diff order); a resolution without its guide is meaningless and dropped with it.
function decodeGuideFields(
	body: Raw,
): Pick<ReviewState, 'guide' | 'guideResolution'> {
	const guide = body.guide ? decodeGuide(body.guide) : null
	if (!guide) return { guide: undefined, guideResolution: undefined }
	const resolution = body.guideResolution
		? decodeGuideResolution(body.guideResolution)
		: null
	return { guide, guideResolution: resolution ?? undefined }
}

function decodeStringRecord(raw: unknown): Record<string, string> | undefined {
	if (typeof raw !== 'object' || raw === null) return undefined
	const record: Record<string, string> = {}
	for (const [key, hash] of Object.entries(raw)) {
		if (typeof hash !== 'string') return undefined
		record[key] = hash
	}
	return record
}

// Absent/malformed become empty arrays (the declared shape always carries them).
function decodeArray<Decoded>(
	raw: unknown,
	decode: (entry: unknown) => Decoded | null,
): Decoded[] {
	if (!Array.isArray(raw)) return []
	const values: Decoded[] = []
	for (const entry of raw) {
		const decoded = decode(entry)
		if (decoded !== null) values.push(decoded)
	}
	return values
}

// The application's review-store capability, frozen: use cases see a readonly port.
export const nodeReviewStore: ReviewStorePort = Object.freeze({
	loadLatestReview,
	persistReview,
	writeFileAtomic,
})
