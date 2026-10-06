import type { FlowIndex } from '../change/flow-index'
import type { ReviewState } from '../model'
import type { TreeBuild } from './tree'
import type { FileRow, TreeFile, TreeNode } from './tree-rows'

type ReviewFile = ReviewState['files'][number]

export const CARET_OPEN = '▾'
export const CARET_CLOSED = '▸'

const TEST_FILE_NAME = /^(?<base>.*)\.(?:test|spec)(?<extension>\.[^.]+)$/

function testParentName(fileName: string): string | null {
	const match = TEST_FILE_NAME.exec(fileName)
	const { groups } = match ?? {}
	if (!groups) return null
	return `${groups.base}${groups.extension}`
}

export function emptyNode(name: string, full: string): TreeNode {
	return { name, full, dirs: new Map(), files: [], changed: false }
}

export function insertFile(
	root: TreeNode,
	path: string,
	index: number | undefined,
): void {
	const parts = path.split('/').filter(Boolean)
	const stack = [root]
	let node = root
	for (const part of parts.slice(0, -1)) {
		const existing = node.dirs.get(part)
		const dir =
			existing ??
			emptyNode(part, node.full ? `${node.full}/${part}` : part)
		if (!existing) node.dirs.set(part, dir)
		node = dir
		stack.push(dir)
	}
	const isChanged = typeof index === 'number'
	if (isChanged) {
		for (const ancestor of stack) ancestor.changed = true
	}
	node.files.push({
		name: parts.at(-1) ?? path,
		index,
		changed: isChanged,
		path,
		tests: [],
	})
}

// A changed test keeps its parent flagged until the reviewer stages it (staging is the sign-off), so the folder stays "changed" while the test still needs attention.
export function foldTestFiles(
	node: TreeNode,
	stagedFiles: string[],
): TreeFile[] {
	const byName = new Map(node.files.map(f => [f.name, f]))
	const folded = new Set<TreeFile>()
	for (const file of node.files) {
		const parentName = testParentName(file.name)
		const parent = parentName ? byName.get(parentName) : undefined
		if (!parent) continue
		parent.tests.push(file)
		if (file.changed && !stagedFiles.includes(file.path))
			parent.changed = true
		folded.add(file)
	}
	for (const child of node.dirs.values())
		child.files = foldTestFiles(child, stagedFiles)
	return node.files.filter(f => !folded.has(f))
}

// Reads the lean builder's `changeKind` stamp instead of the embedded contents; a rename shows as "modified" (its icon).
function changeType(
	file: TreeFile,
	files: ReviewFile[],
): FileRow['changeType'] {
	const { index } = file
	if (typeof index !== 'number') return null
	const changed = files.at(index)
	if (!changed) return null
	if (changed.changeKind === 'added') return 'new'
	if (changed.changeKind === 'deleted') return 'deleted'
	return 'modified'
}

function isDecided(ix: FlowIndex, path: string): boolean {
	const decisions = ix.changesByPath.get(path) ?? []
	return decisions.length > 0 && decisions.every(c => c.status !== 'pending')
}

function isQuiet(ix: FlowIndex, path: string): boolean {
	const comments = ix.commentsByPath.get(path)
	return !ix.finished(path) && !isDecided(ix, path) && !comments?.length
}

// A changed test stays revealed for its whole lifecycle (like any changed file) so it doesn't vanish from the tree the moment it's approved; only unchanged sibling tests stay folded.
function hasChangedTest(file: TreeFile): boolean {
	return file.tests.some(test => test.changed)
}

function hasPendingChangedTest(ix: FlowIndex, file: TreeFile): boolean {
	return file.tests.some(
		test => test.changed && ix.reviewState(test.path) === 'pending',
	)
}

export type FileSignals = {
	state: FileRow['state']
	changeType: FileRow['changeType']
	isChangedish: boolean
	showsTestToggle: boolean
	areTestsOpen: boolean
}

export function fileSignals(
	build: TreeBuild,
	file: TreeFile,
	isTest: boolean,
): FileSignals {
	const { ix } = build
	const state = file.changed ? ix.reviewState(file.path) : null
	const isChangedish =
		(file.changed && state === 'pending') || hasPendingChangedTest(ix, file)
	const ownsTests = !isTest && file.tests.length > 0
	return {
		state,
		changeType: isChangedish ? changeType(file, build.files) : null,
		isChangedish,
		showsTestToggle: ownsTests && isQuiet(ix, file.path),
		areTestsOpen:
			ownsTests &&
			(build.expandedDirs.has(`tests:${file.path}`) ||
				hasChangedTest(file)),
	}
}

export function stateBadge(signals: FileSignals): FileRow['state'] {
	if (signals.showsTestToggle) return null
	return signals.state
}
