import { useState } from 'react'

import { WorkerPoolContextProvider } from '@pierre/diffs/react'
import * as stylex from '@stylexjs/stylex'

import { DIFF_WORKER_POOL } from '../lib/diff-worker-pool'
import { isAnyDirOpen } from '../model/desk-state'
import { listTreeRows } from '../model/file-tree'
import { TREE_WIDTH } from '../model/tree-width'

import { deskWorkspace } from './desk-workspace.styles'
import { FileView } from './FileView'
import { FoldButton } from './FoldButton'
import { TreeHead } from './TreeHead'
import { TreePanel } from './TreePanel'
import { TreeResizer } from './TreeResizer'
import { TreeRows } from './TreeRows'

import type { ReactElement } from 'react'
import type { DiffFile } from '../model/diff-files'
import type { FileTree } from '../model/file-tree'
import type { Desk } from '../model/use-desk'

type DeskWorkspaceProps = {
	tree: FileTree
	desk: Desk
	file: DiffFile
}

const HIGHLIGHTER_DEFAULTS = {}

export function DeskWorkspace({
	tree,
	desk,
	file,
}: DeskWorkspaceProps): ReactElement {
	const [treeWidth, setTreeWidth] = useState<number>(TREE_WIDTH.initial)
	const { state } = desk
	return (
		<div
			{...stylex.props(
				deskWorkspace.grid,
				deskWorkspace.treeWidth(`${treeWidth}px`),
			)}
		>
			<TreePanel
				isDrawerOpen={state.isTreeDrawerOpen}
				onDrawerClose={desk.toggleTreeDrawer}
			>
				<TreeHead>
					{tree.dirPaths.length > 0 && (
						<FoldButton
							isAnyDirOpen={isAnyDirOpen(state, tree.dirPaths)}
							onToggle={desk.toggleAllDirs}
						/>
					)}
				</TreeHead>
				<TreeRows
					rows={listTreeRows(tree.nodes, state.collapsedDirs)}
					activePath={file.path}
					onFileOpen={desk.openFile}
					onDirToggle={desk.toggleDir}
				/>
			</TreePanel>
			<TreeResizer width={treeWidth} onResize={setTreeWidth} />
			<WorkerPoolContextProvider
				poolOptions={DIFF_WORKER_POOL}
				highlighterOptions={HIGHLIGHTER_DEFAULTS}
			>
				<FileView
					file={file}
					diffStyle={state.diffStyle}
					onLayoutChoose={desk.chooseLayout}
				/>
			</WorkerPoolContextProvider>
		</div>
	)
}
