import { figureTop } from '@shared/ui/figure-top.styles'
import * as stylex from '@stylexjs/stylex'
import { dot } from '@syneva/design-system/controls.styles'

import { launchBar } from './launch-bar.styles'

import type { ReactElement } from 'react'

// The sheet's title bar: petrol while the list is open to this visitor, green once they are on it.
export function LaunchBar({ isJoined }: { isJoined: boolean }): ReactElement {
	return (
		<div {...stylex.props(figureTop.bar, launchBar.bar)}>
			<span {...stylex.props(launchBar.status)}>
				<span
					{...stylex.props(
						dot.base,
						isJoined ? dot.green : dot.petrol,
						launchBar.square,
					)}
					aria-hidden="true"
				/>
				{isJoined ? 'On the list' : 'Launch list'}
			</span>
			<span {...stylex.props(figureTop.aside)}>
				{isJoined ? 'See you at launch' : 'One email · launch day'}
			</span>
		</div>
	)
}
