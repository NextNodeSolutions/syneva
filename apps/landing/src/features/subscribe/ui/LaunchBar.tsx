import * as stylex from '@stylexjs/stylex'

import { launchBar } from './launch-bar.styles'

import type { ReactElement } from 'react'

// The sheet's title bar: petrol while the list is open to this visitor, green once they are on it.
export function LaunchBar({ isJoined }: { isJoined: boolean }): ReactElement {
	return (
		<div {...stylex.props(launchBar.bar)}>
			<span {...stylex.props(launchBar.status)}>
				<span
					{...stylex.props(
						launchBar.square,
						isJoined && launchBar.squareJoined,
					)}
					aria-hidden="true"
				/>
				{isJoined ? 'On the list' : 'Launch list'}
			</span>
			<span {...stylex.props(launchBar.aside)}>
				{isJoined ? 'See you at launch' : 'One email · launch day'}
			</span>
		</div>
	)
}
