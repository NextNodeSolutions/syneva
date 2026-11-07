import * as stylex from '@stylexjs/stylex'

import { glyph } from './glyph.styles'
import { GLYPH_VIEW_BOX, GLYPHS } from './glyphs'

import type { StyleXStyles } from '@stylexjs/stylex'
import type { ReactElement } from 'react'
import type { GlyphName } from './glyphs'

type GlyphProps = {
	name: GlyphName
	label?: string
	css?: StyleXStyles
}

export function Glyph({ name, label, css }: GlyphProps): ReactElement {
	return (
		<svg
			{...stylex.props(glyph.base, css)}
			viewBox={GLYPH_VIEW_BOX}
			role={label ? 'img' : undefined}
			aria-hidden={!label}
		>
			{label && <title>{label}</title>}
			<path d={GLYPHS[name]} />
		</svg>
	)
}
