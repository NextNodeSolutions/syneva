import { Glyph } from '@shared/ui/Glyph'
import * as stylex from '@stylexjs/stylex'

import { treeRow } from './tree-row.styles'

import type { ReactElement } from 'react'
import type { TreeRow } from '../model/file-tree'

type TreeDirRowProps = {
	row: Extract<TreeRow, { kind: 'dir' }>
	onToggle: (path: string) => void
}

export function TreeDirRow({ row, onToggle }: TreeDirRowProps): ReactElement {
	return (
		<button
			type="button"
			aria-expanded={row.isOpen}
			onClick={() => onToggle(row.path)}
			{...stylex.props(treeRow.row, treeRow.indent(row.depth))}
		>
			<Glyph
				name="chevron"
				css={[treeRow.chevron, row.isOpen && treeRow.chevronOpen]}
			/>
			<Glyph name="folder" css={treeRow.folder} />
			<span {...stylex.props(treeRow.name)}>{row.name}</span>
		</button>
	)
}
