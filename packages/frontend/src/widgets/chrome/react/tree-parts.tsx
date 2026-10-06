import { Icon } from '@shared/ui/icon'
import * as stylex from '@stylexjs/stylex'

import { glyph, row } from './sidebar.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

const INDENT_PX = 14
const BASE_PAD_PX = 8

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
