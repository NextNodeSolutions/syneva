import * as stylex from '@stylexjs/stylex'

import { ChangeGlyph } from './ChangeGlyph'
import { treeRow } from './tree-row.styles'

import type { ReactElement } from 'react'
import type { TreeRow } from '../model/file-tree'

type TreeFileRowProps = {
	row: Extract<TreeRow, { kind: 'file' }>
	isActive: boolean
	onOpen: (path: string) => void
}

// The keys can open a file far down a long tree, so the active row scrolls itself into view.
function revealRow(node: HTMLButtonElement | null): void {
	node?.scrollIntoView({ block: 'nearest' })
}

export function TreeFileRow({
	row,
	isActive,
	onOpen,
}: TreeFileRowProps): ReactElement {
	return (
		<button
			type="button"
			ref={isActive ? revealRow : undefined}
			title={row.path}
			aria-current={isActive ? 'true' : undefined}
			onClick={() => onOpen(row.path)}
			{...stylex.props(
				treeRow.row,
				treeRow.indent(row.depth),
				isActive && treeRow.active,
			)}
		>
			<span {...stylex.props(treeRow.markerSpace)} />
			<ChangeGlyph type={row.file.metadata.type} />
			<span {...stylex.props(treeRow.name)}>{row.name}</span>
		</button>
	)
}
