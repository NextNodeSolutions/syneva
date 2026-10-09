import path from 'node:path'

import { contextKey } from '../domain/guide-reference-resolve.js'
import { hash } from '../domain/identity.js'

import { repoPath } from './containment.js'
import { mapContentReads } from './content-reads.js'
import { readFileContents } from './contents.js'

import type { ContextHashes } from '../domain/guide-reference-resolve.js'
import type { Guide, GuideReference } from '../domain/guide-shapes.js'
import type { ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'

// The content identity of every `context` reference: the cited lines on the reviewed revision, hashed. Reads are bounded (one per distinct file side, at most CONTEXT_FILE_LIMIT) and confined to the repository - a path that escapes it, or lines that do not exist, resolve to nothing rather than to another file.
const CONTEXT_FILE_LIMIT = 40

type Citation = { domainId: string; reference: GuideReference }

type SideKey = string

function sideKey(reference: GuideReference): SideKey {
	return `${reference.side}\0${reference.path}`
}

function citations(guide: Guide): Citation[] {
	return guide.domains.flatMap(domain =>
		(domain.references ?? [])
			.filter(reference => reference.role === 'context')
			.map(reference => ({ domainId: domain.id, reference })),
	)
}

// The side's revision per mode, as the diff was taken (contents.ts for files in the diff): new side = working tree / index / HEAD, old side = index / HEAD / base.
async function readUnchangedSide(
	state: ReviewState,
	rel: string,
	side: 'additions' | 'deletions',
	git: GitPort,
): Promise<string | null> {
	const abs = repoPath(state.root, rel)
	if (!abs) return null
	if (state.mode === 'pr')
		return git.fileAt(
			state.root,
			rel,
			side === 'additions'
				? (state.head ?? 'HEAD')
				: (state.base ?? 'HEAD'),
		)
	if (state.staged)
		return git.fileAt(state.root, rel, side === 'additions' ? ':0' : 'HEAD')
	if (side === 'deletions') return git.fileAt(state.root, rel, ':0')
	return git.workspace.readFile(path.join(state.root, rel))
}

async function readSide(
	state: ReviewState,
	rel: string,
	side: 'additions' | 'deletions',
	git: GitPort,
): Promise<string | null> {
	const file = state.files.find(candidate => candidate.path === rel)
	try {
		if (!file) return await readUnchangedSide(state, rel, side, git)
		const contents = await readFileContents(state, file, git)
		return side === 'additions'
			? contents.newContents
			: contents.oldContents
	} catch {
		return null
	}
}

function spanHash(text: string, reference: GuideReference): string | null {
	const lines = text.split('\n')
	const end = reference.endLine ?? reference.lineNumber
	if (end > lines.length) return null
	return hash(lines.slice(reference.lineNumber - 1, end).join('\n'))
}

export async function readContextHashes(
	state: ReviewState,
	guide: Guide,
	git: GitPort,
): Promise<ContextHashes> {
	const cited = citations(guide)
	const sides = [
		...new Set(cited.map(citation => sideKey(citation.reference))),
	].slice(0, CONTEXT_FILE_LIMIT)
	const texts = new Map<SideKey, string | null>()
	await mapContentReads(sides, async key => {
		const [side, rel] = key.split('\0')
		const text =
			side === 'additions' || side === 'deletions'
				? await readSide(state, rel ?? '', side, git)
				: null
		texts.set(key, text)
	})
	const hashes = new Map<string, string | null>()
	for (const { domainId, reference } of cited) {
		const text = texts.get(sideKey(reference))
		hashes.set(
			contextKey(domainId, reference.id),
			typeof text === 'string' ? spanHash(text, reference) : null,
		)
	}
	return hashes
}
