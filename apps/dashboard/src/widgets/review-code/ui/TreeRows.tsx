import * as stylex from '@stylexjs/stylex'

import { treeRows } from './tree-rows.styles'
import { TreeDirRow } from './TreeDirRow'
import { TreeFileRow } from './TreeFileRow'

import type { ReactElement } from 'react'
import type { TreeRow } from '../model/file-tree'

type TreeRowsProps = {
	rows: readonly TreeRow[]
	activePath: string
	onFileOpen: (path: string) => void
	onDirToggle: (path: string) => void
}

export function TreeRows({
	rows,
	activePath,
	onFileOpen,
	onDirToggle,
}: TreeRowsProps): ReactElement {
	return (
		<ul {...stylex.props(treeRows.list)}>
			{rows.map(row => (
				<li key={`${row.kind}:${row.path}`}>
					{row.kind === 'dir' ? (
						<TreeDirRow row={row} onToggle={onDirToggle} />
					) : (
						<TreeFileRow
							row={row}
							isActive={row.path === activePath}
							onOpen={onFileOpen}
						/>
					)}
				</li>
			))}
		</ul>
	)
}
