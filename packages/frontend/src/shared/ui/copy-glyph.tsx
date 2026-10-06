import * as stylex from '@stylexjs/stylex'

import { copyGlyph } from './copy-glyph.styles'

import type { ReactElement } from 'react'

export function CopyGlyph({ isCopied }: { isCopied: boolean }): ReactElement {
	return (
		<svg
			{...stylex.props(isCopied ? copyGlyph.check : copyGlyph.sheets)}
			viewBox="0 0 20 20"
			aria-hidden="true"
		>
			<path
				d={isCopied ? 'm4 11 5 5 8-11' : 'M7 7h9v10H7ZM4 13H2V2h10v2'}
			/>
		</svg>
	)
}
