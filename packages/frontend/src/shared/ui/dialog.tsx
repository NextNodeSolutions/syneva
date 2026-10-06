import { useLayoutEffect, useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { DialogBar } from './dialog-bar'
import { dialog } from './dialog.styles'

import type { ReactElement, ReactNode } from 'react'

type DialogLabels = { labelledBy: string; describedBy?: string | undefined }

type DialogProps = DialogLabels & {
	open: boolean
	onClose: () => void
	caption: string
	children: ReactNode
}

export function Dialog({
	open,
	onClose,
	caption,
	children,
	...labels
}: DialogProps): ReactElement {
	const ref = useRef<HTMLDialogElement>(null)
	const pressedBackdrop = useRef(false)
	useLayoutEffect(() => {
		if (!open) return undefined
		return showModal(ref.current)
	}, [open])
	return (
		<dialog
			ref={ref}
			{...stylex.props(dialog.root)}
			aria-labelledby={labels.labelledBy}
			aria-describedby={labels.describedBy}
			onCancel={event => {
				event.preventDefault()
				onClose()
			}}
			onPointerDown={event => {
				pressedBackdrop.current = event.target === event.currentTarget
			}}
			onClick={event => {
				if (
					pressedBackdrop.current &&
					event.target === event.currentTarget
				)
					onClose()
			}}
		>
			<div {...stylex.props(dialog.inner)}>
				<DialogBar caption={caption} onClose={onClose} />
				{children}
			</div>
		</dialog>
	)
}

// Runs in a layout effect for two reasons: the teardown runs BEFORE React removes the element (a modal removed while open never runs its close steps, so focus would not return to the opener).
// React applies autoFocus while the dialog is still closed, where nothing can take focus - the content marks data-autofocus instead, taken once shown.
function showModal(
	element: HTMLDialogElement | null,
): (() => void) | undefined {
	if (!element) return undefined
	element.showModal()
	element.querySelector<HTMLElement>('[data-autofocus]')?.focus()
	return () => element.close()
}
