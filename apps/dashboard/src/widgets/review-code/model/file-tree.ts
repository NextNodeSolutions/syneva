import type { DiffFile } from './diff-files'

type TreeDir = { kind: 'dir'; path: string; name: string; children: TreeNode[] }
type TreeFile = { kind: 'file'; path: string; name: string; file: DiffFile }
type TreeNode = TreeDir | TreeFile

export type TreeRow =
	| {
			kind: 'dir'
			path: string
			name: string
			depth: number
			isOpen: boolean
	  }
	| {
			kind: 'file'
			path: string
			name: string
			depth: number
			file: DiffFile
	  }

// The changed files as the tree shows them: folders first, then files, each by name.
export type FileTree = {
	nodes: readonly TreeNode[]
	files: readonly DiffFile[]
	dirPaths: readonly string[]
}

type DirDraft = {
	path: string
	name: string
	dirs: Map<string, DirDraft>
	files: TreeFile[]
}

const SEPARATOR = '/'

export function buildFileTree(files: readonly DiffFile[]): FileTree {
	const root = emptyDir('', '')
	for (const file of files) placeFile(root, file)
	const nodes = sealDir(root)
	return {
		nodes,
		files: filesInOrder(nodes),
		dirPaths: dirPathsInOrder(nodes),
	}
}

export function listTreeRows(
	nodes: readonly TreeNode[],
	collapsedDirs: ReadonlySet<string>,
	depth = 0,
): TreeRow[] {
	return nodes.flatMap(node => nodeRows(node, collapsedDirs, depth))
}

export function ancestorPaths(path: string): string[] {
	const dirs = path.split(SEPARATOR).slice(0, -1)
	return dirs.map((_, index) => dirs.slice(0, index + 1).join(SEPARATOR))
}

function nodeRows(
	node: TreeNode,
	collapsedDirs: ReadonlySet<string>,
	depth: number,
): TreeRow[] {
	const { kind, path, name } = node
	if (kind === 'file') return [{ kind, path, name, depth, file: node.file }]
	const isOpen = !collapsedDirs.has(path)
	const row: TreeRow = { kind, path, name, depth, isOpen }
	if (!isOpen) return [row]
	return [row, ...listTreeRows(node.children, collapsedDirs, depth + 1)]
}

function emptyDir(path: string, name: string): DirDraft {
	return { path, name, dirs: new Map(), files: [] }
}

function placeFile(root: DirDraft, file: DiffFile): void {
	const segments = file.path.split(SEPARATOR)
	const parent = segments.slice(0, -1).reduce(childDir, root)
	const name = segments.at(-1) ?? file.path
	parent.files.push({ kind: 'file', path: file.path, name, file })
}

function childDir(parent: DirDraft, name: string): DirDraft {
	const known = parent.dirs.get(name)
	if (known) return known
	const path = parent.path ? `${parent.path}${SEPARATOR}${name}` : name
	const created = emptyDir(path, name)
	parent.dirs.set(name, created)
	return created
}

function sealDir(draft: DirDraft): TreeNode[] {
	const dirs = [...draft.dirs.values()].map((dir): TreeDir => ({
		kind: 'dir',
		path: dir.path,
		name: dir.name,
		children: sealDir(dir),
	}))
	return [...dirs.toSorted(byName), ...draft.files.toSorted(byName)]
}

function byName(first: { name: string }, second: { name: string }): number {
	return first.name.localeCompare(second.name, 'en')
}

function filesInOrder(nodes: readonly TreeNode[]): DiffFile[] {
	return nodes.flatMap(node =>
		node.kind === 'file' ? [node.file] : filesInOrder(node.children),
	)
}

function dirPathsInOrder(nodes: readonly TreeNode[]): string[] {
	return nodes.flatMap(node =>
		node.kind === 'dir'
			? [node.path, ...dirPathsInOrder(node.children)]
			: [],
	)
}
