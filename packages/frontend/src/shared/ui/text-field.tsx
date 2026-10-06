import { useId } from 'react'

import * as stylex from '@stylexjs/stylex'
import { field } from '@syneva/design-system/controls.styles'

import { FieldLabel } from './field-label'
import { FieldNote } from './field-note'
import { fieldParts } from './field-parts.styles'

import type { ComponentPropsWithRef, ReactElement } from 'react'
import type { FieldText } from './field-text'

type TextFieldProps = FieldText & {
	mono?: boolean | undefined
} & Omit<ComponentPropsWithRef<'input'>, 'className' | 'style' | 'id'>

export function TextField({
	label,
	aside,
	hint,
	error,
	mono,
	...input
}: TextFieldProps): ReactElement {
	const id = useId()
	const noteId = `${id}-note`
	const isInvalid = Boolean(error)
	return (
		<div>
			<FieldLabel htmlFor={id} aside={aside}>
				{label}
			</FieldLabel>
			<input
				spellCheck={false}
				autoCapitalize="none"
				autoComplete="off"
				{...input}
				{...stylex.props(
					field.base,
					mono === true && field.mono,
					isInvalid && field.invalid,
					fieldParts.control,
				)}
				id={id}
				aria-invalid={isInvalid || undefined}
				aria-describedby={error || hint ? noteId : undefined}
			/>
			<FieldNote id={noteId} hint={hint} error={error} />
		</div>
	)
}
