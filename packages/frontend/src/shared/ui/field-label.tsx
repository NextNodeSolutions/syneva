import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { fieldParts } from './field-parts.styles'

import type { ReactElement, ReactNode } from 'react'

// A field's label row. The aside ("optional") sits inside the label, so it is
// part of the field's accessible name, not a stray word beside it.
export function FieldLabel({
	htmlFor,
	aside,
	children,
}: {
	htmlFor: string
	aside?: string | undefined
	children: ReactNode
}): ReactElement {
	return (
		<label htmlFor={htmlFor} {...stylex.props(fieldParts.labelRow)}>
			<span {...stylex.props(fieldParts.label)}>{children}</span>
			{aside && <span {...stylex.props(caption.base)}>{aside}</span>}
		</label>
	)
}
