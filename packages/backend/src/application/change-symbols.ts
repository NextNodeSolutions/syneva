// Every changed block named by the code it sits in: both sides of each outlined file read in one batch (the revisions the diff was taken over), parsed once per content, and each block mapped to its enclosing declaration.
import path from 'node:path'

import { blockCounts, changeTitle } from '../domain/change-blocks.js'
import {
	changeBlocks,
	changeStableKeyFromBlock,
} from '../domain/diff/change.js'
import { hash } from '../domain/identity.js'
import {
	blockDeclarations,
	changeTrivia,
	outlineLanguage,
} from '../domain/outline.js'

import { mapContentReads } from './content-reads.js'
import { readFileContents } from './contents.js'

import type {
	ChangeTrivia,
	LineSpan,
	SourceOutline,
} from '../domain/outline.js'
import type { ChangeState, ReviewFile, ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'

type Side = ChangeState['side']
type SideTexts = Map<string, string>

function sideKey(side: Side, filePath: string): string {
	return `${side}\0${filePath}`
}

// Process-global: a reload re-reads the sides but re-parses only what changed (the key is the content's hash), and two desks over one repo share the work.
const OUTLINE_CACHE_CAP = 2000
const outlineCache = new Map<string, SourceOutline | null>()

function outlineOf(
	filePath: string,
	text: string,
	git: GitPort,
): SourceOutline | null {
	const key = `${outlineLanguage(filePath)}\0${hash(text)}`
	if (outlineCache.has(key)) return outlineCache.get(key) ?? null
	const outline = git.parser.outline(filePath, text)
	outlineCache.set(key, outline)
	const oldest = outlineCache.keys().next().value
	if (outlineCache.size > OUTLINE_CACHE_CAP && oldest)
		outlineCache.delete(oldest)
	return outline
}

// The sides each file needs: the new one where a block adds, the old one where a block only removes. Oversized files stay unnamed: parsing them would cost what their summary card saves.
function wantedSides(state: ReviewState): Map<ReviewFile, Set<Side>> {
	const outlined = new Map(
		state.files
			.filter(file => !file.oversized && outlineLanguage(file.path))
			.map(file => [file.path, file]),
	)
	const wanted = new Map<ReviewFile, Set<Side>>()
	for (const change of state.changes) {
		const file = outlined.get(change.path)
		if (!file) continue
		wanted.set(file, (wanted.get(file) ?? new Set<Side>()).add(change.side))
	}
	return wanted
}

// The object each side was diffed at (contents.ts reads the same, one file at a time); null for a working-tree side, read from disk.
function objectSpec(
	state: ReviewState,
	file: ReviewFile,
	side: Side,
): string | null {
	if (side === 'deletions') {
		const old = file.oldPath ?? file.path
		if (state.mode === 'pr') return `${state.base ?? 'HEAD'}:${old}`
		return state.staged ? `HEAD:${old}` : `:0:${old}`
	}
	const current = file.newPath ?? file.path
	if (state.mode === 'pr') return `${state.head ?? 'HEAD'}:${current}`
	if (!state.staged) return null
	return `:0:${current}`
}

async function readSides(
	state: ReviewState,
	wanted: Map<ReviewFile, Set<Side>>,
	git: GitPort,
): Promise<SideTexts> {
	const texts: SideTexts = new Map()
	const specs = new Map<string, string>()
	const onDisk: ReviewFile[] = []
	const pairs = [...wanted].flatMap(([file, sides]) =>
		[...sides].map(side => ({ file, side })),
	)
	for (const { file, side } of pairs) {
		const spec = objectSpec(state, file, side)
		if (spec) specs.set(spec, sideKey(side, file.path))
		else onDisk.push(file)
	}
	const objects = await git.readObjects(state.root, [...specs.keys()])
	for (const [spec, key] of specs) {
		const text = objects.get(spec)
		if (text) texts.set(key, text)
	}
	const working = await mapContentReads(onDisk, file =>
		git.workspace.readFile(
			path.join(state.root, file.newPath ?? file.path),
		),
	)
	for (const [position, file] of onDisk.entries()) {
		const text = working[position]
		if (text) texts.set(sideKey('additions', file.path), text)
	}
	return texts
}

// A file desk reviews one file whose sides follow their own rules (index or working tree): read through the content resolver.
async function readFileDeskSides(
	state: ReviewState,
	git: GitPort,
): Promise<SideTexts> {
	const files = state.files.filter(
		entry => !entry.oversized && outlineLanguage(entry.path),
	)
	const contents = await mapContentReads(files, file =>
		readFileContents(state, file, git),
	)
	return new Map(
		files.flatMap((file, position) => [
			[
				sideKey('additions', file.path),
				contents[position]?.newContents ?? '',
			],
			[
				sideKey('deletions', file.path),
				contents[position]?.oldContents ?? '',
			],
		]),
	)
}

function outlineFor(
	side: Side,
	filePath: string,
	texts: SideTexts,
	git: GitPort,
): SourceOutline | null {
	const text = texts.get(sideKey(side, filePath))
	if (!text) return null
	return outlineOf(filePath, text, git)
}

// The old-side lines a replacement block removes, found again from its hunk: a change records only the side it is anchored on.
function removedSpan(
	state: ReviewState,
	change: ChangeState,
): LineSpan | undefined {
	const file = state.files.find(entry => entry.path === change.path)
	const hunk = file?.hunks[change.hunkIndex]
	if (!hunk) return undefined
	const block = changeBlocks(hunk).find(
		lines => changeStableKeyFromBlock(lines) === change.stableKey,
	)
	const removed = block?.filter(line => line.kind === 'delete') ?? []
	const first = removed[0]?.oldLine
	const last = removed.at(-1)?.oldLine
	if (!first || !last) return undefined
	return { lineNumber: first, endLine: last }
}

function needsRemovedSide(change: ChangeState): boolean {
	return (
		change.side === 'additions' &&
		!!change.trivia &&
		blockCounts(change).removed > 0
	)
}

// A replacement block is trivia only when what it removes is too: `runTask()` turned into `// runTask()` adds a comment but deletes code. Import outranks comment, as in changeTrivia.
function replacedTrivia(
	state: ReviewState,
	change: ChangeState,
	texts: SideTexts,
	git: GitPort,
): ChangeTrivia | undefined {
	const outline = outlineFor('deletions', change.path, texts, git)
	const span = removedSpan(state, change)
	const removed = outline && span ? changeTrivia(outline, span) : undefined
	if (!removed || !change.trivia) return undefined
	return removed === 'import' ? 'import' : change.trivia
}

function withTrivia(
	change: ChangeState,
	trivia: ChangeTrivia | undefined,
): ChangeState {
	const { symbol } = change
	return {
		...change,
		trivia,
		title: changeTitle(blockCounts(change), { symbol, trivia }),
	}
}

function namedChange(
	change: ChangeState,
	texts: SideTexts,
	git: GitPort,
): ChangeState {
	const outline = outlineFor(change.side, change.path, texts, git)
	if (!outline) return change
	const span = {
		lineNumber: change.lineNumber,
		endLine: change.endLine ?? change.lineNumber,
	}
	const [declaration] = blockDeclarations(outline, span)
	const symbol = declaration
		? { name: declaration.name, kind: declaration.kind }
		: undefined
	return withTrivia({ ...change, symbol }, changeTrivia(outline, span))
}

// The old sides of the files whose replacement blocks still read as trivia: read only for them, so an ordinary edit costs no second read.
async function removedSides(
	state: ReviewState,
	pending: readonly ChangeState[],
	git: GitPort,
): Promise<SideTexts> {
	const paths = new Set(pending.map(change => change.path))
	const wanted = new Map<ReviewFile, Set<Side>>(
		state.files
			.filter(file => paths.has(file.path))
			.map(file => [file, new Set<Side>(['deletions'])]),
	)
	return await readSides(state, wanted, git)
}

export async function nameChanges(
	state: ReviewState,
	git: GitPort,
): Promise<ReviewState> {
	if (!state.changes.length) return state
	const texts =
		state.mode === 'file'
			? await readFileDeskSides(state, git)
			: await readSides(state, wantedSides(state), git)
	const named = state.changes.map(change => namedChange(change, texts, git))
	if (!named.some(needsRemovedSide)) return { ...state, changes: named }
	const oldTexts =
		state.mode === 'file'
			? texts
			: await removedSides(state, named.filter(needsRemovedSide), git)
	return {
		...state,
		changes: named.map(change =>
			needsRemovedSide(change)
				? withTrivia(
						change,
						replacedTrivia(state, change, oldTexts, git),
					)
				: change,
		),
	}
}
