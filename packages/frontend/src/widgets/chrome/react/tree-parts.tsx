import { Icon } from '@shared/ui/icon'
import * as stylex from '@stylexjs/stylex'

import { glyph, row } from './sidebar.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// The pieces the tree and the walkthrough rows share: the indent, the fold
// chevron and the rename arrow.

// The px a tree level indents and the row's own left padding (row.base); the rails in
// row.base's background repeat at the same step.
const INDENT_PX = 14
const BASE_PAD_PX = 8

// A row's indent and nesting rails at its depth (none at the root).
export function indentStyle(depth: number): Style {
	if (!depth) return null
	return row.indent(
		`${BASE_PAD_PX + depth * INDENT_PX}px`,
		`${depth * INDENT_PX}px 100%`,
	)
}

export function MovedFrom({ from }: { from: string }): ReactElement {
	return (
		<span
			{...stylex.props(row.movedFrom)}
			title={`moved from ${from}`}
		>{`← ${from}`}</span>
	)
}

export function Chevron({ open }: { open: boolean }): ReactElement {
	return (
		<Icon
			id="gly-chevron"
			css={[glyph.chevron, open && glyph.chevronOpen]}
		/>
	)
}
