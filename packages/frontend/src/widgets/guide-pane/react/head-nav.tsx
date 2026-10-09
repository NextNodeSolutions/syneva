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

const square = [
	press.control,
	control.base,
	control.quiet,
	deskControl.mini,
	tip.host,
]

// The pane's moves, the same on every head: back to where the reviewer was, the neighbouring domains, hiding the pane.
export function HeadNav({ canGoBack }: { canGoBack: boolean }): ReactElement {
	const { S } = chromeCtx()
	return (
		<span {...stylex.props(pane.navs)}>
			<button
				{...stylex.props(square)}
				disabled={!canGoBack}
				data-tip="Back to where you were (b)"
				aria-label="Back"
				onClick={() => S.guideBack?.()}
			>
				<Icon id="gly-arrow-left" /> Back <Kbd keys="b" />
			</button>
			<button
				{...stylex.props(square)}
				data-tip="Previous domain (⇧D)"
				aria-label="Previous domain"
				onClick={() => S.stepDomain?.(-1)}
			>
				<Kbd keys="⇧D" />
			</button>
			<button
				{...stylex.props(square)}
				data-tip="Next domain (d)"
				aria-label="Next domain"
				onClick={() => S.stepDomain?.(1)}
			>
				<Kbd keys="d" />
			</button>
			<button
				{...stylex.props(square, tip.end)}
				data-tip="Hide explanation (g)"
				aria-label="Hide explanation"
				onClick={() => S.toggleGuidePane?.()}
			>
				<Icon id="gly-close" />
			</button>
		</span>
	)
}
