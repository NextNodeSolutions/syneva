import { deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../../chrome/context'

import { pane } from './guide-pane.styles'

import type { ReactElement } from 'react'

// The head's one move, and only once there is somewhere to go: back to where the reviewer was before following a reference. Every other move lives in the position strip.
export function HeadNav({ canGoBack }: { canGoBack: boolean }): ReactElement {
	const { S } = chromeCtx()
	if (!canGoBack) return <></>
	return (
		<span {...stylex.props(pane.navs)}>
			<button
				{...stylex.props(
					press.control,
					control.base,
					control.quiet,
					deskControl.mini,
					tip.host,
					tip.end,
				)}
				data-tip="Back to where you were (b)"
				aria-label="Back"
				onClick={() => S.guideBack?.()}
			>
				<Icon id="gly-arrow-left" /> Back <Kbd keys="b" />
			</button>
		</span>
	)
}
