import * as stylex from '@stylexjs/stylex'

import { fieldParts } from './field-parts.styles'
import { LiveDot } from './live-dot'

import type { ReactElement } from 'react'

export function FieldNote({
	id,
	hint,
	error,
}: {
	id: string
	hint?: string | undefined
	error?: string | undefined
}): ReactElement | null {
	if (error)
		return (
			<p id={id} {...stylex.props(fieldParts.error)}>
				<LiveDot tone="red" />
				{error}
			</p>
		)
	if (hint)
		return (
			<p id={id} {...stylex.props(fieldParts.hint)}>
				{hint}
			</p>
		)
	return null
}
