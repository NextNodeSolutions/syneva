import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { fieldParts } from './field-parts.styles'

import type { ReactElement, ReactNode } from 'react'

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
