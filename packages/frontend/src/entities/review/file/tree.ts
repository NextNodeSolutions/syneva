import { flowIndex } from '../changes'

import { movedFrom, isRenamedGroupExpanded } from './renames'
import { isReviewedGroupExpanded, pushReviewedGroup } from './reviewed'
import {
	CARET_CLOSED,
	CARET_OPEN,
	emptyNode,
	fileSignals,
	foldTestFiles,
	insertFile,
	stateBadge,
} from './tree-structure'

import type { FlowIndex } from '../change/flow-index'
import type { ReviewState } from '../model'
import type { FileRow, TreeFile, TreeNode, TreeRow } from './tree-rows'

export type TreeInputs = {
	state: ReviewState
	projectFiles: string[]
	showUnchanged: boolean
	hideReviewed: boolean
	expandedDirs: Set<string>
	collapsedDirs: Set<string>
	foldExpanded: Set<string>
}

type ReviewFile = ReviewState['files'][number]

export type TreeBuild = {
	ix: FlowIndex
	rows: TreeRow[]
	files: ReviewFile[]
	changedIndex: Map<string, number>
	expandedDirs: Set<string>
	collapsedDirs: Set<string>
	stagedFiles: string[]
	foldExpanded: Set<string>
}

function dirPaths(paths: Iterable<string>): string[] {
	const dirs = new Set<string>()
	for (const path of paths) addDirSegments(dirs, path)
	return [...dirs]
}

function addDirSegments(dirs: Set<string>, path: string): void {
	const parts = path.split('/').filter(Boolean)
	let full = ''
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]
		if (!part) continue
		full = full ? `${full}/${part}` : part
		dirs.add(full)
	}
}

export function allDirPaths(inputs: TreeInputs): string[] {
	const changedPaths = inputs.state.files.map(f => f.path)
	if (!inputs.showUnchanged || !inputs.projectFiles.length)
		return dirPaths(changedPaths)
	return dirPaths([...new Set([...inputs.projectFiles, ...changedPaths])])
}

export function touchedDirPaths(state: ReviewState): string[] {
	return dirPaths([
		...state.files.map(f => f.path),
		...state.comments.map(c => c.path),
	])
}

function fileRow(
	build: TreeBuild,
	file: TreeFile,
	depth: number,
	isTest: boolean,
): void {
	const signals = fileSignals(build, file, isTest)
	// The "active" highlight is deliberately NOT part of the row model: deriving it here read
	// S.fileIndex/S.preview/S.overviewOpen, making EVERY file switch a dependency-triggered rebuild
	// of the whole row list (1,600+ rows re-bound to move one highlight - the dominant per-switch
	// cost on big desks); the sidebar derives it at render time.
	build.rows.push({
		key: (isTest ? 'test:' : 'file:') + file.path,
		kind: isTest ? 'test' : 'file',
		depth,
		name: file.name,
		changed: signals.isChangedish,
		path: file.path,
		fileIndex: file.index,
		testToggle: signals.showsTestToggle,
		testKey: `tests:${file.path}`,
		testCaret: signals.areTestsOpen ? CARET_OPEN : CARET_CLOSED,
		changeType: signals.changeType,
		state: stateBadge(signals),
	})
	if (!signals.areTestsOpen) return
	file.tests.sort(
		(a, b) =>
			Number(b.changed) - Number(a.changed) ||
			a.name.localeCompare(b.name),
	)
	for (const test of file.tests) fileRow(build, test, depth + 1, true)
}

function walk(build: TreeBuild, node: TreeNode, depth: number): void {
	const dirs = [...node.dirs.values()]
	dirs.sort((a, b) => a.name.localeCompare(b.name))
	for (const dir of dirs) {
		const isOpen = dir.changed
			? !build.collapsedDirs.has(dir.full)
			: build.expandedDirs.has(dir.full)
		build.rows.push({
			key: `dir:${dir.full}`,
			kind: 'dir',
			depth,
			name: dir.name,
			full: dir.full,
			dirCaret: isOpen ? CARET_OPEN : CARET_CLOSED,
			open: isOpen,
			changed: dir.changed,
		})
		if (isOpen) walk(build, dir, depth + 1)
	}
	node.files.sort((a, b) => a.name.localeCompare(b.name))
	for (const file of node.files) fileRow(build, file, depth, false)
}

function renamedFileRow(build: TreeBuild, path: string): FileRow {
	const movedFromPath = movedFrom(build.files, path)
	return {
		key: `file:${path}`,
		kind: 'file',
		depth: 1,
		name: path.split('/').pop() ?? path,
		changed: false,
		path,
		fileIndex: build.changedIndex.get(path),
		testToggle: false,
		testKey: '',
		testCaret: CARET_CLOSED,
		changeType: null,
		state: null,
		movedFrom: movedFromPath,
	}
}

function appendRenamedGroup(build: TreeBuild, renamedPaths: string[]): void {
	if (!renamedPaths.length) return
	const isOpen = isRenamedGroupExpanded(build.foldExpanded)
	build.rows.push({
		kind: 'foldgrp',
		key: 'group:renamed',
		count: renamedPaths.length,
		open: isOpen,
		caret: isOpen ? CARET_OPEN : CARET_CLOSED,
		group: 'renamed',
	})
	if (!isOpen) return
	const ordered = [...renamedPaths]
	ordered.sort((a, b) => a.localeCompare(b))
	for (const path of ordered) build.rows.push(renamedFileRow(build, path))
}

export function treeRows(inputs: TreeInputs): TreeRow[] {
	const { state } = inputs
	const ix = flowIndex(state, { distill: inputs.hideReviewed })
	const changedPaths = state.files.map(f => f.path)
	const changedIndex = new Map(state.files.map((f, i) => [f.path, i]))
	const renamedPaths = changedPaths.filter(path => ix.outOfFlow.has(path))
	const renamedSet = new Set(renamedPaths)
	const reviewed = inputs.hideReviewed
		? changedPaths.filter(
				path => !renamedSet.has(path) && ix.distilled.has(path),
			)
		: []
	const reviewedSet = new Set(reviewed)
	// A reviewed file must always appear even if it isn't in the project listing (a new/untracked
	// file, or a stale listing): union the listing with the changed files when showing unchanged,
	// otherwise just the changed files; folded files are held back.
	const listed =
		inputs.showUnchanged && inputs.projectFiles.length
			? [...new Set([...inputs.projectFiles, ...changedPaths])]
			: changedPaths
	const build: TreeBuild = {
		ix,
		rows: [],
		files: state.files,
		changedIndex,
		expandedDirs: inputs.expandedDirs,
		collapsedDirs: inputs.collapsedDirs,
		stagedFiles: state.stagedFiles,
		foldExpanded: inputs.foldExpanded,
	}
	const root = emptyNode('', '')
	for (const path of listed) {
		if (renamedSet.has(path) || reviewedSet.has(path)) continue
		insertFile(root, path, changedIndex.get(path))
	}
	root.files = foldTestFiles(root, state.stagedFiles)
	walk(build, root, 0)
	appendRenamedGroup(build, renamedPaths)
	pushReviewedGroup(
		build.rows,
		reviewed,
		isReviewedGroupExpanded(inputs.foldExpanded),
		path => changedIndex.get(path),
	)
	return build.rows
}
