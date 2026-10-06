import { useCallback } from 'react'

import * as stylex from '@stylexjs/stylex'
import { textLink } from '@syneva/design-system/inline.styles'

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
	const focusOnMount = useCallback(
		(heading: HTMLHeadingElement | null) => {
			if (hasFocus) heading?.focus()
		},
		[hasFocus],
	)
	return (
		<div {...stylex.props(launchVerdict.top)}>
			<h3
				ref={focusOnMount}
				{...stylex.props(launchVerdict.heading)}
				tabIndex={-1}
			>
				{name
					? `You\u2019re on the list, ${name}.`
					: 'You\u2019re on the list.'}
			</h3>
			<p {...stylex.props(launchVerdict.again)}>
				Not you?{' '}
				<button
					{...stylex.props(
						textLink.base,
						textLink.small,
						launchVerdict.reset,
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
