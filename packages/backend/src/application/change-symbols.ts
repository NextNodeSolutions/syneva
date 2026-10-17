// Every changed block named by the code it sits in: both sides of each outlined file read in one batch (the revisions the diff was taken over), parsed once per content (side-outlines.ts), each block cut at the declarations it crosses (change-split.ts) and mapped to its enclosing declaration.
import path from 'node:path'

import { changeKey } from '../domain/change-blocks.js'
import {
	blockDeclarations,
	changeTrivia,
	outlineLanguage,
} from '../domain/outline.js'
import { symbolLinks } from '../domain/symbol-links.js'
import { symbolOnSides } from '../domain/symbol-sides.js'

import { splitChanges } from './change-split.js'
import { mapContentReads } from './content-reads.js'
import { readFileContents } from './contents.js'
import { needsRemovedSide, removedSpan, withTrivia } from './replaced-trivia.js'
import { outlineFor, sideKey } from './side-outlines.js'

import type { ChangeTrivia } from '../domain/outline.js'
import type { ChangeState, ReviewFile, ReviewState } from '../domain/review.js'
import type { LinkSource } from '../domain/symbol-links.js'
import type { GitPort } from './ports.js'
import type { Side, SideTexts } from './side-outlines.js'

// Both sides of every outlined file a block changes: a block is named on its own side, and its declaration is looked up on the other side too, so the desk can read the brick before and after (a side that does not exist, an added or deleted file's, reads as missing). Oversized files stay unnamed: parsing them would cost what their summary card saves.
function wantedSides(state: ReviewState): Map<ReviewFile, Set<Side>> {
	const outlined = new Map(
		state.files
			.filter(file => !file.oversized && outlineLanguage(file.path))
			.map(file => [file.path, file]),
	)
	const wanted = new Map<ReviewFile, Set<Side>>()
	for (const change of state.changes) {
		const file = outlined.get(change.path)
		if (file && !wanted.has(file))
			wanted.set(file, new Set<Side>(['additions', 'deletions']))
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

type Named = { change: ChangeState; link?: LinkSource | undefined }

function namedChange(
	change: ChangeState,
	texts: SideTexts,
	git: GitPort,
): Named {
	const outline = outlineFor(change.side, change.path, texts, git)
	if (!outline) return { change }
	const span = {
		lineNumber: change.lineNumber,
		endLine: change.endLine ?? change.lineNumber,
	}
	const declarations = blockDeclarations(outline, span)
	const [declaration] = declarations
	const otherSide: Side =
		change.side === 'additions' ? 'deletions' : 'additions'
	const symbol = declaration
		? symbolOnSides(
				declaration,
				change.side,
				outlineFor(otherSide, change.path, texts, git),
			)
		: undefined
	const named = withTrivia({ ...change, symbol }, changeTrivia(outline, span))
	if (!declaration) return { change: named }
	return {
		change: named,
		link: {
			key: changeKey(change),
			path: change.path,
			symbol: declaration.name,
			declared: declarations.map(entry => entry.name),
			uses: [...new Set(declarations.flatMap(entry => entry.uses))],
			imports: outline.imports,
		},
	}
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

async function oldSidesFor(
	state: ReviewState,
	pending: readonly ChangeState[],
	texts: SideTexts,
	git: GitPort,
): Promise<SideTexts | undefined> {
	if (!pending.length) return undefined
	if (state.mode === 'file') return texts
	return await removedSides(state, pending, git)
}

// The blocks cut at their declarations, named, then linked: each block learns which other changed declarations its own declaration references.
export async function nameChanges(
	state: ReviewState,
	git: GitPort,
): Promise<ReviewState> {
	if (!state.changes.length) return state
	const texts =
		state.mode === 'file'
			? await readFileDeskSides(state, git)
			: await readSides(state, wantedSides(state), git)
	const named = splitChanges(state, texts, git).map(change =>
		namedChange(change, texts, git),
	)
	const links = symbolLinks(named.flatMap(entry => entry.link ?? []))
	const changes = named.map(entry => entry.change)
	const oldTexts = await oldSidesFor(
		state,
		changes.filter(needsRemovedSide),
		texts,
		git,
	)
	return {
		...state,
		changes: changes.map(change => {
			const settled =
				oldTexts && needsRemovedSide(change)
					? withTrivia(
							change,
							replacedTrivia(state, change, oldTexts, git),
						)
					: change
			return withLinks(settled, links.get(changeKey(change)) ?? [])
		}),
	}
}

function withLinks(change: ChangeState, links: string[]): ChangeState {
	return links.length ? { ...change, links } : change
}
