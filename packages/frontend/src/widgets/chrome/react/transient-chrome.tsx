import { useStoreFields } from '@shared/lib/use-store-version'
import { Kbd } from '@shared/ui/kbd'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../context'

import { transient } from './transient-chrome.styles'

import type { ReactElement } from 'react'

export function TransientChrome(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('toastMsg', 'golineBuffer')
	return (
		<>
			<div
				{...stylex.props(
					transient.pinned,
					transient.toast,
					!S.toastMsg && transient.hidden,
				)}
				role="status"
			>
				{S.toastMsg}
			</div>
			<div
				{...stylex.props(
					transient.pinned,
					transient.goline,
					!S.golineBuffer && transient.hidden,
				)}
				role="status"
			>
				Go to line
				<b {...stylex.props(transient.line)}>{S.golineBuffer}</b>
				<span {...stylex.props(transient.hint)}>
					<Kbd keys="↵" /> Jump · <Kbd keys="esc" /> Cancel
				</span>
			</div>
		</>
	)
}
