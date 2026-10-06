import * as stylex from '@stylexjs/stylex'

import { launchForm } from './launch-form.styles'
import { SendButton } from './SendButton'

import type { ReactElement } from 'react'
import type { Notice } from '../model/use-signup-form'

// The send and its status line; the list's terms follow the island, in Astro (LaunchTerms.astro).
export function LaunchFoot({
	notice,
	isSending,
}: {
	notice: Notice | undefined
	isSending: boolean
}): ReactElement {
	return (
		<div {...stylex.props(launchForm.foot)}>
			<SendButton isSending={isSending} css={launchForm.send}>
				Notify me at launch
			</SendButton>
			<p
				{...stylex.props(
					launchForm.status,
					notice?.tone === 'refused' && launchForm.statusRefused,
				)}
				role="status"
			>
				{notice?.text}
			</p>
		</div>
	)
}
