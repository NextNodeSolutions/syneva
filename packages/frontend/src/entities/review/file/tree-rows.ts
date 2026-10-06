import type { FileReviewState } from '../model'

export type DirRow = {
	kind: 'dir'
	key: string
	depth: number
	name: string
	full: string
	dirCaret: string
	open: boolean
	changed: boolean
}

export type FileRow = {
	kind: 'file' | 'test'
	key: string
	depth: number
	name: string
	changed: boolean
	path: string
	fileIndex: number | undefined
	testToggle: boolean
	testKey: string
	testCaret: string
	changeType: 'new' | 'modified' | 'deleted' | null
	state: FileReviewState | null
	movedFrom?: string
}

export type FoldGroupRow = {
	kind: 'foldgrp'
	key: string
	count: number
	open: boolean
	caret: string
	group: 'renamed' | 'reviewed'
}

export type TreeRow = DirRow | FileRow | FoldGroupRow

export type TreeFile = {
	name: string
	index: number | undefined
	changed: boolean
	path: string
	tests: TreeFile[]
}
export type TreeNode = {
	name: string
	full: string
	dirs: Map<string, TreeNode>
	files: TreeFile[]
	changed: boolean
}
