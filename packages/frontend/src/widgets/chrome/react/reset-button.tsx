import { useStoreFields } from '@shared/lib/use-store-version'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { icon } from '@shared/ui/icon.styles'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { resetMenu, topBar } from './top-bar.styles'

import type { ReactElement } from 'react'

// The dropdown half of the Reset split button: the narrower and the nuclear option. A
// fixed backdrop catches outside clicks without a document listener.
function ResetMenu(): ReactElement {
	const { S } = chromeCtx()
	const close = (): void => S.setResetMenu?.(false)
	const run = (scope: 'approved' | 'all'): void => {
		close()
		void S.reset?.(scope)
	}
	return (
		<>
			<div {...stylex.props(resetMenu.backdrop)} onClick={close} />
			<div {...stylex.props(resetMenu.menu)} role="menu">
				<button
					{...stylex.props(resetMenu.item)}
					role="menuitem"
					onClick={() => run('approved')}
				>
					<span>Reset approved</span>
					<span {...stylex.props(resetMenu.hint)}>
						Only the signed-off files go back to pending
					</span>
				</button>
				<button
					{...stylex.props(resetMenu.item, resetMenu.itemDanger)}
					role="menuitem"
					onClick={() => run('all')}
				>
					<span>Reset all</span>
					<span {...stylex.props(resetMenu.hint)}>
						Decisions and notes, everything
					</span>
				</button>
			</div>
		</>
	)
}

const half = [
	press.control,
	control.base,
	deskControl.compact,
	deskControl.dangerHintTiled,
]

// The Reset split button: the labelled part fires the default scope ('review' - decisions
// and sign-offs drop, the notes survive), the caret opens the dropdown with the narrower
// and the nuclear option. Open state lives in the store so the Esc cascade can close it
// (hotkeys-app) and a store bump mid-menu can't strand a closed-over local flag.
export function ResetButton(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('resetMenuOpen')
	const open = S.resetMenuOpen
	const close = (): void => S.setResetMenu?.(false)
	return (
		<div {...stylex.props(resetMenu.split)}>
			<button
				{...stylex.props(half, topBar.splitStart, tip.host)}
				data-tip="Reset review - keeps the notes (⇧R)"
				onClick={() => {
					close()
					void S.reset?.('review')
				}}
			>
				Reset review
			</button>
			<button
				{...stylex.props(half, deskControl.iconCompact)}
				aria-label="More reset options"
				aria-expanded={open}
				aria-haspopup="menu"
				onClick={() => S.setResetMenu?.(!open)}
			>
				<Icon
					id="gly-chevron"
					css={[icon.small, topBar.caret, open && topBar.caretOpen]}
				/>
			</button>
			{open && <ResetMenu />}
		</div>
	)
}
