import { useReducer } from 'react'

import { deskReducer, initialDeskState } from './desk-state'

import type { DeskCommand } from './desk-keys'
import type { DeskState } from './desk-state'
import type { DiffFile, DiffStyle } from './diff-files'
import type { FileTree } from './file-tree'

type FileStep = 1 | -1

export type Desk = {
	state: DeskState
	activeFile: DiffFile | undefined
	openFile: (path: string) => void
	toggleDir: (path: string) => void
	toggleAllDirs: () => void
	chooseLayout: (diffStyle: DiffStyle) => void
	toggleTreeDrawer: () => void
	run: (command: DeskCommand) => void
}

const NEXT_LAYOUT: Readonly<Record<DiffStyle, DiffStyle>> = {
	split: 'unified',
	unified: 'split',
}

export function useDesk(tree: FileTree): Desk {
	const [state, dispatch] = useReducer(deskReducer, tree, initialDeskState)
	// A refetch can drop the open file: the first one stands in for it.
	const activeFile =
		tree.files.find(file => file.path === state.activePath) ?? tree.files[0]
	const openFile = (path: string): void =>
		dispatch({ type: 'file_opened', path })
	const chooseLayout = (diffStyle: DiffStyle): void =>
		dispatch({ type: 'layout_chosen', diffStyle })
	const stepFile = (step: FileStep): void => {
		const index = tree.files.findIndex(file => file === activeFile)
		const next = tree.files[index + step]
		if (next) openFile(next.path)
	}
	const commands: Readonly<Record<DeskCommand, () => void>> = {
		next_file: () => stepFile(1),
		previous_file: () => stepFile(-1),
		switch_layout: () => chooseLayout(NEXT_LAYOUT[state.diffStyle]),
	}
	return {
		state,
		activeFile,
		openFile,
		toggleDir: path => dispatch({ type: 'dir_toggled', path }),
		toggleAllDirs: () =>
			dispatch({ type: 'all_dirs_toggled', dirPaths: tree.dirPaths }),
		chooseLayout,
		toggleTreeDrawer: () => dispatch({ type: 'tree_drawer_toggled' }),
		run: command => commands[command](),
	}
}
