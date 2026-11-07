import * as stylex from '@stylexjs/stylex'
import { dot } from '@syneva/design-system/controls.styles'

import { LIST_PROMISE } from '../model/list'

import { fieldText } from './field.styles'

import type { ReactElement } from 'react'
import type { Notice } from '../model/use-signup-form'

// A dot leads the line when it speaks of this signup: red for what stopped it, petrol for word that it already went through today.
const MARK = { refused: dot.red, info: dot.petrol } as const

type QuickNoteProps = {
	id: string
	emailProblem: string | undefined
	notice: Notice | undefined
}

// The line under the hero's box, held open so the hero never shifts: what stopped the form, the send under way, word that the address already signed up today, or the list's promise.
export function QuickNote({
	id,
	emailProblem,
	notice,
}: QuickNoteProps): ReactElement {
	const refusal = notice?.tone === 'refused' ? notice.text : emailProblem
	const tone = refusal ? 'refused' : notice?.tone
	const mark = tone === 'refused' || tone === 'info' ? MARK[tone] : undefined
	return (
		<p
			{...stylex.props(
				fieldText.status,
				tone === 'refused' && fieldText.statusRefused,
			)}
			id={id}
			role="status"
		>
			{mark && (
				<span {...stylex.props(dot.base, mark)} aria-hidden="true" />
			)}
			{refusal ?? notice?.text ?? LIST_PROMISE}
		</p>
	)
}
