import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { choiceField } from './choice-field.styles'

import type { ReactElement } from 'react'

export type Choice<T extends string> = {
	value: T
	title: string
	detail: string
	// This choice's radio takes a dialog's first focus (data-autofocus).
	isAutofocused?: boolean | undefined
}

type ChoiceTileProps<T extends string> = {
	choice: Choice<T>
	name: string
	isChosen: boolean
	onChoose: (choice: T) => void
}

export function ChoiceTile<T extends string>({
	choice,
	name,
	isChosen,
	onChoose,
}: ChoiceTileProps<T>): ReactElement {
	return (
		<label
			{...stylex.props(choiceField.tile, isChosen && choiceField.tileOn)}
		>
			<input
				{...stylex.props(focus.ring, choiceField.radio)}
				type="radio"
				name={name}
				value={choice.value}
				checked={isChosen}
				data-autofocus={choice.isAutofocused || undefined}
				onChange={() => onChoose(choice.value)}
			/>
			<span>
				<span
					{...stylex.props(
						choiceField.title,
						isChosen && choiceField.titleOn,
					)}
				>
					{choice.title}
				</span>
				<span {...stylex.props(choiceField.detail)}>
					{choice.detail}
				</span>
			</span>
		</label>
	)
}
