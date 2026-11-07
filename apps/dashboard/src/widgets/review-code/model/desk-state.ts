import { ancestorPaths } from './file-tree'

import type { DiffStyle } from './diff-files'
import type { FileTree } from './file-tree'

export type DeskState = {
	activePath: string
	collapsedDirs: ReadonlySet<string>
	diffStyle: DiffStyle
	isTreeDrawerOpen: boolean
}

export type DeskAction =
	| { type: 'file_opened'; path: string }
	| { type: 'dir_toggled'; path: string }
	| { type: 'all_dirs_toggled'; dirPaths: readonly string[] }
	| { type: 'layout_chosen'; diffStyle: DiffStyle }
	| { type: 'tree_drawer_toggled' }

export function initialDeskState(tree: FileTree): DeskState {
	return {
		activePath: tree.files[0]?.path ?? '',
		collapsedDirs: new Set(),
		diffStyle: 'split',
		isTreeDrawerOpen: false,
	}
}

export function isAnyDirOpen(
	state: DeskState,
	dirPaths: readonly string[],
): boolean {
	return dirPaths.some(path => !state.collapsedDirs.has(path))
}

export function deskReducer(state: DeskState, action: DeskAction): DeskState {
	switch (action.type) {
		case 'file_opened':
			return {
				...state,
				activePath: action.path,
				collapsedDirs: withoutAll(
					state.collapsedDirs,
					ancestorPaths(action.path),
				),
				isTreeDrawerOpen: false,
			}
		case 'dir_toggled':
			return {
				...state,
				collapsedDirs: toggled(state.collapsedDirs, action.path),
			}
		case 'all_dirs_toggled':
			return {
				...state,
				collapsedDirs: isAnyDirOpen(state, action.dirPaths)
					? new Set(action.dirPaths)
					: new Set(),
			}
		case 'layout_chosen':
			return { ...state, diffStyle: action.diffStyle }
		case 'tree_drawer_toggled':
			return { ...state, isTreeDrawerOpen: !state.isTreeDrawerOpen }
		default:
			throw new Error(
				`Unknown desk action: ${String(action satisfies never)}`,
			)
	}
}

function toggled(paths: ReadonlySet<string>, path: string): Set<string> {
	const next = new Set(paths)
	if (next.has(path)) next.delete(path)
	else next.add(path)
	return next
}

function withoutAll(
	paths: ReadonlySet<string>,
	removed: readonly string[],
): Set<string> {
	return new Set([...paths].filter(path => !removed.includes(path)))
}
