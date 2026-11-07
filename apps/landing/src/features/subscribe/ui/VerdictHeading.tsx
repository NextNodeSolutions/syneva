import * as stylex from '@stylexjs/stylex'
import { textButton, textLink } from '@syneva/design-system/inline.styles'

import { useFocusOnMount } from '../model/use-focus-on-mount'

import { launchVerdict } from './launch-verdict.styles'

import type { ReactElement } from 'react'

type VerdictHeadingProps = {
	name: string
	hasFocus: boolean
	onLeave: () => void
}

// The verdict in words, and the way back to the form for another address.
export function VerdictHeading({
	name,
	hasFocus,
	onLeave,
}: VerdictHeadingProps): ReactElement {
	const focusOnMount = useFocusOnMount<HTMLHeadingElement>(hasFocus)
	return (
		<div {...stylex.props(launchVerdict.top)}>
			<h3
				ref={focusOnMount}
				{...stylex.props(launchVerdict.heading)}
				tabIndex={-1}
			>
				{name ? `You’re on the list, ${name}.` : 'You’re on the list.'}
			</h3>
			<p {...stylex.props(launchVerdict.again)}>
				Not you?{' '}
				<button
					{...stylex.props(
						textLink.base,
						textLink.small,
						textButton.base,
					)}
					type="button"
					onClick={onLeave}
				>
					Use another address
				</button>
			</p>
		</div>
	)
}
