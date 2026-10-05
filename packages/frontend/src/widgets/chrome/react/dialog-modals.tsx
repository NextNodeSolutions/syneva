import { useStoreFields } from '@shared/lib/use-store-version'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Kbd } from '@shared/ui/kbd'
import * as stylex from '@stylexjs/stylex'
import { control, field } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { modal } from './modal.styles'

import type { ReactElement } from 'react'

// The confirm dialog (destructive shortcuts route through askConfirm) and the
// Send modal (⇧S receipt + overall note). Visibility flags are store state; the
// buttons and the Enter/Esc hotkeys resolve through the same store methods.

const action = [press.control, control.base, deskControl.compact]

function DialogActions({
	cancel,
	confirm,
	confirmLabel,
	confirmKey,
}: {
	cancel: () => void
	confirm: () => void
	confirmLabel: string
	confirmKey: string
}): ReactElement {
	return (
		<div {...stylex.props(modal.actions)}>
			<button
				{...stylex.props(action, control.outlined)}
				onClick={cancel}
			>
				Cancel <Kbd keys="Esc" />
			</button>
			<button
				{...stylex.props(action, control.primary)}
				onClick={confirm}
			>
				{confirmLabel} <Kbd keys={confirmKey} css={kbd.onFill} />
			</button>
		</div>
	)
}

export function ConfirmModal(): ReactElement | null {
	const { S } = chromeCtx()
	useStoreFields('confirmMsg')
	if (!S.confirmMsg) return null
	return (
		<div
			{...stylex.props(modal.backdrop)}
			onClick={event => {
				if (event.target === event.currentTarget) S.confirmNo?.()
			}}
		>
			<div
				{...stylex.props(modal.sheet, modal.confirm)}
				role="dialog"
				aria-modal="true"
				aria-label="Confirm action"
			>
				<p {...stylex.props(modal.message)}>{S.confirmMsg}</p>
				<DialogActions
					cancel={() => S.confirmNo?.()}
					confirm={() => S.confirmYes?.()}
					confirmLabel="Confirm"
					confirmKey="↵"
				/>
			</div>
		</div>
	)
}

export function SendModal(): ReactElement | null {
	const { S } = chromeCtx()
	useStoreFields('sendOpen', 'sendMsg', 'sendNote')
	if (!S.sendOpen) return null
	return (
		<div
			{...stylex.props(modal.backdrop)}
			onClick={event => {
				if (event.target === event.currentTarget) S.sendCancel?.()
			}}
		>
			<div
				{...stylex.props(modal.sheet)}
				role="dialog"
				aria-modal="true"
				aria-label="Send review to agent"
			>
				<p {...stylex.props(modal.message)}>{S.sendMsg}</p>
				<textarea
					id="sendNote"
					{...stylex.props(field.base, modal.note)}
					value={S.sendNote}
					placeholder={
						'Overall note (optional) \u2014 an overall remark, or what to do after applying'
					}
					onChange={event => {
						S.sendNote = event.target.value
					}}
				/>
				<DialogActions
					cancel={() => S.sendCancel?.()}
					confirm={() => S.sendConfirm?.()}
					confirmLabel="Send"
					confirmKey="⌘↵"
				/>
			</div>
		</div>
	)
}
