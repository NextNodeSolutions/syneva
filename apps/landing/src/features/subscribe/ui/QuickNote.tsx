import * as stylex from '@stylexjs/stylex'
import { dot } from '@syneva/design-system/controls.styles'

import { LIST_PROMISE } from '../model/list'

import { fieldText } from './field.styles'

import type { ReactElement } from 'react'
import type { Notice } from '../model/use-signup-form'

type QuickNoteProps = {
	id: string
	emailProblem: string | undefined
	notice: Notice | undefined
}

// The line under the hero's box, held open so the hero never shifts: what stopped the form, the send under way, or the list's promise.
export function QuickNote({
	id,
	emailProblem,
	notice,
}: QuickNoteProps): ReactElement {
	const refusal = notice?.tone === 'refused' ? notice.text : emailProblem
	const isRefused = Boolean(refusal)
	return (
		<p
			{...stylex.props(
				fieldText.status,
				isRefused && fieldText.statusRefused,
			)}
			id={id}
			role="status"
		>
			{isRefused && (
				<span {...stylex.props(dot.base, dot.red)} aria-hidden="true" />
			)}
			{refusal ?? notice?.text ?? LIST_PROMISE}
		</p>
	)
}
